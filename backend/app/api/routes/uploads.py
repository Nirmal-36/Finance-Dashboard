import os
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.account import Account
from app.models.statement_upload import StatementUpload, UploadStatus
from app.models.user import User
from app.schemas.upload import StatementUploadOut
from app.services.upload_pipeline import process_statement_upload

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("", response_model=StatementUploadOut, status_code=status.HTTP_202_ACCEPTED)
async def upload_statement(
    background_tasks: BackgroundTasks,
    account_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    account = db.get(Account, account_id)
    if account is None or account.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are accepted")

    contents = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit",
        )

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    upload_id = uuid.uuid4()
    storage_path = os.path.join(settings.UPLOAD_DIR, f"{upload_id}.pdf")
    with open(storage_path, "wb") as f:
        f.write(contents)

    upload = StatementUpload(
        id=upload_id,
        user_id=current_user.id,
        account_id=account_id,
        original_filename=file.filename,
        storage_path=storage_path,
        status=UploadStatus.QUEUED,
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    background_tasks.add_task(process_statement_upload, upload.id)

    return upload


@router.get("/{upload_id}", response_model=StatementUploadOut)
def get_upload_status(upload_id: uuid.UUID, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    upload = db.get(StatementUpload, upload_id)
    if upload is None or upload.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")
    return upload


@router.get("", response_model=list[StatementUploadOut])
def list_uploads(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(StatementUpload).filter(StatementUpload.user_id == current_user.id).order_by(StatementUpload.created_at.desc()).all()
