from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.user_preference import UserPreference
from app.schemas.user_preference import (
    UserPreferenceCreate,
    UserPreferenceUpdate,
    UserPreferenceResponse
)

router = APIRouter()


@router.post("/", response_model=UserPreferenceResponse, status_code=status.HTTP_201_CREATED)
def create_preferences(
    preferences: UserPreferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or update user preferences"""
    # Check if preferences already exist
    existing = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preferences already exist. Use PUT to update."
        )
    
    db_preferences = UserPreference(
        user_id=current_user.id,
        **preferences.model_dump()
    )
    db.add(db_preferences)
    db.commit()
    db.refresh(db_preferences)
    
    return db_preferences


@router.get("/", response_model=UserPreferenceResponse)
def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user preferences"""
    preferences = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id
    ).first()
    
    if not preferences:
        # Return default preferences
        return UserPreferenceResponse(
            id=0,
            user_id=current_user.id,
            dietary_type="veg",
            cuisine_preferences=[],
            spice_level="medium",
            allergens=[],
            min_budget=None,
            max_budget=None,
            favorite_restaurants=[],
            disliked_items=[]
        )
    
    return preferences


@router.put("/", response_model=UserPreferenceResponse)
def update_preferences(
    preferences: UserPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user preferences"""
    db_preferences = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id
    ).first()
    
    if not db_preferences:
        # Create new preferences
        db_preferences = UserPreference(
            user_id=current_user.id,
            **preferences.model_dump(exclude_unset=True)
        )
        db.add(db_preferences)
    else:
        # Update existing preferences
        for field, value in preferences.model_dump(exclude_unset=True).items():
            setattr(db_preferences, field, value)
    
    db.commit()
    db.refresh(db_preferences)
    
    return db_preferences


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete user preferences"""
    db_preferences = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id
    ).first()
    
    if db_preferences:
        db.delete(db_preferences)
        db.commit()
    
    return None
