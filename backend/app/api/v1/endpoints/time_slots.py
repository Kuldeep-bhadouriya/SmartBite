from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from datetime import datetime, date, timedelta, time as dt_time
from app.api.deps import get_db, get_current_user, get_current_admin_user
from app.models.user import User
from app.models.time_slot import TimeSlot, RestaurantSlotConfig, SlotAvailability
from app.models.restaurant import Restaurant
from app.schemas.time_slot import (
    TimeSlotCreate, TimeSlotUpdate, TimeSlotResponse,
    RestaurantSlotConfigCreate, RestaurantSlotConfigUpdate, RestaurantSlotConfigResponse,
    SlotAvailabilityResponse, SlotAvailabilityUpdate,
    DateAvailabilityResponse, SlotAvailabilityCheck,
    BulkSlotConfigCreate, BulkSlotConfigResponse
)

router = APIRouter()


# ============================================
# Time Slot Management (Admin)
# ============================================

@router.post("/time-slots", response_model=TimeSlotResponse, status_code=status.HTTP_201_CREATED)
async def create_time_slot(
    time_slot: TimeSlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Create a new time slot (Admin only)
    """
    db_time_slot = TimeSlot(**time_slot.dict())
    db.add(db_time_slot)
    db.commit()
    db.refresh(db_time_slot)
    return db_time_slot


@router.get("/time-slots", response_model=List[TimeSlotResponse])
async def get_all_time_slots(
    skip: int = 0,
    limit: int = 100,
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get all time slots
    """
    query = db.query(TimeSlot)
    if not include_inactive:
        query = query.filter(TimeSlot.is_active == True)
    
    time_slots = query.order_by(TimeSlot.display_order).offset(skip).limit(limit).all()
    return time_slots


@router.get("/time-slots/{time_slot_id}", response_model=TimeSlotResponse)
async def get_time_slot(
    time_slot_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific time slot by ID
    """
    time_slot = db.query(TimeSlot).filter(TimeSlot.id == time_slot_id).first()
    if not time_slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time slot not found"
        )
    return time_slot


@router.put("/time-slots/{time_slot_id}", response_model=TimeSlotResponse)
async def update_time_slot(
    time_slot_id: int,
    time_slot_update: TimeSlotUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Update a time slot (Admin only)
    """
    db_time_slot = db.query(TimeSlot).filter(TimeSlot.id == time_slot_id).first()
    if not db_time_slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time slot not found"
        )
    
    update_data = time_slot_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_time_slot, field, value)
    
    db.commit()
    db.refresh(db_time_slot)
    return db_time_slot


@router.delete("/time-slots/{time_slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_time_slot(
    time_slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Delete a time slot (Admin only)
    """
    db_time_slot = db.query(TimeSlot).filter(TimeSlot.id == time_slot_id).first()
    if not db_time_slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time slot not found"
        )
    
    db.delete(db_time_slot)
    db.commit()
    return None


# ============================================
# Restaurant Slot Configuration (Admin)
# ============================================

@router.post("/restaurant-slot-config", response_model=RestaurantSlotConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_restaurant_slot_config(
    config: RestaurantSlotConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Create slot configuration for a restaurant (Admin only)
    """
    # Verify restaurant exists
    restaurant = db.query(Restaurant).filter(Restaurant.id == config.restaurant_id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    # Verify time slot exists
    time_slot = db.query(TimeSlot).filter(TimeSlot.id == config.time_slot_id).first()
    if not time_slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time slot not found"
        )
    
    # Check if config already exists
    existing_config = db.query(RestaurantSlotConfig).filter(
        and_(
            RestaurantSlotConfig.restaurant_id == config.restaurant_id,
            RestaurantSlotConfig.time_slot_id == config.time_slot_id
        )
    ).first()
    
    if existing_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuration for this slot already exists"
        )
    
    # Convert days_of_week list to JSON string if provided
    config_dict = config.dict()
    if config_dict.get('days_of_week'):
        import json
        config_dict['days_of_week'] = json.dumps(config_dict['days_of_week'])
    
    db_config = RestaurantSlotConfig(**config_dict)
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    
    return db_config


@router.post("/restaurant-slot-config/bulk", response_model=BulkSlotConfigResponse)
async def create_bulk_restaurant_slot_configs(
    bulk_config: BulkSlotConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Create slot configurations for multiple time slots at once (Admin only)
    """
    # Verify restaurant exists
    restaurant = db.query(Restaurant).filter(Restaurant.id == bulk_config.restaurant_id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    created_configs = []
    import json
    
    for time_slot_id in bulk_config.time_slot_ids:
        # Verify time slot exists
        time_slot = db.query(TimeSlot).filter(TimeSlot.id == time_slot_id).first()
        if not time_slot:
            continue  # Skip invalid time slots
        
        # Check if config already exists
        existing_config = db.query(RestaurantSlotConfig).filter(
            and_(
                RestaurantSlotConfig.restaurant_id == bulk_config.restaurant_id,
                RestaurantSlotConfig.time_slot_id == time_slot_id
            )
        ).first()
        
        if existing_config:
            continue  # Skip if already exists
        
        # Create config
        days_json = json.dumps(bulk_config.days_of_week) if bulk_config.days_of_week else None
        
        db_config = RestaurantSlotConfig(
            restaurant_id=bulk_config.restaurant_id,
            time_slot_id=time_slot_id,
            max_orders_per_slot=bulk_config.max_orders_per_slot,
            is_enabled=bulk_config.is_enabled,
            days_of_week=days_json,
            min_advance_hours=bulk_config.min_advance_hours,
            max_advance_days=bulk_config.max_advance_days,
            slot_surcharge=bulk_config.slot_surcharge
        )
        db.add(db_config)
        created_configs.append(db_config)
    
    db.commit()
    
    # Refresh all configs
    for config in created_configs:
        db.refresh(config)
    
    return {
        "success": True,
        "created_count": len(created_configs),
        "configs": created_configs
    }


@router.get("/restaurants/{restaurant_id}/slot-configs", response_model=List[RestaurantSlotConfigResponse])
async def get_restaurant_slot_configs(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all slot configurations for a specific restaurant
    """
    configs = db.query(RestaurantSlotConfig).filter(
        RestaurantSlotConfig.restaurant_id == restaurant_id
    ).all()
    return configs


@router.put("/restaurant-slot-config/{config_id}", response_model=RestaurantSlotConfigResponse)
async def update_restaurant_slot_config(
    config_id: int,
    config_update: RestaurantSlotConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Update a restaurant slot configuration (Admin only)
    """
    db_config = db.query(RestaurantSlotConfig).filter(RestaurantSlotConfig.id == config_id).first()
    if not db_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )
    
    update_data = config_update.dict(exclude_unset=True)
    
    # Handle days_of_week conversion
    if 'days_of_week' in update_data and update_data['days_of_week'] is not None:
        import json
        update_data['days_of_week'] = json.dumps(update_data['days_of_week'])
    
    for field, value in update_data.items():
        setattr(db_config, field, value)
    
    db.commit()
    db.refresh(db_config)
    return db_config


@router.delete("/restaurant-slot-config/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_restaurant_slot_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Delete a restaurant slot configuration (Admin only)
    """
    db_config = db.query(RestaurantSlotConfig).filter(RestaurantSlotConfig.id == config_id).first()
    if not db_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )
    
    db.delete(db_config)
    db.commit()
    return None


# ============================================
# Slot Availability Checking (Public)
# ============================================

@router.get("/restaurants/{restaurant_id}/slot-availability", response_model=List[DateAvailabilityResponse])
async def get_restaurant_slot_availability(
    restaurant_id: int,
    start_date: date = None,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """
    Get slot availability for a restaurant for the next N days
    """
    # Verify restaurant exists
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    if start_date is None:
        start_date = date.today()
    
    # Get restaurant slot configs
    configs = db.query(RestaurantSlotConfig).filter(
        and_(
            RestaurantSlotConfig.restaurant_id == restaurant_id,
            RestaurantSlotConfig.is_enabled == True
        )
    ).all()
    
    if not configs:
        return []
    
    result = []
    
    for day_offset in range(days):
        check_date = start_date + timedelta(days=day_offset)
        day_name = check_date.strftime("%A").lower()
        
        available_slots = []
        
        for config in configs:
            # Check if this slot is available on this day of week
            import json
            days_of_week = json.loads(config.days_of_week) if config.days_of_week else None
            
            if days_of_week and day_name not in [d.lower() for d in days_of_week]:
                continue  # Skip if not available on this day
            
            # Check advance booking limits
            days_in_advance = (check_date - date.today()).days
            if days_in_advance > config.max_advance_days:
                continue  # Too far in advance
            
            # Check minimum advance hours
            time_slot = config.time_slot
            slot_datetime = datetime.combine(check_date, time_slot.start_time)
            hours_until_slot = (slot_datetime - datetime.now()).total_seconds() / 3600
            
            if hours_until_slot < config.min_advance_hours:
                continue  # Not enough advance notice
            
            # Get or create slot availability
            slot_avail = db.query(SlotAvailability).filter(
                and_(
                    SlotAvailability.restaurant_id == restaurant_id,
                    SlotAvailability.time_slot_id == config.time_slot_id,
                    SlotAvailability.date == check_date
                )
            ).first()
            
            if not slot_avail:
                # Create new availability record
                slot_avail = SlotAvailability(
                    restaurant_id=restaurant_id,
                    time_slot_id=config.time_slot_id,
                    date=check_date,
                    total_capacity=config.max_orders_per_slot,
                    booked_orders=0,
                    remaining_capacity=config.max_orders_per_slot,
                    is_available=True
                )
                db.add(slot_avail)
                db.commit()
                db.refresh(slot_avail)
            
            # Check if slot is available
            is_available = (
                slot_avail.is_available and
                not slot_avail.is_manually_disabled and
                slot_avail.remaining_capacity > 0
            )
            
            reason = None
            if not is_available:
                if slot_avail.is_manually_disabled:
                    reason = "Slot disabled by restaurant"
                elif slot_avail.remaining_capacity <= 0:
                    reason = "Slot fully booked"
                else:
                    reason = "Slot unavailable"
            
            available_slots.append(
                SlotAvailabilityCheck(
                    time_slot_id=time_slot.id,
                    time_slot_name=time_slot.name,
                    start_time=time_slot.start_time.strftime("%H:%M"),
                    end_time=time_slot.end_time.strftime("%H:%M"),
                    is_available=is_available,
                    remaining_capacity=slot_avail.remaining_capacity,
                    total_capacity=slot_avail.total_capacity,
                    slot_surcharge=config.slot_surcharge,
                    reason=reason
                )
            )
        
        result.append(
            DateAvailabilityResponse(
                date=check_date,
                restaurant_id=restaurant_id,
                restaurant_name=restaurant.name,
                available_slots=available_slots,
                total_slots=len(available_slots),
                available_count=sum(1 for slot in available_slots if slot.is_available)
            )
        )
    
    return result


# ============================================
# Manual Slot Availability Management (Admin)
# ============================================

@router.put("/slot-availability/{availability_id}", response_model=SlotAvailabilityResponse)
async def update_slot_availability(
    availability_id: int,
    availability_update: SlotAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Manually update slot availability (e.g., disable specific date slot) (Admin only)
    """
    db_availability = db.query(SlotAvailability).filter(SlotAvailability.id == availability_id).first()
    if not db_availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slot availability not found"
        )
    
    update_data = availability_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_availability, field, value)
    
    # Update remaining capacity if total capacity changed
    if 'total_capacity' in update_data:
        db_availability.remaining_capacity = db_availability.total_capacity - db_availability.booked_orders
    
    db.commit()
    db.refresh(db_availability)
    return db_availability
