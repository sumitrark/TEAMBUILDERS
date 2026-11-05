"""add participant workspace presence

Revision ID: df82e4c2c1f9
Revises: 084d2e3f4a5b
Create Date: 2026-09-29 22:40:00.579261

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'df82e4c2c1f9'
down_revision: Union[str, Sequence[str], None] = '084d2e3f4a5b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "participants",
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "participants",
        "last_seen_at",
    )
