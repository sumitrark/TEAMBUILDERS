"""add ai evaluations table

Revision ID: d5e6f8a3c2b1
Revises: c7a4f2e9b1d3
Create Date: 2026-08-23 00:00:00.000000

Adds ai_evaluations: one advisory AI-assisted evaluation per project,
kept fully separate from the authoritative human `evaluations` table.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "d5e6f8a3c2b1"
down_revision = "c7a4f2e9b1d3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_evaluations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "project_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "requested_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("innovation_score", sa.Integer(), nullable=False),
        sa.Column("technical_score", sa.Integer(), nullable=False),
        sa.Column("impact_score", sa.Integer(), nullable=False),
        sa.Column("feasibility_score", sa.Integer(), nullable=False),
        sa.Column("overall_score", sa.Integer(), nullable=False),
        sa.Column("ui_ux_notes", sa.Text(), nullable=True),
        sa.Column("strengths", sa.JSON(), nullable=False),
        sa.Column("weaknesses", sa.JSON(), nullable=False),
        sa.Column("suggestions", sa.JSON(), nullable=False),
        sa.Column("potential_issues", sa.JSON(), nullable=False),
        sa.Column("model_name", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_index(
        "ix_ai_evaluations_project_id",
        "ai_evaluations",
        ["project_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_ai_evaluations_project_id", table_name="ai_evaluations")
    op.drop_table("ai_evaluations")
