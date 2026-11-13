
"""Create team_messages when it is missing.

Revision ID: c8d4f1a92b70
Revises: a91c7d2e4f60
"""

from alembic import op
import sqlalchemy as sa


revision = "c8d4f1a92b70"
down_revision = "a91c7d2e4f60"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # Preserve an existing team chat table and its data.
    if inspector.has_table("team_messages"):
        return

    op.create_table(
        "team_messages",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column("sender_id", sa.UUID(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["team_id"],
            ["teams.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["sender_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_team_messages_team_id",
        "team_messages",
        ["team_id"],
    )
    op.create_index(
        "ix_team_messages_sender_id",
        "team_messages",
        ["sender_id"],
    )
    op.create_index(
        "ix_team_messages_team_created",
        "team_messages",
        ["team_id", "created_at"],
    )


def downgrade() -> None:
    # Intentionally preserve chat data during downgrade.
    pass
