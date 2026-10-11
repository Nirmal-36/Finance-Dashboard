import secrets
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.device_auth import (
    decrypt_device_api_key,
    encrypt_device_api_key,
    generate_device_api_key,
    hash_device_api_key,
)
from app.core.deps import get_current_device, get_current_user
from app.models.account import Account
from app.models.device import Device, DevicePairingCode
from app.models.transaction import CategorizationStatus, Transaction, TransactionSource
from app.models.user import User
from app.schemas.device import (
    DeviceCaptureRequest,
    DeviceCaptureResponse,
    DeviceOut,
    DevicePairRequest,
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    PairingCodeResponse,
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
    key here; afterward it is only retrievable through a short-lived
    pairing code (see POST /devices/{device_id}/pairing-code).
    """
    plain_key = generate_device_api_key()
    device = Device(
        user_id=current_user.id,
        device_name=payload.device_name,
        hashed_api_key=hash_device_api_key(plain_key),
        encrypted_api_key=encrypt_device_api_key(plain_key),
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
# Pairing codes — hand a device's existing key to an external tool without
# copy-pasting it
# ---------------------------------------------------------------------------

_PAIR_MAX_FAILURES = 10
_PAIR_FAILURE_WINDOW_SECONDS = 300
# Failed /pair attempts per client IP. In-process only: good enough to make
# brute-forcing a 6-digit, 3-minute code impractical on one worker; put a
# shared limiter (e.g. Redis / reverse proxy) in front for multi-worker deploys.
_pair_failures: dict[str, deque[float]] = defaultdict(deque)


def _pair_client_id(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _check_pair_rate_limit(client: str) -> None:
    failures = _pair_failures[client]
    cutoff = time.monotonic() - _PAIR_FAILURE_WINDOW_SECONDS
    while failures and failures[0] < cutoff:
        failures.popleft()
    if len(failures) >= _PAIR_MAX_FAILURES:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many failed pairing attempts. Try again later.")
    if not failures:
        _pair_failures.pop(client, None)


@router.post("/{device_id}/pairing-code", response_model=PairingCodeResponse)
def create_pairing_code(
    device_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generates a single-use 6-digit code (valid for PAIRING_CODE_TTL_SECONDS,
    3 minutes by default) that POST /devices/pair exchanges for this device's
    API key. Issuing a new code invalidates any earlier unused one.
    """
    device = db.get(Device, device_id)
    if device is None or device.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    if not device.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Device has been revoked")
    if device.encrypted_api_key is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This device was registered before pairing codes existed. Register it again to use a pairing code.",
        )

    now = datetime.now(timezone.utc)
    db.query(DevicePairingCode).filter(
        DevicePairingCode.device_id == device.id, DevicePairingCode.used.is_(False)
    ).update({"used": True}, synchronize_session=False)

    # A code must identify exactly one device, so never reuse a live one.
    live_codes = {
        c for (c,) in db.query(DevicePairingCode.code).filter(
            DevicePairingCode.used.is_(False), DevicePairingCode.expires_at > now
        )
    }
    code = f"{secrets.randbelow(1_000_000):06d}"
    while code in live_codes:
        code = f"{secrets.randbelow(1_000_000):06d}"

    pairing = DevicePairingCode(
        device_id=device.id,
        code=code,
        expires_at=now + timedelta(seconds=settings.PAIRING_CODE_TTL_SECONDS),
    )
    db.add(pairing)
    db.commit()
    return PairingCodeResponse(code=pairing.code, expires_at=pairing.expires_at)


@router.post("/pair", response_model=DeviceRegisterResponse)
def pair_device(payload: DevicePairRequest, request: Request, db: Session = Depends(get_db)):
    """
    Unauthenticated by design: the code itself is the credential. It is
    single-use and short-lived, and only ever maps to a key that already
    exists. Failed attempts are rate-limited per client.
    """
    client = _pair_client_id(request)
    _check_pair_rate_limit(client)

    invalid = HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid, expired, or already-used pairing code")
    now = datetime.now(timezone.utc)

    pairing = db.query(DevicePairingCode).filter(
        DevicePairingCode.code == payload.code.strip(),
        DevicePairingCode.used.is_(False),
        DevicePairingCode.expires_at > now,
    ).first()
    if pairing is None:
        _pair_failures[client].append(time.monotonic())
        raise invalid

    # Atomic compare-and-set so two concurrent requests can't both redeem it.
    claimed = db.query(DevicePairingCode).filter(
        DevicePairingCode.id == pairing.id, DevicePairingCode.used.is_(False)
    ).update({"used": True}, synchronize_session=False)
    db.commit()
    if claimed != 1:
        _pair_failures[client].append(time.monotonic())
        raise invalid

    device = db.get(Device, pairing.device_id)
    plain_key = decrypt_device_api_key(device.encrypted_api_key) if device and device.encrypted_api_key else None
    if device is None or not device.is_active or plain_key is None:
        raise invalid

    return DeviceRegisterResponse(id=device.id, device_name=device.device_name, api_key=plain_key)


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
    if existing is None and payload.reference_id:
        # The same payment often arrives from several sources (bank SMS, Truecaller,
        # the UPI app) worded differently, so the merchant-based hash can differ.
        # A UPI reference number is unique per payment, so match on that too.
        existing = db.query(Transaction).filter(
            Transaction.user_id == device.user_id,
            Transaction.reference_id == payload.reference_id,
            Transaction.amount == payload.amount,
        ).first()
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
