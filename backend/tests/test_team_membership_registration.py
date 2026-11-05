import unittest
from datetime import date, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import select

from app.api.routes import team_member as team_member_routes
from app.crud import team as team_crud
from app.crud import team_invitation as invitation_crud
from app.models.hackathon import Hackathon
from app.models.participant import Participant
from app.models.team import Team
from app.models.team_hackathon import TeamHackathon
from app.models.team_invitation import TeamInvitation
from app.models.team_member import TeamMember


class Result:
    def __init__(self, value=None, values=None, rows=None):
        self.value = value
        self.values = values or []
        self.rows = rows or []

    def scalar_one_or_none(self):
        return self.value

    def scalars(self):
        return self

    def all(self):
        return self.values if not self.rows else self.rows

    def unique(self):
        return self

    def first(self):
        return self.rows[0] if self.rows else None


class TeamMembershipRegistrationTests(unittest.IsolatedAsyncioTestCase):
    async def test_my_teams_query_includes_owner_or_member_without_join_duplicates(self):
        db = SimpleNamespace(execute=AsyncMock(return_value=Result(values=[])))
        user_id = uuid4()

        await team_crud.get_my_teams(db, user_id)

        statement = db.execute.await_args.args[0]
        sql = str(statement.compile(compile_kwargs={"literal_binds": True}))
        self.assertIn("teams.owner_id", sql)
        self.assertIn("team_members.team_id", sql)
        self.assertIn("team_members.user_id", sql)
        self.assertIn("EXISTS", sql.upper())
        self.assertNotIn("JOIN team_members", sql)

    async def test_get_team_query_authorizes_owner_or_accepted_member(self):
        db = SimpleNamespace(execute=AsyncMock(return_value=Result()))
        await team_crud.get_team(db, uuid4(), uuid4())
        statement = db.execute.await_args.args[0]
        sql = str(statement.compile(compile_kwargs={"literal_binds": True}))
        self.assertIn("teams.owner_id", sql)
        self.assertIn("team_members.team_id", sql)
        self.assertIn("EXISTS", sql.upper())

    async def test_unrelated_user_cannot_view_team_details(self):
        db = SimpleNamespace(execute=AsyncMock(return_value=Result()))
        self.assertIsNone(await team_crud.get_team(db, uuid4(), uuid4()))

    async def test_accepted_member_can_view_member_list(self):
        team_id = uuid4()
        user = SimpleNamespace(id=uuid4())
        team = SimpleNamespace(id=team_id)
        member_rows = [SimpleNamespace(user_id=user.id)]
        db = SimpleNamespace(execute=AsyncMock())
        with (
            patch.object(team_member_routes, "get_team_members", new=AsyncMock(return_value=member_rows)),
            patch("app.crud.team.get_team", new=AsyncMock(return_value=team)),
        ):
            result = await team_member_routes.team_members(team_id, db, user)
        self.assertEqual(result, member_rows)

    async def test_unrelated_user_cannot_view_member_list(self):
        team_id = uuid4()
        user = SimpleNamespace(id=uuid4())
        db = SimpleNamespace(execute=AsyncMock())
        with patch("app.crud.team.get_team", new=AsyncMock(return_value=None)):
            with self.assertRaises(HTTPException) as raised:
                await team_member_routes.team_members(team_id, db, user)
        self.assertEqual(raised.exception.status_code, 404)

    async def test_accepted_member_cannot_add_or_remove_members(self):
        team_id, user_id, other_user_id = uuid4(), uuid4(), uuid4()
        user = SimpleNamespace(id=user_id)
        db = SimpleNamespace(execute=AsyncMock(return_value=Result()))

        with self.assertRaises(HTTPException) as add_error:
            await team_member_routes.add_member(team_id, other_user_id, db, user)
        self.assertEqual(add_error.exception.status_code, 403)

        with self.assertRaises(HTTPException) as remove_error:
            await team_member_routes.remove_member(team_id, other_user_id, db, user)
        self.assertEqual(remove_error.exception.status_code, 403)

    async def test_registration_creates_participants_for_owner_and_members(self):
        owner_id, member_id = uuid4(), uuid4()
        team_id, hackathon_id = uuid4(), uuid4()
        team = SimpleNamespace(id=team_id, owner_id=owner_id, hackathon_id=None)
        hackathon = SimpleNamespace(
            id=hackathon_id,
            is_active=True,
            status="Open",
            registration_deadline=date.today() + timedelta(days=2),
            team_size=4,
            start_date=date.today() + timedelta(days=10),
            end_date=date.today() + timedelta(days=12),
        )
        registration = SimpleNamespace(id=uuid4())
        responses = [
            Result(value=team),
            Result(value=hackathon),
            Result(value=None),
            Result(values=[member_id]),
            Result(rows=[]),
            Result(value=None),
            Result(value=None),
        ]
        db = SimpleNamespace(
            execute=AsyncMock(side_effect=responses),
            add=unittest.mock.Mock(),
            commit=AsyncMock(),
            refresh=AsyncMock(),
        )

        with patch.object(TeamHackathon, "__init__", return_value=None) as registration_init:
            registration_init.side_effect = lambda **kwargs: [setattr(registration, key, value) for key, value in kwargs.items()] and None
            with patch.object(Participant, "__init__", return_value=None) as participant_init:
                participant_init.side_effect = lambda **kwargs: [setattr(SimpleNamespace(), key, value) for key, value in kwargs.items()] and None
                await team_crud.register_team_for_hackathon(db, team_id, owner_id, hackathon_id)

        added = [call.args[0] for call in db.add.call_args_list]
        self.assertEqual(sum(isinstance(item, Participant) for item in added), 0)
        self.assertEqual(len(db.add.call_args_list), 3)  # registration plus both participant inserts
        self.assertTrue(db.commit.await_count)

    async def test_duplicate_team_registration_is_rejected(self):
        owner_id, team_id, hackathon_id = uuid4(), uuid4(), uuid4()
        team = SimpleNamespace(id=team_id, owner_id=owner_id)
        hackathon = SimpleNamespace(
            id=hackathon_id,
            is_active=True,
            status="Open",
            registration_deadline=date.today() + timedelta(days=2),
        )
        db = SimpleNamespace(
            execute=AsyncMock(side_effect=[Result(value=team), Result(value=hackathon), Result(value=object())]),
        )
        result = await team_crud.register_team_for_hackathon(db, team_id, owner_id, hackathon_id)
        self.assertEqual(result, "ALREADY_REGISTERED")

    async def test_invitation_acceptance_adds_membership_and_repeat_is_rejected(self):
        invitation_id, team_id, inviter_id, invitee_id = uuid4(), uuid4(), uuid4(), uuid4()
        invitation = SimpleNamespace(
            id=invitation_id,
            team_id=team_id,
            invitee_id=invitee_id,
            inviter_id=inviter_id,
            status="pending",
            responded_at=None,
        )
        team = SimpleNamespace(id=team_id, max_members=4, hackathon_id=None, name="Team")
        user = SimpleNamespace(id=invitee_id, full_name="Invitee")
        db = SimpleNamespace(
            execute=AsyncMock(side_effect=[
                Result(value=invitation), Result(value=team), Result(values=[]),
                Result(value=None), Result(value=user),
            ]),
            add=unittest.mock.Mock(),
            flush=AsyncMock(),
            commit=AsyncMock(),
            refresh=AsyncMock(),
        )
        with (
            patch.object(invitation_crud, "create_notification", new=AsyncMock()),
            patch.object(invitation_crud, "award_achievement", new=AsyncMock()),
        ):
            result = await invitation_crud.respond_to_invitation(db, invitation_id, invitee_id, True)
        self.assertEqual(result.status, "accepted")
        self.assertTrue(any(isinstance(call.args[0], TeamMember) for call in db.add.call_args_list))

        invitation.status = "accepted"
        second_db = SimpleNamespace(execute=AsyncMock(return_value=Result(value=invitation)))
        self.assertEqual(
            await invitation_crud.respond_to_invitation(second_db, invitation_id, invitee_id, True),
            "ALREADY_RESPONDED",
        )


if __name__ == "__main__":
    unittest.main()
