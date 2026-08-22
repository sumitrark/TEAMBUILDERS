"""make timestamps timezone aware

Revision ID: 9a1c2d3e4f50
Revises: 45fd15ae7f51
Create Date: 2026-08-23 00:00:00.000000

Converts every naive `TIMESTAMP WITHOUT TIME ZONE` timestamp column that was
being populated from `datetime.utcnow()` into a proper
`TIMESTAMP WITH TIME ZONE` column. Existing values are assumed to already be
UTC (that's what datetime.utcnow() produced) and are reinterpreted as UTC
rather than converted, so no historical data shifts.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "9a1c2d3e4f50"
down_revision = "45fd15ae7f51"
branch_labels = None
depends_on = None

# (table, column) pairs that need to move from naive -> timezone-aware
TABLE_COLUMNS = [
    ("evaluations", "created_at"),
    ("evaluations", "updated_at"),
    ("achievements", "earned_at"),
    ("hackathons", "created_at"),
    ("hackathons", "updated_at"),
    ("team_hackathons", "registered_at"),
    ("help_center_conversations", "created_at"),
    ("projects", "created_at"),
    ("teams", "created_at"),
    ("content_generations", "created_at"),
    ("content_generations", "updated_at"),
    ("participants", "joined_at"),
    ("judges", "created_at"),
    ("team_members", "joined_at"),
    ("team_invitations", "created_at"),
    ("team_invitations", "responded_at"),
]


def upgrade() -> None:
    for table, column in TABLE_COLUMNS:
        op.alter_column(
            table,
            column,
            type_=sa.DateTime(timezone=True),
            postgresql_using=f"{column} AT TIME ZONE 'UTC'",
        )


def downgrade() -> None:
    for table, column in TABLE_COLUMNS:
        op.alter_column(
            table,
            column,
            type_=sa.DateTime(timezone=False),
            postgresql_using=f"{column} AT TIME ZONE 'UTC'",
        )
