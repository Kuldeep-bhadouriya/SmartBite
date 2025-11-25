from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class MealType(str, Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"


# Planned Meal Schemas
class PlannedMealCreate(BaseModel):
    menu_item_id: int
    restaurant_id: int
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    meal_type: MealType
    time_slot_id: Optional[int] = None
    notes: Optional[str] = None
    quantity: int = Field(default=1, ge=1)


class PlannedMealUpdate(BaseModel):
    menu_item_id: Optional[int] = None
    restaurant_id: Optional[int] = None
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    meal_type: Optional[MealType] = None
    time_slot_id: Optional[int] = None
    notes: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=1)


class PlannedMealResponse(BaseModel):
    id: int
    meal_plan_id: int
    menu_item_id: Optional[int]
    restaurant_id: Optional[int]
    day_of_week: int
    meal_type: MealType
    time_slot_id: Optional[int]
    notes: Optional[str]
    quantity: int
    
    # Include menu item details
    menu_item: Optional[dict] = None
    restaurant: Optional[dict] = None
    time_slot: Optional[dict] = None
    
    class Config:
        from_attributes = True


# Meal Plan Schemas
class MealPlanCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_template: bool = False
    template_category: Optional[str] = None
    meals: Optional[List[PlannedMealCreate]] = []


class MealPlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class MealPlanResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    is_template: bool
    template_category: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    meals: List[PlannedMealResponse] = []
    
    class Config:
        from_attributes = True


class MealPlanSummary(BaseModel):
    """Summary view without all meal details"""
    id: int
    user_id: int
    name: str
    description: Optional[str]
    is_template: bool
    template_category: Optional[str]
    is_active: bool
    meal_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Reorder Schedule Schemas
class ReorderScheduleCreate(BaseModel):
    order_id: int
    frequency: str = Field(..., pattern="^(daily|weekly|monthly)$")
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    time_slot_id: Optional[int] = None


class ReorderScheduleUpdate(BaseModel):
    frequency: Optional[str] = Field(None, pattern="^(daily|weekly|monthly)$")
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    time_slot_id: Optional[int] = None
    is_active: Optional[bool] = None


class ReorderScheduleResponse(BaseModel):
    id: int
    user_id: int
    order_id: int
    frequency: str
    day_of_week: Optional[int]
    day_of_month: Optional[int]
    time_slot_id: Optional[int]
    is_active: bool
    next_order_date: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Order This Week Request
class OrderWeeklyPlanRequest(BaseModel):
    meal_plan_id: int
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    delivery_address_id: int
