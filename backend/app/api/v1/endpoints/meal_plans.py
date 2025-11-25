from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timedelta

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.meal_plan import MealPlan, PlannedMeal, ReorderSchedule
from app.models.order import Order, OrderItem
from app.models.restaurant import MenuItem
from app.schemas.meal_plan import (
    MealPlanCreate,
    MealPlanUpdate,
    MealPlanResponse,
    MealPlanSummary,
    PlannedMealCreate,
    PlannedMealUpdate,
    PlannedMealResponse,
    ReorderScheduleCreate,
    ReorderScheduleUpdate,
    ReorderScheduleResponse,
    OrderWeeklyPlanRequest
)

router = APIRouter()


# Meal Plans
@router.post("/", response_model=MealPlanResponse, status_code=status.HTTP_201_CREATED)
def create_meal_plan(
    meal_plan: MealPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new meal plan"""
    db_meal_plan = MealPlan(
        user_id=current_user.id,
        name=meal_plan.name,
        description=meal_plan.description,
        is_template=meal_plan.is_template,
        template_category=meal_plan.template_category
    )
    db.add(db_meal_plan)
    db.flush()
    
    # Add planned meals if provided
    for meal in meal_plan.meals:
        db_meal = PlannedMeal(
            meal_plan_id=db_meal_plan.id,
            **meal.model_dump()
        )
        db.add(db_meal)
    
    db.commit()
    db.refresh(db_meal_plan)
    
    # Load relationships
    db_meal_plan = db.query(MealPlan).options(
        joinedload(MealPlan.meals).joinedload(PlannedMeal.menu_item),
        joinedload(MealPlan.meals).joinedload(PlannedMeal.restaurant),
        joinedload(MealPlan.meals).joinedload(PlannedMeal.time_slot)
    ).filter(MealPlan.id == db_meal_plan.id).first()
    
    return db_meal_plan


@router.get("/", response_model=List[MealPlanSummary])
def get_meal_plans(
    skip: int = 0,
    limit: int = 10,
    include_templates: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all meal plans for the current user"""
    query = db.query(MealPlan).filter(MealPlan.user_id == current_user.id)
    
    if not include_templates:
        query = query.filter(MealPlan.is_template == False)
    
    meal_plans = query.offset(skip).limit(limit).all()
    
    # Add meal count
    result = []
    for plan in meal_plans:
        meal_count = db.query(PlannedMeal).filter(
            PlannedMeal.meal_plan_id == plan.id
        ).count()
        
        result.append(MealPlanSummary(
            id=plan.id,
            user_id=plan.user_id,
            name=plan.name,
            description=plan.description,
            is_template=plan.is_template,
            template_category=plan.template_category,
            is_active=plan.is_active,
            meal_count=meal_count,
            created_at=plan.created_at
        ))
    
    return result


@router.get("/templates", response_model=List[MealPlanResponse])
def get_meal_plan_templates(
    category: str = None,
    db: Session = Depends(get_db)
):
    """Get pre-built meal plan templates"""
    query = db.query(MealPlan).filter(MealPlan.is_template == True)
    
    if category:
        query = query.filter(MealPlan.template_category == category)
    
    templates = query.options(
        joinedload(MealPlan.meals).joinedload(PlannedMeal.menu_item),
        joinedload(MealPlan.meals).joinedload(PlannedMeal.restaurant)
    ).all()
    
    return templates


@router.get("/{meal_plan_id}", response_model=MealPlanResponse)
def get_meal_plan(
    meal_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific meal plan with all meals"""
    meal_plan = db.query(MealPlan).options(
        joinedload(MealPlan.meals).joinedload(PlannedMeal.menu_item),
        joinedload(MealPlan.meals).joinedload(PlannedMeal.restaurant),
        joinedload(MealPlan.meals).joinedload(PlannedMeal.time_slot)
    ).filter(
        MealPlan.id == meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found"
        )
    
    return meal_plan


@router.put("/{meal_plan_id}", response_model=MealPlanResponse)
def update_meal_plan(
    meal_plan_id: int,
    meal_plan: MealPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a meal plan"""
    db_meal_plan = db.query(MealPlan).filter(
        MealPlan.id == meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not db_meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found"
        )
    
    for field, value in meal_plan.model_dump(exclude_unset=True).items():
        setattr(db_meal_plan, field, value)
    
    db.commit()
    db.refresh(db_meal_plan)
    
    return db_meal_plan


@router.delete("/{meal_plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal_plan(
    meal_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a meal plan"""
    db_meal_plan = db.query(MealPlan).filter(
        MealPlan.id == meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not db_meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found"
        )
    
    db.delete(db_meal_plan)
    db.commit()
    
    return None


# Planned Meals
@router.post("/{meal_plan_id}/meals", response_model=PlannedMealResponse, status_code=status.HTTP_201_CREATED)
def add_planned_meal(
    meal_plan_id: int,
    meal: PlannedMealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a meal to a meal plan"""
    # Verify meal plan belongs to user
    meal_plan = db.query(MealPlan).filter(
        MealPlan.id == meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found"
        )
    
    db_meal = PlannedMeal(
        meal_plan_id=meal_plan_id,
        **meal.model_dump()
    )
    db.add(db_meal)
    db.commit()
    db.refresh(db_meal)
    
    return db_meal


@router.put("/meals/{meal_id}", response_model=PlannedMealResponse)
def update_planned_meal(
    meal_id: int,
    meal: PlannedMealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a planned meal"""
    db_meal = db.query(PlannedMeal).join(MealPlan).filter(
        PlannedMeal.id == meal_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not db_meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planned meal not found"
        )
    
    for field, value in meal.model_dump(exclude_unset=True).items():
        setattr(db_meal, field, value)
    
    db.commit()
    db.refresh(db_meal)
    
    return db_meal


@router.delete("/meals/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_planned_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a planned meal"""
    db_meal = db.query(PlannedMeal).join(MealPlan).filter(
        PlannedMeal.id == meal_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not db_meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planned meal not found"
        )
    
    db.delete(db_meal)
    db.commit()
    
    return None


# Order from meal plan
@router.post("/{meal_plan_id}/order", status_code=status.HTTP_201_CREATED)
def order_weekly_plan(
    meal_plan_id: int,
    request: OrderWeeklyPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Order all meals from a meal plan for the week"""
    # Get meal plan with meals
    meal_plan = db.query(MealPlan).options(
        joinedload(MealPlan.meals).joinedload(PlannedMeal.menu_item)
    ).filter(
        MealPlan.id == meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found"
        )
    
    # Group meals by day and create orders
    start_date = datetime.strptime(request.start_date, "%Y-%m-%d").date()
    orders_created = []
    
    # Group meals by restaurant and day
    meals_by_day_restaurant = {}
    for meal in meal_plan.meals:
        day = meal.day_of_week
        restaurant_id = meal.restaurant_id
        
        key = (day, restaurant_id)
        if key not in meals_by_day_restaurant:
            meals_by_day_restaurant[key] = []
        
        meals_by_day_restaurant[key].append(meal)
    
    # Create orders for each day/restaurant combination
    for (day, restaurant_id), meals in meals_by_day_restaurant.items():
        delivery_date = start_date + timedelta(days=day)
        
        # Calculate total
        total_amount = sum(
            meal.menu_item.price * meal.quantity 
            for meal in meals if meal.menu_item
        )
        
        # Create order
        order = Order(
            user_id=current_user.id,
            restaurant_id=restaurant_id,
            delivery_address_id=request.delivery_address_id,
            total_amount=total_amount,
            delivery_date=delivery_date,
            time_slot_id=meals[0].time_slot_id if meals else None,
            is_scheduled=True
        )
        db.add(order)
        db.flush()
        
        # Add order items
        for meal in meals:
            if meal.menu_item:
                order_item = OrderItem(
                    order_id=order.id,
                    menu_item_id=meal.menu_item_id,
                    quantity=meal.quantity,
                    price=meal.menu_item.price,
                    item_total=meal.menu_item.price * meal.quantity
                )
                db.add(order_item)
        
        orders_created.append(order.id)
    
    db.commit()
    
    return {
        "message": f"Successfully created {len(orders_created)} orders from meal plan",
        "order_ids": orders_created
    }


# Reorder Schedules
@router.post("/reorder-schedules", response_model=ReorderScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_reorder_schedule(
    schedule: ReorderScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a schedule to automatically reorder a past order"""
    # Verify order belongs to user
    order = db.query(Order).filter(
        Order.id == schedule.order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    db_schedule = ReorderSchedule(
        user_id=current_user.id,
        **schedule.model_dump()
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    return db_schedule


@router.get("/reorder-schedules", response_model=List[ReorderScheduleResponse])
def get_reorder_schedules(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all reorder schedules for the current user"""
    query = db.query(ReorderSchedule).filter(
        ReorderSchedule.user_id == current_user.id
    )
    
    if active_only:
        query = query.filter(ReorderSchedule.is_active == True)
    
    return query.all()


@router.put("/reorder-schedules/{schedule_id}", response_model=ReorderScheduleResponse)
def update_reorder_schedule(
    schedule_id: int,
    schedule: ReorderScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a reorder schedule"""
    db_schedule = db.query(ReorderSchedule).filter(
        ReorderSchedule.id == schedule_id,
        ReorderSchedule.user_id == current_user.id
    ).first()
    
    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reorder schedule not found"
        )
    
    for field, value in schedule.model_dump(exclude_unset=True).items():
        setattr(db_schedule, field, value)
    
    db.commit()
    db.refresh(db_schedule)
    
    return db_schedule


@router.delete("/reorder-schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reorder_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a reorder schedule"""
    db_schedule = db.query(ReorderSchedule).filter(
        ReorderSchedule.id == schedule_id,
        ReorderSchedule.user_id == current_user.id
    ).first()
    
    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reorder schedule not found"
        )
    
    db.delete(db_schedule)
    db.commit()
    
    return None
