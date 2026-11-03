"""merge team chat and judge assignments

Revision ID: 8e8f178a73c8
Revises: 9a1c5ec8940b, b425193f8076
Create Date: 2026-11-03 13:39:33.672347

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8e8f178a73c8'
down_revision: Union[str, Sequence[str], None] = ('9a1c5ec8940b', 'b425193f8076')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
