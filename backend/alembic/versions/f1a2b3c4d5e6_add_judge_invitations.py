"""add judge invitations

Revision ID: f1a2b3c4d5e6
Revises: e8b1c4d7f6a2
Create Date: 2026-08-24 00:00:00.000000

Adds judge_invitations: a token-based invitation that supports
inviting a judge by email whether or not they have an account yet.
Separate from the `judges` table, which represents an active,
accepted assignment - a Judge row is only created once an invitation
is explicitly accepted.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "f1a2b3c4d5e6"
down_revision = "e8b1c4d7f6a2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "judge_invitations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "hackathon_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("hackathons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "organizer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("invited_email", sa.String(length=255), nullable=False),
        sa.Column(
            "invited_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("declined_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_index(
        "ix_judge_invitations_hackathon_id",
        "judge_invitations",
        ["hackathon_id"],
    )

    op.create_index(
        "ix_judge_invitations_invited_email",
        "judge_invitations",
        ["invited_email"],
    )

    op.create_unique_constraint(
        "uq_judge_invitations_token",
        "judge_invitations",
        ["token"],
    )

    op.create_index(
        "ix_judge_invitations_token",
        "judge_invitations",
        ["token"],
    )


def downgrade() -> None:
    op.drop_index("ix_judge_invitations_token", table_name="judge_invitations")
    op.drop_constraint(
        "uq_judge_invitations_token", "judge_invitations", type_="unique"
    )
    op.drop_index(
        "ix_judge_invitations_invited_email", table_name="judge_invitations"
    )
    op.drop_index(
        "ix_judge_invitations_hackathon_id", table_name="judge_invitations"
    )
    op.drop_table("judge_invitations")
