"""
Users API endpoints.
Handles user profile management.
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update current user's profile.
    """
    profile = db.query(Profile).filter(Profile.id == current_user.id).first()
    
    if not profile:
        # Create profile if it doesn't exist
        profile = Profile(
            id=current_user.id,
            username=profile_data.username,
            email=current_user.email
        )
        db.add(profile)
    else:
        # Update existing profile
        if profile_data.username is not None:
            profile.username = profile_data.username
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

