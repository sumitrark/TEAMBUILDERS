
"""Add team chat messages.

Revision ID: b425193f8076
Revises: 9e914e5fadf3
"""

from typing import Sequence, Union

revision: str = "b425193f8076"
down_revision: Union[str, Sequence[str], None] = "9e914e5fadf3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The team_messages table and its indexes already exist.
    pass


def downgrade() -> None:
    # Preserve the existing team_messages table and indexes.
    pass

