import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.device_auth import generate_device_api_key, hash_device_api_key
from app.core.deps import get_current_device, get_current_user
from app.models.account import Account
from app.models.device import Device
from app.models.transaction import CategorizationStatus, Transaction, TransactionSource
from app.models.user import User
from app.schemas.device import (
    DeviceCaptureRequest,
    DeviceCaptureResponse,
    DeviceOut,
    DeviceRegisterRequest,
    DeviceRegisterResponse,
)
from app.services.categorization import categorize_batch
from app.services.dedup import compute_dedup_hash

router = APIRouter(prefix="/devices", tags=["devices"])


# ---------------------------------------------------------------------------
# Device management — authenticated via normal JWT (the user, in-app)
# ---------------------------------------------------------------------------

@router.post("/register", response_model=DeviceRegisterResponse, status_code=status.HTTP_201_CREATED)
def register_device(
    payload: DeviceRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Called once when the Android app is set up. Returns the plaintext API
    key exactly this one time — the app must store it securely (Android
    Keystore) immediately, since it cannot be retrieved again afterward.
    """
    plain_key = generate_device_api_key()
    device = Device(
        user_id=current_user.id,
        device_name=payload.device_name,
        hashed_api_key=hash_device_api_key(plain_key),
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    return DeviceRegisterResponse(id=device.id, device_name=device.device_name, api_key=plain_key)


@router.get("", response_model=list[DeviceOut])
def list_devices(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Device).filter(Device.user_id == current_user.id).order_by(Device.created_at.desc()).all()


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_device(device_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Soft-revoke: flips is_active off rather than deleting, so past
    capture history stays traceable to a device."""
    device = db.get(Device, device_id)
    if device is None or device.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    device.is_active = False
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Ingestion — authenticated via X-Device-Key (the Accessibility Service, in background)
# ---------------------------------------------------------------------------

@router.post("/ingest", response_model=DeviceCaptureResponse)
def ingest_capture(
    payload: DeviceCaptureRequest,
    device: Device = Depends(get_current_device),
    db: Session = Depends(get_db),
):
    """
    Single-transaction ingestion endpoint for the Accessibility Service.
    One call per captured notification — the service calls this live as
    transactions happen, so batching isn't needed the way it is for PDF
    import. Runs through the exact same dedup_hash logic as the PDF
    pipeline, so a transaction captured live and later also appearing in
    a PDF statement (or vice versa) is only ever stored once.
    """
    account = db.get(Account, payload.account_id)
    if account is None or account.user_id != device.user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    dedup_hash = compute_dedup_hash(device.user_id, float(payload.amount), payload.txn_timestamp, payload.merchant_raw)

    existing = db.query(Transaction).filter(Transaction.user_id == device.user_id, Transaction.dedup_hash == dedup_hash).first()
    if existing:
        return DeviceCaptureResponse(accepted=True, duplicate=True, transaction_id=existing.id)

    # Categorize immediately — device-capture is one-at-a-time, live, so
    # there's no batching win to wait for (unlike the PDF pipeline, which
    # batches many transactions from one statement into a single Gemini call).
    cat_results = categorize_batch([payload.merchant_raw])
    cat_result = cat_results[0]

    from app.models.category import Category
    category = db.query(Category).filter(Category.user_id == device.user_id, Category.name == cat_result.category_name).first()

    txn = Transaction(
        user_id=device.user_id,
        account_id=payload.account_id,
        category_id=category.id if category else None,
        amount=payload.amount,
        type=payload.type,
        txn_timestamp=payload.txn_timestamp,
        merchant_raw=payload.merchant_raw,
        merchant_normalized=cat_result.merchant_normalized,
        reference_id=payload.reference_id,
        source=TransactionSource.DEVICE_CAPTURE,
        dedup_hash=dedup_hash,
        categorization_status=(
            CategorizationStatus.AI_CATEGORIZED if cat_result.confidence > 0 else CategorizationStatus.PENDING
        ),
        ai_confidence=cat_result.confidence,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    return DeviceCaptureResponse(accepted=True, duplicate=False, transaction_id=txn.id)
