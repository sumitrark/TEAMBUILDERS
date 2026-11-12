
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.user import User

from app.constants.team_skills import normalize_skill


def get_user_skills(user: User) -> list[str]:
    """Return the user's existing free-text profile skills."""
    skills = user.skills or []

    if not isinstance(skills, list):
        return []

    return [
        skill.strip()
        for skill in skills
        if isinstance(skill, str) and skill.strip()
    ]


async def get_team_recommendations(
    db: AsyncSession,
    team_id: UUID,
    owner_id: UUID,
    limit: int = 10,
):
    # 1. Verify team ownership.
    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.owner_id == owner_id,
        )
    )

    team = result.scalar_one_or_none()

    if team is None:
        return "TEAM_NOT_FOUND"

    required_skills = team.required_skills or []

    if not required_skills:
        return "REQUIRED_SKILLS_NOT_SET"

    required_lookup = {
        normalize_skill(skill): skill
        for skill in required_skills
    }

    # 2. Get accepted members.
    result = await db.execute(
        select(TeamMember.user_id).where(
            TeamMember.team_id == team_id
        )
    )

    member_ids = set(result.scalars().all())
    member_ids.add(team.owner_id)

    # 3. Check remaining team capacity.
    current_member_count = len(member_ids)

    available_slots = max(
        0,
        team.max_members - current_member_count,
    )

    # Do not recommend candidates when the team is full.
    if available_slots == 0:
        return {
            "team_id": team.id,
            "team_name": team.name,
            "required_skills": required_skills,
            "covered_skills": [],
            "missing_skills": list(required_lookup.values()),
            "recommendations": [],
        }

    # 4. Find existing members' skills.
    result = await db.execute(
        select(User).where(
            User.id.in_(member_ids),
            User.is_deleted.is_(False),
        )
    )

    existing_members = result.scalars().all()

    covered_lookup = set()

    for member in existing_members:
        for skill in get_user_skills(member):
            normalized = normalize_skill(skill)

            if normalized in required_lookup:
                covered_lookup.add(normalized)

    covered_skills = [
        required_lookup[key]
        for key in required_lookup
        if key in covered_lookup
    ]

    missing_lookup = {
        key: value
        for key, value in required_lookup.items()
        if key not in covered_lookup
    }

    missing_skills = list(missing_lookup.values())

    # All required skills are already covered.
    if not missing_lookup:
        return {
            "team_id": team.id,
            "team_name": team.name,
            "required_skills": required_skills,
            "covered_skills": covered_skills,
            "missing_skills": [],
            "recommendations": [],
        }

    # 5. Find eligible student candidates.
    result = await db.execute(
        select(User).where(
            User.is_active.is_(True),
            User.is_deleted.is_(False),
            User.role == "student",
            User.id.notin_(member_ids),
        )
    )

    candidates = result.scalars().all()

    # 6. Score candidates by complementary skills.
    recommendations = []

    for candidate in candidates:
        candidate_skills = get_user_skills(candidate)

        matched_lookup = {
            normalize_skill(skill)
            for skill in candidate_skills
        }.intersection(missing_lookup.keys())

        if not matched_lookup:
            continue

        matched_skills = [
            missing_lookup[key]
            for key in missing_lookup
            if key in matched_lookup
        ]

        coverage_score = (
            len(matched_lookup) / len(missing_lookup)
        ) * 100

        total_coverage_score = (
            len(matched_lookup) / len(required_lookup)
        ) * 100

        recommendations.append({
            "user_id": candidate.id,
            "full_name": candidate.full_name,
            "username": candidate.username,
            "college": candidate.college,
            "course": candidate.course,
            "year": candidate.year,
            "bio": candidate.bio,
            "skills": candidate_skills,
            "matched_skills": matched_skills,
            "match_score": round(
                (coverage_score * 0.8)
                + (total_coverage_score * 0.2),
                2,
            ),
        })

    # 7. Sort highest complementary match first.
    recommendations.sort(
        key=lambda item: (
            item["match_score"],
            len(item["matched_skills"]),
        ),
        reverse=True,
    )

    return {
        "team_id": team.id,
        "team_name": team.name,
        "required_skills": required_skills,
        "covered_skills": covered_skills,
        "missing_skills": missing_skills,
        "recommendations": recommendations[:min(limit, available_slots)],
    }

