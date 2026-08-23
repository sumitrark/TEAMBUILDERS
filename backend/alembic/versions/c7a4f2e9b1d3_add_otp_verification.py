"""add otp verification

Revision ID: c7a4f2e9b1d3
Revises: b3f8e1a2c9d7
Create Date: 2026-08-23 00:00:00.000000

Adds:
- users.mobile_number, users.phone_verified
- otp_verifications table (salted-hash OTP challenges with expiry,
  attempt limiting, and resend/rate-limit bookkeeping)
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "c7a4f2e9b1d3"
down_revision = "b3f8e1a2c9d7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("mobile_number", sa.String(length=20), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "phone_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.create_unique_constraint(
        "uq_users_mobile_number",
        "users",
        ["mobile_number"],
    )

    op.create_table(
        "otp_verifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "purpose",
            sa.String(length=30),
            nullable=False,
            server_default="phone_verification",
        ),
        sa.Column("mobile_number", sa.String(length=20), nullable=False),
        sa.Column("otp_hash", sa.String(length=64), nullable=False),
        sa.Column("salt", sa.String(length=32), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "attempts", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "max_attempts", sa.Integer(), nullable=False, server_default="5"
        ),
        sa.Column(
            "send_count", sa.Integer(), nullable=False, server_default="1"
        ),
        sa.Column(
            "window_started_at", sa.DateTime(timezone=True), nullable=False
        ),
        sa.Column("last_sent_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint(
            "user_id", "purpose", name="uq_otp_verifications_user_purpose"
        ),
    )

    op.create_index(
        "ix_otp_verifications_user_id",
        "otp_verifications",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_otp_verifications_user_id", table_name="otp_verifications")
    op.drop_table("otp_verifications")
    op.drop_constraint("uq_users_mobile_number", "users", type_="unique")
    op.drop_column("users", "phone_verified")
    op.drop_column("users", "mobile_number")
