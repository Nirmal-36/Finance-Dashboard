import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.account import Account, AccountSource
from app.models.user import User
from app.services.demo_data import generate_demo_transactions

router = APIRouter(prefix="/dev", tags=["dev"])


class SeedDemoDataRequest(BaseModel):
    months: int = Field(default=3, ge=1, le=24)
    account_id: uuid.UUID | None = None


class SeedDemoDataResponse(BaseModel):
    account_id: uuid.UUID
    account_name: str
    transactions_created: int


@router.post("/seed-demo-data", response_model=SeedDemoDataResponse)
def seed_demo_data(
    payload: SeedDemoDataRequest | None = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Fills an account with realistic fake transactions for demos. Creates a
    "Demo Account" when no account_id is given. Disabled in production.
    """
    if settings.is_production:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    payload = payload or SeedDemoDataRequest()

    if payload.account_id is not None:
        account = db.get(Account, payload.account_id)
        if account is None or account.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    else:
        account = Account(user_id=current_user.id, name="Demo Account", source=AccountSource.MANUAL)
        db.add(account)
        db.commit()
        db.refresh(account)

    created = generate_demo_transactions(db, current_user.id, account.id, payload.months)
    return SeedDemoDataResponse(account_id=account.id, account_name=account.name, transactions_created=created)
