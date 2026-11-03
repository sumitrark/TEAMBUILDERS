
"""Add team chat messages.

Revision ID: 9e914e5fadf3
Revises: None

This is a baseline revision for an existing database.
The team_messages table already exists in the database.
"""

from typing import Sequence, Union

revision: str = "9e914e5fadf3"
down_revision: Union[str, Sequence[str], None] = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Existing database already contains team_messages.
    pass


def downgrade() -> None:
    # Preserve the existing team_messages table.
    pass
