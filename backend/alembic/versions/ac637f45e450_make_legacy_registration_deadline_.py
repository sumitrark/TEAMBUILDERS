import sqlalchemy as sa
from alembic import op

revision = "ac637f45e450"
down_revision = "8e8f178a73c8"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "hackathons",
        "registration_deadline",
        existing_type=sa.Date(),
        nullable=True,
    )


def downgrade():
    op.alter_column(
        "hackathons",
        "registration_deadline",
        existing_type=sa.Date(),
        nullable=False,
    )