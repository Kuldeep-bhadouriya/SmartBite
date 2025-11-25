from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date, time


# ============================================
# TimeSlot Schemas
# ============================================

class TimeSlotBase(BaseModel):
    name: str = Field(..., description="Display name of the time slot, e.g., '4-5 PM'")
    start_time: time = Field(..., description="Start time of the slot")
    end_time: time = Field(..., description="End time of the slot")
    display_order: int = Field(default=0, description="Order in which to display slots")
    is_active: bool = Field(default=True, description="Whether slot is globally active")


class TimeSlotCreate(TimeSlotBase):
    pass


class TimeSlotUpdate(BaseModel):
    name: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class TimeSlotResponse(TimeSlotBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# RestaurantSlotConfig Schemas
# ============================================

class RestaurantSlotConfigBase(BaseModel):
    time_slot_id: int
    max_orders_per_slot: int = Field(default=20, ge=1, description="Maximum orders per slot")
    is_enabled: bool = Field(default=True, description="Whether this slot is enabled for the restaurant")
    days_of_week: Optional[List[str]] = Field(default=None, description="Days when slot is available")
    min_advance_hours: int = Field(default=2, ge=0, description="Minimum hours before slot to place order")
    max_advance_days: int = Field(default=2, ge=1, le=7, description="Maximum days in advance")
    slot_surcharge: float = Field(default=0.0, ge=0, description="Additional charge for this slot")

    @validator('days_of_week')
    def validate_days(cls, v):
        if v is not None:
            valid_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
            for day in v:
                if day.lower() not in valid_days:
                    raise ValueError(f"Invalid day: {day}. Must be one of {valid_days}")
        return v


class RestaurantSlotConfigCreate(RestaurantSlotConfigBase):
    restaurant_id: int


class RestaurantSlotConfigUpdate(BaseModel):
    max_orders_per_slot: Optional[int] = Field(None, ge=1)
    is_enabled: Optional[bool] = None
    days_of_week: Optional[List[str]] = None
    min_advance_hours: Optional[int] = Field(None, ge=0)
    max_advance_days: Optional[int] = Field(None, ge=1, le=7)
    slot_surcharge: Optional[float] = Field(None, ge=0)


class RestaurantSlotConfigResponse(RestaurantSlotConfigBase):
    id: int
    restaurant_id: int
    time_slot: TimeSlotResponse
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# SlotAvailability Schemas
# ============================================

class SlotAvailabilityBase(BaseModel):
    restaurant_id: int
    time_slot_id: int
    date: date
    total_capacity: int
    booked_orders: int = Field(default=0)
    remaining_capacity: int
    is_available: bool = Field(default=True)
    is_manually_disabled: bool = Field(default=False)


class SlotAvailabilityCreate(SlotAvailabilityBase):
    pass


class SlotAvailabilityUpdate(BaseModel):
    is_manually_disabled: Optional[bool] = None
    total_capacity: Optional[int] = Field(None, ge=0)


class SlotAvailabilityResponse(SlotAvailabilityBase):
    id: int
    time_slot: TimeSlotResponse
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# Slot Availability Check (for frontend)
# ============================================

class SlotAvailabilityCheck(BaseModel):
    """Response for checking slot availability for a specific date"""
    time_slot_id: int
    time_slot_name: str
    start_time: str
    end_time: str
    is_available: bool
    remaining_capacity: int
    total_capacity: int
    slot_surcharge: float = 0.0
    reason: Optional[str] = None  # Why it's unavailable (if applicable)

    class Config:
        from_attributes = True


class DateAvailabilityResponse(BaseModel):
    """Availability for all slots on a specific date"""
    date: date
    restaurant_id: int
    restaurant_name: str
    available_slots: List[SlotAvailabilityCheck]
    total_slots: int
    available_count: int


# ============================================
# Scheduled Order Management Schemas
# ============================================

class ScheduledOrderEdit(BaseModel):
    """Schema for editing a scheduled order"""
    scheduled_date: Optional[date] = None
    time_slot_id: Optional[int] = None
    delivery_instructions: Optional[str] = None


class ScheduledOrderCancel(BaseModel):
    """Schema for canceling a scheduled order"""
    cancellation_reason: str = Field(..., min_length=10, max_length=500)


# ============================================
# Scheduled Order Reminder Schemas
# ============================================

class ScheduledOrderReminderBase(BaseModel):
    order_id: int
    reminder_1_hours: int = Field(default=24)
    reminder_2_hours: int = Field(default=2)
    reminder_3_hours: int = Field(default=0)


class ScheduledOrderReminderCreate(ScheduledOrderReminderBase):
    pass


class ScheduledOrderReminderResponse(ScheduledOrderReminderBase):
    id: int
    reminder_1_sent: bool
    reminder_2_sent: bool
    reminder_3_sent: bool
    reminder_1_sent_at: Optional[datetime]
    reminder_2_sent_at: Optional[datetime]
    reminder_3_sent_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# Admin: Bulk Slot Configuration
# ============================================

class BulkSlotConfigCreate(BaseModel):
    """Create slot configs for multiple time slots at once"""
    restaurant_id: int
    time_slot_ids: List[int]
    max_orders_per_slot: int = Field(default=20, ge=1)
    is_enabled: bool = Field(default=True)
    days_of_week: Optional[List[str]] = None
    min_advance_hours: int = Field(default=2, ge=0)
    max_advance_days: int = Field(default=2, ge=1, le=7)
    slot_surcharge: float = Field(default=0.0, ge=0)


class BulkSlotConfigResponse(BaseModel):
    success: bool
    created_count: int
    configs: List[RestaurantSlotConfigResponse]
