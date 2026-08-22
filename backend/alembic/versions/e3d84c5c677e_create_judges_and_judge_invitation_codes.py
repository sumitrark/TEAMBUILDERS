"""create judges and judge invitation codes

Revision ID: e3d84c5c677e
Revises: 5ba9b47a8bdb
Create Date: 2026-08-19

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e3d84c5c677e"
down_revision: Union[str, Sequence[str], None] = "5ba9b47a8bdb"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --------------------------------------------------
    # Add invitation code as nullable first
    # --------------------------------------------------

    op.add_column(
        "hackathons",
        sa.Column(
            "judge_invitation_code",
            sa.String(length=100),
            nullable=True,
        ),
    )

    # --------------------------------------------------
    # Generate codes for existing hackathons
    # --------------------------------------------------

    op.execute(
        """
        UPDATE hackathons
        SET judge_invitation_code =
            'JUDGE-' ||
            substr(
                md5(
                    random()::text ||
                    clock_timestamp()::text
                ),
                1,
                24
            )
        WHERE judge_invitation_code IS NULL
        """
    )

    # --------------------------------------------------
    # Make the column required
    # --------------------------------------------------

    op.alter_column(
        "hackathons",
        "judge_invitation_code",
        existing_type=sa.String(length=100),
        nullable=False,
    )

    # --------------------------------------------------
    # Unique invitation code
    # --------------------------------------------------

    op.create_unique_constraint(
        None,
        "hackathons",
        ["judge_invitation_code"],
    )

    # --------------------------------------------------
    # Judges table
    # --------------------------------------------------

    op.create_table(
        "judges",

        sa.Column(
            "id",
            sa.UUID(),
            nullable=False,
        ),

        sa.Column(
            "hackathon_id",
            sa.UUID(),
            nullable=False,
        ),

        sa.Column(
            "user_id",
            sa.UUID(),
            nullable=False,
        ),

        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["hackathon_id"],
            ["hackathons.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.UniqueConstraint(
            "hackathon_id",
            "user_id",
            name="uq_judge_hackathon_user",
        ),
    )

    op.create_index(
        "ix_judges_hackathon_id",
        "judges",
        ["hackathon_id"],
    )

    op.create_index(
        "ix_judges_user_id",
        "judges",
        ["user_id"],
    )


def downgrade() -> None:

    op.drop_index(
        "ix_judges_user_id",
        table_name="judges",
    )

    op.drop_index(
        "ix_judges_hackathon_id",
        table_name="judges",
    )

    op.drop_table("judges")

    op.drop_constraint(
        None,
        "hackathons",
        type_="unique",
    )

    op.drop_column(
        "hackathons",
        "judge_invitation_code",
    )