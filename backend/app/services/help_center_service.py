from uuid import UUID

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.help_center import HelpCenterConversation
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.team_invitation import TeamInvitation
from app.models.project import Project
from app.models.participant import Participant
from app.models.hackathon import Hackathon
from app.models.team_hackathon import TeamHackathon
from app.services.achievement_service import award_achievement

# =========================================================
# USER CONTEXT
# =========================================================

async def get_user_help_context(
    db: AsyncSession,
    user_id: UUID,
):
    """
    Collect lightweight platform information for the
    authenticated user.

    This does NOT call an external AI API.
    """

    # -----------------------------------------------------
    # TEAMS
    #
    # A user can be:
    # 1. Team owner
    # 2. Team member
    # -----------------------------------------------------

    owned_result = await db.execute(
        select(Team).where(
            Team.owner_id == user_id
        )
    )

    owned_teams = owned_result.scalars().all()

    member_result = await db.execute(
        select(Team)
        .join(
            TeamMember,
            TeamMember.team_id == Team.id,
        )
        .where(
            TeamMember.user_id == user_id
        )
    )

    member_teams = member_result.scalars().all()

    teams_by_id = {}

    for team in owned_teams:
        teams_by_id[str(team.id)] = team

    for team in member_teams:
        teams_by_id[str(team.id)] = team

    teams = list(teams_by_id.values())

    # -----------------------------------------------------
    # PROJECTS
    # -----------------------------------------------------

    project_result = await db.execute(
        select(Project).where(
            Project.owner_id == user_id
        )
    )

    projects = project_result.scalars().all()

    # -----------------------------------------------------
    # TEAM INVITATIONS
    # -----------------------------------------------------

    invitation_result = await db.execute(
        select(TeamInvitation).where(
            TeamInvitation.invitee_id == user_id
        )
        .order_by(
            TeamInvitation.created_at.desc()
        )
    )

    invitations = invitation_result.scalars().all()

    # -----------------------------------------------------
    # PERSONAL HACKATHONS
    # -----------------------------------------------------

    participant_result = await db.execute(
        select(Hackathon)
        .join(
            Participant,
            Participant.hackathon_id
            == Hackathon.id,
        )
        .where(
            Participant.user_id == user_id
        )
    )

    personal_hackathons = (
        participant_result.scalars().all()
    )

    # -----------------------------------------------------
    # TEAM HACKATHONS
    # -----------------------------------------------------

    team_ids = [
        team.id
        for team in teams
    ]

    team_hackathons = []

    if team_ids:
        team_hackathon_result = await db.execute(
            select(Hackathon)
            .join(
                TeamHackathon,
                TeamHackathon.hackathon_id
                == Hackathon.id,
            )
            .where(
                TeamHackathon.team_id.in_(team_ids)
            )
        )

        team_hackathons = (
            team_hackathon_result.scalars().all()
        )

    # -----------------------------------------------------
    # REMOVE DUPLICATE HACKATHONS
    # -----------------------------------------------------

    hackathons_by_id = {}

    for hackathon in personal_hackathons:
        hackathons_by_id[
            str(hackathon.id)
        ] = hackathon

    for hackathon in team_hackathons:
        hackathons_by_id[
            str(hackathon.id)
        ] = hackathon

    hackathons = list(
        hackathons_by_id.values()
    )

    # -----------------------------------------------------
    # RETURN SMALL, SAFE CONTEXT
    # -----------------------------------------------------

    return {
        "teams": [
            {
                "id": str(team.id),
                "name": team.name,
                "description": team.description,
                "max_members": team.max_members,
                "is_owner": (
                    str(team.owner_id)
                    == str(user_id)
                ),
            }
            for team in teams
        ],

        "projects": [
            {
                "id": str(project.id),
                "title": project.title,
                "description": project.description,
                "tech_stack": project.tech_stack,
                "team_id": (
                    str(project.team_id)
                    if project.team_id
                    else None
                ),
            }
            for project in projects
        ],

        "invitations": [
            {
                "id": str(invitation.id),
                "team_id": str(
                    invitation.team_id
                ),
                "status": invitation.status,
                "created_at": (
                    invitation.created_at.isoformat()
                    if invitation.created_at
                    else None
                ),
            }
            for invitation in invitations
        ],

        "hackathons": [
            {
                "id": str(hackathon.id),
                "title": hackathon.title,
                "organizer": hackathon.organizer,
                "start_date": (
                    hackathon.start_date.isoformat()
                    if hackathon.start_date
                    else None
                ),
                "end_date": (
                    hackathon.end_date.isoformat()
                    if hackathon.end_date
                    else None
                ),
                "status": hackathon.status,
            }
            for hackathon in hackathons
        ],
    }


# =========================================================
# RESPONSE ENGINE
# =========================================================

def generate_help_response(
    question: str,
    context: dict | None = None,
):
    """
    Temporary context-aware knowledge engine.

    Later this function becomes the AI-agent entry point.
    """

    text = " ".join(
        question.lower().strip().split()
    )

    context = context or {}

    teams = context.get("teams", [])
    projects = context.get("projects", [])
    invitations = context.get("invitations", [])
    hackathons = context.get("hackathons", [])

    # =====================================================
    # PERSONAL TEAM QUESTIONS
    # =====================================================

    if (
        "my team" in text
        or "my teams" in text
        or "what teams" in text
        or "which team" in text
    ):
        if teams:
            team_names = ", ".join(
                team["name"]
                for team in teams
            )

            return (
                "team",
                f"You currently have access to "
                f"{len(teams)} team(s): {team_names}."
            )

        return (
            "team",
            "You are not currently associated with "
            "any team. You can create a team from "
            "My Teams or use AI Matchmaker to find "
            "potential teammates."
        )

    # =====================================================
    # CREATE TEAM
    # =====================================================

    if (
        "create team" in text
        or "new team" in text
        or "make a team" in text
        or "start a team" in text
    ):
        return (
            "team",
            "To create a team, open My Teams and select "
            "Create Team. Enter the team name, description, "
            "and maximum number of members, then create "
            "the team."
        )

    # =====================================================
    # INVITATIONS
    # =====================================================

    if (
        "my invitation" in text
        or "my invitations" in text
        or "pending invitation" in text
        or "pending invite" in text
    ):
        pending = [
            invitation
            for invitation in invitations
            if invitation["status"] == "pending"
        ]

        if pending:
            return (
                "team_invitation",
                f"You currently have "
                f"{len(pending)} pending team "
                f"invitation(s). Open Invitations "
                f"from the sidebar to review them."
            )

        return (
            "team_invitation",
            "You currently have no pending team "
            "invitations."
        )

    if (
        "invite" in text
        or "invitation" in text
        or "invite member" in text
        or "invite teammate" in text
    ):
        return (
            "team_invitation",
            "To invite a teammate, open My Teams, "
            "select your team, and choose Invite Member. "
            "The invited user can then review the request "
            "from Invitations and accept or decline it."
        )

    # =====================================================
    # PROJECTS
    # =====================================================

    if (
        "my project" in text
        or "my projects" in text
        or "what projects" in text
    ):
        if projects:
            project_names = ", ".join(
                project["title"]
                for project in projects
            )

            return (
                "project",
                f"You currently have "
                f"{len(projects)} project(s): "
                f"{project_names}."
            )

        return (
            "project",
            "You don't currently have any projects. "
            "You can create one from Projects."
        )

    if (
        "create project" in text
        or "new project" in text
        or "add project" in text
    ):
        return (
            "project",
            "Open Projects and choose Create Project. "
            "You can provide the project title, description, "
            "technology stack, GitHub URL, demo URL, and "
            "optionally associate it with a team."
        )

    # =====================================================
    # HACKATHONS
    # =====================================================

    if (
        "my hackathon" in text
        or "my hackathons" in text
        or "which hackathon" in text
        or "what hackathons did i join" in text
    ):
        if hackathons:
            names = ", ".join(
                hackathon["title"]
                for hackathon in hackathons
            )

            return (
                "hackathon",
                f"You are currently associated with "
                f"{len(hackathons)} hackathon(s): {names}."
            )

        return (
            "hackathon",
            "You are not currently associated with "
            "any hackathons."
        )

    if (
        "join hackathon" in text
        or "join a hackathon" in text
        or "register for hackathon" in text
        or "participate in hackathon" in text
    ):
        return (
            "hackathon",
            "Open Explore Hackathons, select the "
            "hackathon you want, review its details, "
            "and choose Join to participate."
        )

    # =====================================================
    # MATCHMAKER
    # =====================================================

    if (
        "matchmaker" in text
        or "find teammate" in text
        or "find teammates" in text
        or "find team member" in text
    ):
        return (
            "ai_matchmaker",
            "AI Matchmaker helps you discover suitable "
            "teammates using skills and preferred roles. "
            "Open AI Matchmaker from the dashboard to "
            "view recommendations."
        )

    # =====================================================
    # SCHEDULE
    # =====================================================

    if (
        "schedule conflict" in text
        or "hackathon conflict" in text
        or "date conflict" in text
        or "overlap" in text
    ):
        return (
            "schedule",
            "TEAMBUILDERS checks hackathon dates when "
            "team participation is involved. If a member "
            "has overlapping hackathon participation, "
            "the platform can prevent the conflicting "
            "registration."
        )

    # =====================================================
    # CONTENT STUDIO
    # =====================================================

    if (
        "content studio" in text
        or "content creation" in text
        or "generate content" in text
        or "social media" in text
    ):
        return (
            "content_studio",
            "AI Content Studio helps you prepare "
            "platform-specific content for services "
            "such as LinkedIn, Twitter, and Instagram. "
            "The real AI model will be integrated "
            "during the final AI phase."
        )

    # =====================================================
    # PROFILE
    # =====================================================

    if (
        "profile" in text
        or "edit my profile" in text
        or "update my profile" in text
    ):
        return (
            "profile",
            "Open Profile from the dashboard to update "
            "your personal information, skills, preferred "
            "roles, biography, GitHub, LinkedIn, and "
            "portfolio information."
        )

    # =====================================================
    # NOTIFICATIONS
    # =====================================================

    if (
        "notification" in text
        or "notifications" in text
        or "notification bell" in text
    ):
        return (
            "notifications",
            "Use the notification bell in the top bar "
            "to view important platform updates. "
            "Team invitations can also be reviewed "
            "from the Invitations section."
        )

    # =====================================================
    # GENERAL
    # =====================================================

    if (
        text == "help"
        or "need help" in text
        or "how does this work" in text
        or "what can i do" in text
    ):
        return (
            "general",
            "I can help you with your teams, invitations, "
            "hackathons, projects, AI Matchmaker, schedule "
            "conflicts, AI Content Studio, notifications, "
            "profiles, and other TEAMBUILDERS features."
        )

    # =====================================================
    # DEFAULT
    # =====================================================

    return (
        "general",
        "I can help you with TEAMBUILDERS teams, "
        "hackathons, invitations, projects, AI Matchmaker, "
        "schedule conflicts, AI Content Studio, profiles, "
        "notifications, and other platform features. "
        "Try asking about something specific."
    )


# =========================================================
# SAVE CONVERSATION
# =========================================================

async def save_conversation(
    db: AsyncSession,
    user_id,
    question: str,
    answer: str,
    category: str,
):
    conversation = HelpCenterConversation(
        user_id=user_id,
        question=question,
        answer=answer,
        category=category,
    )

    db.add(conversation)

    await db.commit()
    await db.refresh(conversation)


    await award_achievement(
    db=db,
    user_id=user_id,
    code="HELP_SEEKER",
    )
    return conversation