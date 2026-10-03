import uuid
from datetime import date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.account import Account
from app.models.category import Category
from app.models.transaction import CategorizationStatus, Transaction, TransactionSource, TransactionType
from app.models.user import User
from app.schemas.transaction import PaginatedTransactions, TransactionCreate, TransactionOut, TransactionUpdate
from app.services.dedup import compute_dedup_hash

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _get_owned_transaction(txn_id: uuid.UUID, user: User, db: Session) -> Transaction:
    txn = db.get(Transaction, txn_id)
    if txn is None or txn.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return txn


@router.get("", response_model=PaginatedTransactions)
def list_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: str | None = Query(default=None, description="Search in merchant name or description"),
    type: TransactionType | None = None,
    category_id: uuid.UUID | None = None,
    account_id: uuid.UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    sort_by: Literal["txn_timestamp", "amount"] = "txn_timestamp",
    sort_order: Literal["asc", "desc"] = "desc",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
):
    q = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if search:
        like = f"%{search}%"
        q = q.filter(or_(Transaction.merchant_raw.ilike(like), Transaction.merchant_normalized.ilike(like), Transaction.description.ilike(like)))
    if type:
        q = q.filter(Transaction.type == type)
    if category_id:
        q = q.filter(Transaction.category_id == category_id)
    if account_id:
        q = q.filter(Transaction.account_id == account_id)
    if date_from:
        q = q.filter(Transaction.txn_timestamp >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        q = q.filter(Transaction.txn_timestamp <= datetime.combine(date_to, datetime.max.time()))

    total = q.count()

    sort_col = Transaction.txn_timestamp if sort_by == "txn_timestamp" else Transaction.amount
    sort_col = sort_col.desc() if sort_order == "desc" else sort_col.asc()
    q = q.order_by(sort_col)

    items = q.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total else 0

    return PaginatedTransactions(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    account = db.get(Account, payload.account_id)
    if account is None or account.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    if payload.category_id:
        category = db.get(Category, payload.category_id)
        if category is None or category.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    dedup_hash = compute_dedup_hash(current_user.id, float(payload.amount), payload.txn_timestamp, payload.merchant_raw)

    existing = db.query(Transaction).filter(Transaction.user_id == current_user.id, Transaction.dedup_hash == dedup_hash).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A matching transaction already exists")

    txn = Transaction(
        user_id=current_user.id,
        account_id=payload.account_id,
        category_id=payload.category_id,
        amount=payload.amount,
        type=payload.type,
        txn_timestamp=payload.txn_timestamp,
        merchant_raw=payload.merchant_raw,
        description=payload.description,
        source=TransactionSource.MANUAL,
        dedup_hash=dedup_hash,
        categorization_status=CategorizationStatus.USER_CONFIRMED if payload.category_id else CategorizationStatus.PENDING,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


@router.patch("/{txn_id}", response_model=TransactionOut)
def update_transaction(
    txn_id: uuid.UUID,
    payload: TransactionUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    txn = _get_owned_transaction(txn_id, current_user, db)

    update_data = payload.model_dump(exclude_unset=True)
    if "category_id" in update_data and update_data["category_id"] is not None:
        category = db.get(Category, update_data["category_id"])
        if category is None or category.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        txn.categorization_status = CategorizationStatus.USER_CONFIRMED

    for field, value in update_data.items():
        setattr(txn, field, value)

    db.commit()
    db.refresh(txn)
    return txn


@router.delete("/{txn_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    txn_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    txn = _get_owned_transaction(txn_id, current_user, db)
    db.delete(txn)
    db.commit()
    return None


@router.get("/export")
def export_transactions(
    format: Literal["csv", "json"] = "csv",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from fastapi.responses import StreamingResponse
    import csv
    import io
    import json as json_lib

    txns = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.txn_timestamp.desc()).all()

    if format == "json":
        data = [
            {
                "id": str(t.id),
                "date": t.txn_timestamp.isoformat(),
                "merchant": t.merchant_normalized or t.merchant_raw,
                "amount": float(t.amount),
                "type": t.type.value,
                "category": t.category.name if t.category else None,
                "source": t.source.value,
            }
            for t in txns
        ]
        return StreamingResponse(
            iter([json_lib.dumps(data, indent=2)]),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=transactions.json"},
        )

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Date", "Merchant", "Amount", "Type", "Category", "Source"])
    for t in txns:
        writer.writerow([
            t.txn_timestamp.isoformat(),
            t.merchant_normalized or t.merchant_raw,
            float(t.amount),
            t.type.value,
            t.category.name if t.category else "",
            t.source.value,
        ])
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )
