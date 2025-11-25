from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class DietaryType(str, Enum):
    VEG = "veg"
    NON_VEG = "non_veg"
    VEGAN = "vegan"
    JAIN = "jain"
    EGGETARIAN = "eggetarian"


class SpiceLevel(str, Enum):
    NONE = "none"
    MILD = "mild"
    MEDIUM = "medium"
    HOT = "hot"
    EXTRA_HOT = "extra_hot"


# Request Schemas
class UserPreferenceCreate(BaseModel):
    dietary_type: Optional[DietaryType] = DietaryType.VEG
    cuisine_preferences: Optional[List[str]] = []
    spice_level: Optional[SpiceLevel] = SpiceLevel.MEDIUM
    allergens: Optional[List[str]] = []
    min_budget: Optional[int] = None
    max_budget: Optional[int] = None
    favorite_restaurants: Optional[List[int]] = []
    disliked_items: Optional[List[int]] = []


class UserPreferenceUpdate(BaseModel):
    dietary_type: Optional[DietaryType] = None
    cuisine_preferences: Optional[List[str]] = None
    spice_level: Optional[SpiceLevel] = None
    allergens: Optional[List[str]] = None
    min_budget: Optional[int] = None
    max_budget: Optional[int] = None
    favorite_restaurants: Optional[List[int]] = None
    disliked_items: Optional[List[int]] = None


# Response Schemas
class UserPreferenceResponse(BaseModel):
    id: int
    user_id: int
    dietary_type: DietaryType
    cuisine_preferences: List[str]
    spice_level: SpiceLevel
    allergens: List[str]
    min_budget: Optional[int]
    max_budget: Optional[int]
    favorite_restaurants: List[int]
    disliked_items: List[int]
    
    class Config:
        from_attributes = True
