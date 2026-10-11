"""
Import every model here so that:
1. Alembic's autogenerate can discover all tables via Base.metadata
2. SQLAlchemy relationship() string references (e.g. "User") resolve correctly
   regardless of which module is imported first.
"""
from app.models.user import User, UserRole                      # noqa: F401
from app.models.refresh_token import RefreshToken                # noqa: F401
from app.models.account import Account, AccountSource            # noqa: F401
from app.models.category import Category, DEFAULT_CATEGORIES     # noqa: F401
from app.models.transaction import (                             # noqa: F401
    Transaction,
    TransactionType,
    TransactionSource,
    CategorizationStatus,
)
from app.models.budget import Budget                              # noqa: F401
from app.models.statement_upload import StatementUpload, UploadStatus  # noqa: F401
from app.models.device import Device, DevicePairingCode          # noqa: F401
