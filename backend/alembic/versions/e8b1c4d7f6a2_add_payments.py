"""add payments

Revision ID: e8b1c4d7f6a2
Revises: d5e6f8a3c2b1
Create Date: 2026-08-24 00:00:00.000000

Adds:
- users.subscription_plan, users.subscription_status, users.stripe_customer_id
- payment_transactions table
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "e8b1c4d7f6a2"
down_revision = "d5e6f8a3c2b1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "subscription_plan",
            sa.String(length=30),
            nullable=False,
            server_default="free",
        ),
    )
    op.add_column(
        "users",
        sa.Column("subscription_status", sa.String(length=20), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("stripe_customer_id", sa.String(length=255), nullable=True),
    )

    op.create_table(
        "payment_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("plan_code", sa.String(length=30), nullable=False),
        sa.Column(
            "stripe_checkout_session_id",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "stripe_payment_intent_id", sa.String(length=255), nullable=True
        ),
        sa.Column("amount_cents", sa.Integer(), nullable=True),
        sa.Column(
            "currency", sa.String(length=3), nullable=False, server_default="usd"
        ),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_index(
        "ix_payment_transactions_user_id",
        "payment_transactions",
        ["user_id"],
    )

    op.create_unique_constraint(
        "uq_payment_transactions_session_id",
        "payment_transactions",
        ["stripe_checkout_session_id"],
    )

    op.create_index(
        "ix_payment_transactions_session_id",
        "payment_transactions",
        ["stripe_checkout_session_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_payment_transactions_session_id", table_name="payment_transactions"
    )
    op.drop_constraint(
        "uq_payment_transactions_session_id",
        "payment_transactions",
        type_="unique",
    )
    op.drop_index(
        "ix_payment_transactions_user_id", table_name="payment_transactions"
    )
    op.drop_table("payment_transactions")

    op.drop_column("users", "stripe_customer_id")
    op.drop_column("users", "subscription_status")
    op.drop_column("users", "subscription_plan")
