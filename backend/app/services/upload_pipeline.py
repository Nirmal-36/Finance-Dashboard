"""
The background job that takes an uploaded PDF statement from QUEUED all
the way to COMPLETED:

  QUEUED -> PARSING (pdfplumber extraction)
         -> dedup check against existing transactions
         -> CATEGORIZING (Gemini batch call on new transactions)
         -> write transactions to DB
         -> COMPLETED (or FAILED, with error_message set, at any stage)

Runs as a FastAPI BackgroundTask — fire-and-forget after the upload
endpoint returns 202. The frontend polls GET /uploads/{id} for status.
"""
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.category import Category
from app.models.statement_upload import StatementUpload, UploadStatus
from app.models.transaction import CategorizationStatus, Transaction, TransactionSource, TransactionType
from app.services.categorization import categorize_batch
from app.services.dedup import compute_dedup_hash
from app.services.pdf_parser import parse_phonepe_statement

logger = logging.getLogger(__name__)


def process_statement_upload(upload_id):
    """
    Entry point invoked as a background task. Opens its own DB session
    since it runs outside the request's dependency-injected session.
    """
    db: Session = SessionLocal()
    try:
        upload = db.get(StatementUpload, upload_id)
        if upload is None:
            logger.error(f"StatementUpload {upload_id} not found when background task started")
            return

        try:
            upload.status = UploadStatus.PARSING
            db.commit()

            parsed_txns = parse_phonepe_statement(upload.storage_path)
            upload.transactions_found = len(parsed_txns)
            db.commit()

            # --- Dedup: filter out anything that already exists ---
            new_txns = []
            skipped = 0
            for p in parsed_txns:
                dedup_hash = compute_dedup_hash(upload.user_id, p.amount, p.txn_timestamp, p.merchant_raw)
                exists = db.query(Transaction).filter(
                    Transaction.user_id == upload.user_id, Transaction.dedup_hash == dedup_hash
                ).first()
                if exists:
                    skipped += 1
                else:
                    new_txns.append((p, dedup_hash))

            upload.transactions_skipped_duplicate = skipped
            db.commit()

            # --- Categorize the new ones ---
            upload.status = UploadStatus.CATEGORIZING
            db.commit()

            categories_by_name = {c.name: c for c in db.query(Category).filter(Category.user_id == upload.user_id).all()}

            cat_results = categorize_batch([p.merchant_raw for p, _ in new_txns]) if new_txns else []

            imported = 0
            for (parsed, dedup_hash), cat_result in zip(new_txns, cat_results):
                category = categories_by_name.get(cat_result.category_name)
                txn = Transaction(
                    user_id=upload.user_id,
                    account_id=upload.account_id,
                    category_id=category.id if category else None,
                    amount=parsed.amount,
                    type=TransactionType.DEBIT if parsed.type == "debit" else TransactionType.CREDIT,
                    txn_timestamp=parsed.txn_timestamp,
                    merchant_raw=parsed.merchant_raw,
                    merchant_normalized=cat_result.merchant_normalized,
                    reference_id=parsed.reference_id,
                    source=TransactionSource.PDF_UPLOAD,
                    dedup_hash=dedup_hash,
                    categorization_status=(
                        CategorizationStatus.AI_CATEGORIZED if cat_result.confidence > 0 else CategorizationStatus.PENDING
                    ),
                    ai_confidence=cat_result.confidence,
                )
                db.add(txn)
                imported += 1

            upload.transactions_imported = imported
            upload.status = UploadStatus.COMPLETED
            upload.completed_at = datetime.now(timezone.utc)
            db.commit()

        except ValueError as e:
            # Parsing failure — user-facing, clear message
            upload.status = UploadStatus.FAILED
            upload.error_message = str(e)
            db.commit()
        except Exception as e:
            logger.exception(f"Unexpected error processing upload {upload_id}")
            upload.status = UploadStatus.FAILED
            upload.error_message = "An unexpected error occurred while processing this statement."
            db.commit()

    finally:
        db.close()
