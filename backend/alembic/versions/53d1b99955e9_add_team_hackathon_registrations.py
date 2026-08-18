"""add team hackathon registrations

Revision ID: 53d1b99955e9
Revises: c61f5a0ad00b
Create Date: 2026-08-15 23:40:20.769052

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "53d1b99955e9"
down_revision: Union[str, Sequence[str], None] = "c61f5a0ad00b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "team_hackathons",

        sa.Column(
            "id",
            sa.UUID(),
            nullable=False,
        ),

        sa.Column(
            "team_id",
            sa.UUID(),
            nullable=False,
        ),

        sa.Column(
            "hackathon_id",
            sa.UUID(),
            nullable=False,
        ),

        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
            server_default="registered",
        ),

        sa.Column(
            "registered_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.ForeignKeyConstraint(
            ["team_id"],
            ["teams.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["hackathon_id"],
            ["hackathons.id"],
            ondelete="CASCADE",
        ),

        sa.UniqueConstraint(
            "team_id",
            "hackathon_id",
            name="uq_team_hackathon",
        ),
    )


def downgrade() -> None:
    op.execute(
        "DROP TABLE IF EXISTS team_hackathons"
    )