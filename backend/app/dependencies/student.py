from fastapi import Depends, HTTPException, status

from app.dependencies.current_user import get_current_user


async def get_current_student(
    current_user=Depends(get_current_user),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required",
        )

    return current_user