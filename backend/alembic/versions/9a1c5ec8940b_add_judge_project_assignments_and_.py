"""add judge project assignments and result announcement

Revision ID: 9a1c5ec8940b
Revises: 84008e27ad59
Create Date: 2026-10-08
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "9a1c5ec8940b"
down_revision: Union[str, Sequence[str], None] = "84008e27ad59"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "hackathons",
        sa.Column(
            "results_announcement_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.create_table(
        "judge_project_assignments",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "judge_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "project_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["judge_id"],
            ["judges.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "judge_id",
            "project_id",
            name="uq_judge_project_assignment",
        ),
    )

    op.create_index(
        "ix_judge_project_assignments_judge_id",
        "judge_project_assignments",
        ["judge_id"],
    )

    op.create_index(
        "ix_judge_project_assignments_project_id",
        "judge_project_assignments",
        ["project_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_judge_project_assignments_project_id",
        table_name="judge_project_assignments",
    )

    op.drop_index(
        "ix_judge_project_assignments_judge_id",
        table_name="judge_project_assignments",
    )

    op.drop_table("judge_project_assignments")

    op.drop_column(
        "hackathons",
        "results_announcement_at",
    )