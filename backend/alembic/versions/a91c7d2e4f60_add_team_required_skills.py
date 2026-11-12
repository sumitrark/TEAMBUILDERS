
"""Add required skills to teams.

Revision ID: a91c7d2e4f60
Revises: 055342e4df0f
"""

from alembic import op
import sqlalchemy as sa


# Revision identifiers
revision = "a91c7d2e4f60"
down_revision = "055342e4df0f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "teams",
        sa.Column(
            "required_skills",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'::json"),
        ),
    )

    # Keep the database default consistent with the model.
    op.alter_column(
        "teams",
        "required_skills",
        server_default=None,
    )


def downgrade() -> None:
    op.drop_column(
        "teams",
        "required_skills",
    )
