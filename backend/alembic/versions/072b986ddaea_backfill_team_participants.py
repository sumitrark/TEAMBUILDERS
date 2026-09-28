"""Backfill participants for registered teams.

Revision ID: 072b986ddaea
Revises: 061a875ccdc9
"""

from alembic import op
import sqlalchemy as sa


revision = "072b986ddaea"
down_revision = "061a875ccdc9"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()

    # Insert team owners.
    bind.execute(
        sa.text(
            """
            INSERT INTO participants (
                id,
                user_id,
                hackathon_id,
                team_id,
                status,
                joined_at,
                proctoring_strikes,
                flagged_for_review
            )
            SELECT
                gen_random_uuid(),
                t.owner_id,
                th.hackathon_id,
                t.id,
                'Joined',
                NOW(),
                0,
                FALSE
            FROM team_hackathons th
            JOIN teams t
                ON t.id = th.team_id
            WHERE th.status = 'registered'
              AND NOT EXISTS (
                  SELECT 1
                  FROM participants p
                  WHERE p.user_id = t.owner_id
                    AND p.hackathon_id = th.hackathon_id
              )
            """
        )
    )

    # Insert team members.
    bind.execute(
        sa.text(
            """
            INSERT INTO participants (
                id,
                user_id,
                hackathon_id,
                team_id,
                status,
                joined_at,
                proctoring_strikes,
                flagged_for_review
            )
            SELECT
                gen_random_uuid(),
                tm.user_id,
                th.hackathon_id,
                t.id,
                'Joined',
                NOW(),
                0,
                FALSE
            FROM team_hackathons th
            JOIN teams t
                ON t.id = th.team_id
            JOIN team_members tm
                ON tm.team_id = t.id
            WHERE th.status = 'registered'
              AND NOT EXISTS (
                  SELECT 1
                  FROM participants p
                  WHERE p.user_id = tm.user_id
                    AND p.hackathon_id = th.hackathon_id
              )
            """
        )
    )


def downgrade():
    # Remove only participant rows that are attributable to a registered
    # TeamHackathon relationship. Existing standalone participants are kept.
    bind = op.get_bind()

    bind.execute(
        sa.text(
            """
            DELETE FROM participants p
            USING team_hackathons th
            WHERE p.hackathon_id = th.hackathon_id
              AND p.team_id = th.team_id
              AND th.status = 'registered'
            """
        )
    )

