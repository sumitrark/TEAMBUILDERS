from fastapi import Depends, HTTPException, status

from app.dependencies.current_user import get_current_user


async def get_current_organizer(
    current_user=Depends(get_current_user),
):
    if current_user.role != "organizer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organizer access required",
        )

    return current_user