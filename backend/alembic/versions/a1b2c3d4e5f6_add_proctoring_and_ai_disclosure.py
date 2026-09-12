"""add proctoring events and project ai tools disclosure

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-09-05 00:00:00.000000

Adds:
- projects.ai_tools_used (self-disclosed, freeform text - there is
  no reliable way to actually detect AI tool usage, so this is
  transparency-based, not surveillance-based)
- participants.proctoring_strikes, participants.flagged_for_review
  (a flag is a signal for a human organizer to review, never an
  automated removal trigger)
- proctoring_events table (webcam check-in/snapshot/face-not-detected
  event log for organizer review)
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("ai_tools_used", sa.Text(), nullable=True),
    )

    op.add_column(
        "participants",
        sa.Column(
            "proctoring_strikes",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "participants",
        sa.Column(
            "flagged_for_review",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.create_table(
        "proctoring_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "hackathon_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("hackathons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(length=30), nullable=False),
        sa.Column("face_detected", sa.Boolean(), nullable=False),
        sa.Column("snapshot_data_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_index(
        "ix_proctoring_events_hackathon_id",
        "proctoring_events",
        ["hackathon_id"],
    )

    op.create_index(
        "ix_proctoring_events_user_id",
        "proctoring_events",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_proctoring_events_user_id", table_name="proctoring_events"
    )
    op.drop_index(
        "ix_proctoring_events_hackathon_id", table_name="proctoring_events"
    )
    op.drop_table("proctoring_events")

    op.drop_column("participants", "flagged_for_review")
    op.drop_column("participants", "proctoring_strikes")

    op.drop_column("projects", "ai_tools_used")
