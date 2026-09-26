"""add hackathon datetime lifecycle fields

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-06 00:00:00.000000

Adds precise, timezone-aware datetime columns for the hackathon
lifecycle: registration_start, registration_end, hackathon_start,
hackathon_end. The existing date-only columns (registration_deadline,
start_date, end_date) are NOT removed or rewritten - too much of the
codebase (schemas, CRUD, frontend forms) reads them directly, and
dropping them in the same pass as this feature would be a much
larger, riskier blast radius than this migration needs to take on.
They're left in place, and new organizer-facing forms should write
to both until a later cleanup pass fully retires them.

BACKFILL ASSUMPTION for existing rows (documented per the requirement
to state the conversion assumption used):
- hackathon_start = start_date at 00:00:00 UTC
- hackathon_end   = end_date at 23:59:59 UTC
- registration_end = registration_deadline at 23:59:59 UTC
- registration_start = the hackathon's created_at timestamp (the
  most defensible assumption available - we don't know when the
  organizer actually intended registration to open, but we do know
  registration was already accepting entries from the moment the
  hackathon record existed, since there was no registration_start
  concept before this migration).
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "hackathons",
        sa.Column("registration_start", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "hackathons",
        sa.Column("registration_end", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "hackathons",
        sa.Column("hackathon_start", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "hackathons",
        sa.Column("hackathon_end", sa.DateTime(timezone=True), nullable=True),
    )

    # Backfill from existing date-only columns using the documented
    # assumption above. Written as raw SQL so it works identically
    # against the real Postgres column types regardless of ORM state.
    op.execute(
        """
        UPDATE hackathons
        SET
            hackathon_start = (start_date::timestamp AT TIME ZONE 'UTC'),
            hackathon_end = ((end_date::timestamp + interval '23:59:59') AT TIME ZONE 'UTC'),
            registration_end = ((registration_deadline::timestamp + interval '23:59:59') AT TIME ZONE 'UTC'),
            registration_start = created_at
        """
    )


def downgrade() -> None:
    op.drop_column("hackathons", "hackathon_end")
    op.drop_column("hackathons", "hackathon_start")
    op.drop_column("hackathons", "registration_end")
    op.drop_column("hackathons", "registration_start")
