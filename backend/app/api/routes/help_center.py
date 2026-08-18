from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db

from app.dependencies.current_user import (
    get_current_user,
)

from app.models.help_center import (
    HelpCenterConversation,
)

from app.schemas.help_center import (
    HelpCenterQuestion,
    HelpCenterChatResponse,
    HelpCenterResponse,
)

from app.services.help_center_service import (
    generate_help_response,
    save_conversation,
    get_user_help_context,
)


router = APIRouter(
    prefix="/help-center",
    tags=["AI Help Center"],
)


# =========================================================
# CHAT
# =========================================================

@router.post(
    "/chat",
    response_model=HelpCenterChatResponse,
)
async def chat(
    payload: HelpCenterQuestion,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    question = payload.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    if len(question) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Question is too long.",
        )

    # -----------------------------------------------------
    # Build context for authenticated user
    # -----------------------------------------------------

    context = await get_user_help_context(
        db=db,
        user_id=current_user.id,
    )

    # -----------------------------------------------------
    # Generate answer
    # -----------------------------------------------------

    category, answer = generate_help_response(
        question=question,
        context=context,
    )

    # -----------------------------------------------------
    # Store conversation
    # -----------------------------------------------------

    conversation = await save_conversation(
        db=db,
        user_id=current_user.id,
        question=question,
        answer=answer,
        category=category,
    )

    return conversation


# =========================================================
# HISTORY
# =========================================================

@router.get(
    "/history",
    response_model=list[HelpCenterResponse],
)
async def history(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(HelpCenterConversation)
        .where(
            HelpCenterConversation.user_id
            == current_user.id
        )
        .order_by(
            HelpCenterConversation.created_at.asc()
        )
    )

    return result.scalars().all()


# =========================================================
# CLEAR HISTORY
# =========================================================

@router.delete(
    "/history"
)
async def clear_history(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(HelpCenterConversation)
        .where(
            HelpCenterConversation.user_id
            == current_user.id
        )
    )

    conversations = result.scalars().all()

    for conversation in conversations:
        await db.delete(conversation)

    await db.commit()

    return {
        "message": "Help Center history cleared."
    }