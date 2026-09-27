"""add face match fields

Revision ID: 084d2e3f4a5b
Revises: 083c1d2e3f4a
"""

from alembic import op
import sqlalchemy as sa


revision = "084d2e3f4a5b"
down_revision = "083c1d2e3f4a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "proctoring_events",
        sa.Column("face_match_status", sa.String(length=20), nullable=True),
    )
    op.add_column(
        "proctoring_events",
        sa.Column("face_similarity", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("proctoring_events", "face_similarity")
    op.drop_column("proctoring_events", "face_match_status")
