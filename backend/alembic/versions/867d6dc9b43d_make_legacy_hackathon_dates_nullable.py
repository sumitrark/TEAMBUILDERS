"""make legacy hackathon dates nullable

Revision ID: 867d6dc9b43d
Revises: ac637f45e450
Create Date: 2026-11-04 22:20:29.021865

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '867d6dc9b43d'
down_revision: Union[str, Sequence[str], None] = 'ac637f45e450'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
