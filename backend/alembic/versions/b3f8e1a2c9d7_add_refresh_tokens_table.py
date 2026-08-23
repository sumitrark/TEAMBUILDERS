"""add refresh_tokens table

Revision ID: b3f8e1a2c9d7
Revises: 9a1c2d3e4f50
Create Date: 2026-08-23 00:00:00.000000

Adds server-side storage for issued refresh tokens so they can be rotated
and revoked (logout, logout-everywhere, stolen-token reuse detection).
Only a SHA-256 hash of each token is stored, never the raw JWT.

NOTE: this depends on 9a1c2d3e4f50 (make timestamps timezone aware). If you
haven't applied that migration/patch yet, apply it first.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "b3f8e1a2c9d7"
down_revision = "9a1c2d3e4f50"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("replaced_by_token_hash", sa.String(length=64), nullable=True),
    )

    op.create_index(
        "ix_refresh_tokens_user_id",
        "refresh_tokens",
        ["user_id"],
    )

    op.create_unique_constraint(
        "uq_refresh_tokens_token_hash",
        "refresh_tokens",
        ["token_hash"],
    )

    op.create_index(
        "ix_refresh_tokens_token_hash",
        "refresh_tokens",
        ["token_hash"],
    )


def downgrade() -> None:
    op.drop_index("ix_refresh_tokens_token_hash", table_name="refresh_tokens")
    op.drop_constraint(
        "uq_refresh_tokens_token_hash",
        "refresh_tokens",
        type_="unique",
    )
    op.drop_index("ix_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
