from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

from app.services.achievement_service import (
    award_achievement,
)


# =========================================================
# NORMALIZE VALUES
# =========================================================

def normalize(
    values: list[str] | None,
) -> set[str]:

    if not values:
        return set()

    return {
        value.strip().lower()
        for value in values
        if value and value.strip()
    }


# =========================================================
# CALCULATE MATCH
# =========================================================

def calculate_match(
    current_user: User,
    candidate: User,
) -> tuple[
    float,
    list[str],
    list[str],
]:

    current_skills = normalize(
        current_user.skills
    )

    candidate_skills = normalize(
        candidate.skills
    )

    current_roles = normalize(
        current_user.preferred_roles
    )

    candidate_roles = normalize(
        candidate.preferred_roles
    )

    matched_skills = sorted(
        current_skills.intersection(
            candidate_skills
        )
    )

    matched_roles = sorted(
        current_roles.intersection(
            candidate_roles
        )
    )

    # -----------------------------------------------------
    # Skill score - 50%
    # -----------------------------------------------------

    if current_skills:
        skill_score = (
            len(matched_skills)
            / len(current_skills)
        )
    else:
        skill_score = 0.0

    # -----------------------------------------------------
    # Role score - 30%
    # -----------------------------------------------------

    if current_roles:
        role_score = (
            len(matched_roles)
            / len(current_roles)
        )
    else:
        role_score = 0.0

    # -----------------------------------------------------
    # Course score - 10%
    # -----------------------------------------------------

    course_score = 0.0

    if (
        current_user.course
        and candidate.course
        and current_user.course.lower()
        == candidate.course.lower()
    ):
        course_score = 1.0

    # -----------------------------------------------------
    # Profile completeness - 10%
    # -----------------------------------------------------

    profile_fields = [
        candidate.bio,
        candidate.github_url,
        candidate.linkedin_url,
        candidate.portfolio_url,
        candidate.skills,
        candidate.preferred_roles,
    ]

    completed = sum(
        1
        for field in profile_fields
        if field
    )

    profile_score = (
        completed / len(profile_fields)
    )

    # -----------------------------------------------------
    # Final score
    # -----------------------------------------------------

    score = (
        skill_score * 50
        + role_score * 30
        + course_score * 10
        + profile_score * 10
    )

    return (
        round(score, 2),
        matched_skills,
        matched_roles,
    )


# =========================================================
# GET RECOMMENDATIONS
# =========================================================

async def get_recommendations(
    db: AsyncSession,
    current_user: User,
    limit: int = 10,
):

    # -----------------------------------------------------
    # ONLY STUDENTS CAN BE RECOMMENDED
    #
    # Organizers and judges must never appear as
    # potential teammates.
    # -----------------------------------------------------

    result = await db.execute(
        select(User).where(
            User.id != current_user.id,
            User.is_active == True,
            User.role == "student",
        )
    )

    candidates = result.scalars().all()

    recommendations = []

    for candidate in candidates:

        (
            score,
            matched_skills,
            matched_roles,
        ) = calculate_match(
            current_user,
            candidate,
        )

        recommendations.append(
            {
                "user_id": candidate.id,
                "full_name": candidate.full_name,
                "username": candidate.username,

                "college": candidate.college,
                "course": candidate.course,
                "year": candidate.year,

                "bio": candidate.bio,

                "skills": (
                    candidate.skills
                    or []
                ),

                "preferred_roles": (
                    candidate.preferred_roles
                    or []
                ),

                "match_score": score,

                "matched_skills": (
                    matched_skills
                ),

                "matched_roles": (
                    matched_roles
                ),
            }
        )

    # -----------------------------------------------------
    # HIGHEST MATCH FIRST
    # -----------------------------------------------------

    recommendations.sort(
        key=lambda item: item["match_score"],
        reverse=True,
    )

    # -----------------------------------------------------
    # AWARD AI EXPLORER
    #
    # Only after recommendations are successfully
    # calculated.
    # -----------------------------------------------------

    await award_achievement(
        db=db,
        user_id=current_user.id,
        code="AI_EXPLORER",
    )

    return recommendations[:limit]