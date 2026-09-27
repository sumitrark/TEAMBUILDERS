"""add face reference photos

Revision ID: 083c1d2e3f4a
Revises: 072b986ddaea
"""

from alembic import op
import sqlalchemy as sa


revision = "083c1d2e3f4a"
down_revision = "072b986ddaea"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "face_reference_photos",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("photo_data_url", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_table("face_reference_photos")
