"""device pairing codes

Revision ID: a7c3d9f1b2e4
Revises: e0045e3892cb
Create Date: 2026-10-11 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a7c3d9f1b2e4'
down_revision: Union[str, None] = 'e0045e3892cb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('devices', sa.Column('encrypted_api_key', sa.Text(), nullable=True))
    op.create_table('device_pairing_codes',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('device_id', sa.UUID(), nullable=False),
    sa.Column('code', sa.String(length=6), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('used', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_device_pairing_codes_device_id'), 'device_pairing_codes', ['device_id'], unique=False)
    op.create_index(op.f('ix_device_pairing_codes_code'), 'device_pairing_codes', ['code'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_device_pairing_codes_code'), table_name='device_pairing_codes')
    op.drop_index(op.f('ix_device_pairing_codes_device_id'), table_name='device_pairing_codes')
    op.drop_table('device_pairing_codes')
    op.drop_column('devices', 'encrypted_api_key')
