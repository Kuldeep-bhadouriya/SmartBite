from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class RecommendationType(str):
    COLLABORATIVE = "collaborative"
    PREFERENCE = "preference"
    TRENDING = "trending"
    SIMILAR = "similar"
    HISTORY = "history"


# Meal Recommendation Schemas
class MealRecommendationResponse(BaseModel):
    id: int
    menu_item_id: int
    score: float
    reason: Optional[str]
    recommendation_type: str
    
    # Include menu item details
    menu_item: Optional[dict] = None
    restaurant: Optional[dict] = None
    
    class Config:
        from_attributes = True


class RecommendationRequest(BaseModel):
    limit: int = Field(default=10, ge=1, le=50)
    recommendation_type: Optional[str] = None
    meal_type: Optional[str] = None  # breakfast, lunch, dinner, snack
    exclude_ordered: bool = False  # Exclude items user has already ordered


class SimilarItemsRequest(BaseModel):
    menu_item_id: int
    limit: int = Field(default=10, ge=1, le=50)


class TrendingItemsRequest(BaseModel):
    area: Optional[str] = None  # User's location/area
    limit: int = Field(default=10, ge=1, le=50)
    time_period: str = Field(default="week", pattern="^(day|week|month)$")


# User Item Interaction (for tracking)
class UserItemInteractionCreate(BaseModel):
    menu_item_id: int
    interaction_type: str = Field(..., pattern="^(view|order)$")


class UserItemInteractionResponse(BaseModel):
    id: int
    user_id: int
    menu_item_id: int
    view_count: int
    order_count: int
    last_ordered_at: Optional[datetime]
    total_spent: float
    implicit_rating: Optional[float]
    
    class Config:
        from_attributes = True


# Recommendation Feedback
class RecommendationFeedback(BaseModel):
    recommendation_id: int
    action: str = Field(..., pattern="^(shown|clicked|ordered|dismissed)$")
