
"""add hackathon participation mode

Revision ID: 055342e4df0f
Revises: 867d6dc9b43d
Create Date: 2026-11-11 21:26:54.427629
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "055342e4df0f"
down_revision: Union[str, Sequence[str], None] = "867d6dc9b43d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "hackathons",
        sa.Column(
            "participation_mode",
            sa.String(length=20),
            nullable=False,
            server_default="both",
        ),
    )


def downgrade() -> None:
    op.drop_column("hackathons", "participation_mode")
