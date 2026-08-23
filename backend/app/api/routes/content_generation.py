from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import (
    get_current_user,
)

from app.schemas.content_generation import (
    ContentGenerationCreate,
    ContentGenerationResponse,
)

from app.crud.content_generation import (
    get_user_content_generations,
)

from app.services.content_generation_service import (
    create_generated_content,
)


router = APIRouter(
    prefix="/content",
    tags=["AI Content Studio"],
)


@router.post(
    "/generate",
    response_model=ContentGenerationResponse,
)
async def generate_content_endpoint(
    data: ContentGenerationCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return await create_generated_content(
            db=db,
            user_id=current_user.id,
            project_id=data.project_id,
            platform=data.platform,
            content_type=data.content_type,
            tone=data.tone,
            prompt=data.prompt,
        )

    except ValueError as exc:
        message = str(exc)

        status_code = (
            status.HTTP_429_TOO_MANY_REQUESTS
            if "limit" in message.lower()
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )

        raise HTTPException(
            status_code=status_code,
            detail=message,
        ) from exc


@router.get(
    "/history",
    response_model=list[ContentGenerationResponse],
)
async def get_content_history(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):

    return await get_user_content_generations(
        db=db,
        user_id=current_user.id,
    )