from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey, Boolean, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.db.base_models import Base, TimestampMixin


class MealType(str, enum.Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"


class MealPlan(Base, TimestampMixin):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_template = Column(Boolean, default=False)  # True if this is a pre-built template
    template_category = Column(String(100), nullable=True)  # e.g., "Weight Loss", "Muscle Gain"
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="meal_plans")
    meals = relationship("PlannedMeal", back_populates="meal_plan", cascade="all, delete-orphan")


class PlannedMeal(Base, TimestampMixin):
    __tablename__ = "planned_meals"

    id = Column(Integer, primary_key=True, index=True)
    meal_plan_id = Column(Integer, ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False)
    
    # Menu item reference
    menu_item_id = Column(Integer, ForeignKey("menu_items.id", ondelete="SET NULL"), nullable=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="SET NULL"), nullable=True)
    
    # Scheduling
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    meal_type = Column(SQLEnum(MealType), nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id", ondelete="SET NULL"), nullable=True)
    
    # Optional customization
    notes = Column(Text, nullable=True)
    quantity = Column(Integer, default=1)
    
    # Relationships
    meal_plan = relationship("MealPlan", back_populates="meals")
    menu_item = relationship("MenuItem")
    restaurant = relationship("Restaurant")
    time_slot = relationship("TimeSlot")


class ReorderSchedule(Base, TimestampMixin):
    __tablename__ = "reorder_schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    
    # Scheduling
    frequency = Column(String(50), nullable=False)  # "daily", "weekly", "monthly"
    day_of_week = Column(Integer, nullable=True)  # For weekly schedules
    day_of_month = Column(Integer, nullable=True)  # For monthly schedules
    time_slot_id = Column(Integer, ForeignKey("time_slots.id", ondelete="SET NULL"), nullable=True)
    
    is_active = Column(Boolean, default=True)
    next_order_date = Column(Date, nullable=True)
    
    # Relationships
    user = relationship("User")
    order = relationship("Order")
    time_slot = relationship("TimeSlot")
