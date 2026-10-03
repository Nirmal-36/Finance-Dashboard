import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# Default categories seeded for every new user — matches the AI
# categorization taxonomy used in services/categorization.py, so Gemini's
# output always maps onto something that exists.
DEFAULT_CATEGORIES = [
    ("Food & Dining", "#f97316"),
    ("Groceries", "#84cc16"),
    ("Transport", "#3b82f6"),
    ("Shopping", "#ec4899"),
    ("Bills & Utilities", "#ef4444"),
    ("Entertainment", "#a855f7"),
    ("Health & Fitness", "#14b8a6"),
    ("Rent & Housing", "#6366f1"),
    ("Education", "#06b6d4"),
    ("Transfers", "#64748b"),
    ("Income", "#22c55e"),
    ("Investments", "#eab308"),
    ("Other", "#9ca3af"),
]


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(7), default="#9ca3af")  # hex color for charts
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)  # seeded default vs user-created

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    transactions: Mapped[list["Transaction"]] = relationship(back_populates="category")
    budgets: Mapped[list["Budget"]] = relationship(back_populates="category", cascade="all, delete-orphan")
