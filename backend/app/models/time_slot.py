from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Time, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class DayOfWeek(str, enum.Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class TimeSlot(Base):
    """
    Master time slots table - defines available time slots globally
    """
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # e.g., "4-5 PM", "5-6 PM"
    start_time = Column(Time, nullable=False)  # e.g., 16:00:00
    end_time = Column(Time, nullable=False)    # e.g., 17:00:00
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    restaurant_configs = relationship("RestaurantSlotConfig", back_populates="time_slot", cascade="all, delete-orphan")
    slot_availabilities = relationship("SlotAvailability", back_populates="time_slot", cascade="all, delete-orphan")


class RestaurantSlotConfig(Base):
    """
    Restaurant-specific time slot configuration
    Each restaurant can customize which time slots they support and their capacity
    """
    __tablename__ = "restaurant_slot_configs"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id", ondelete="CASCADE"), nullable=False)
    
    # Capacity Management
    max_orders_per_slot = Column(Integer, default=20)  # Maximum orders this restaurant can handle per slot
    
    # Availability Settings
    is_enabled = Column(Boolean, default=True)
    days_of_week = Column(String(255), nullable=True)  # JSON array of enabled days ["monday", "tuesday", ...]
    
    # Advance Ordering Settings
    min_advance_hours = Column(Integer, default=2)     # Minimum hours before slot time to place order
    max_advance_days = Column(Integer, default=2)      # Maximum days in advance (1 or 2)
    
    # Pricing (optional)
    slot_surcharge = Column(Integer, default=0)  # Additional charge for this slot (e.g., peak hours)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    restaurant = relationship("Restaurant", backref="slot_configs")
    time_slot = relationship("TimeSlot", back_populates="restaurant_configs")
    
    def __repr__(self):
        return f"<RestaurantSlotConfig restaurant_id={self.restaurant_id} slot={self.time_slot_id}>"


class SlotAvailability(Base):
    """
    Daily slot availability tracking - tracks remaining capacity for each slot on each day
    """
    __tablename__ = "slot_availabilities"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    
    # Availability Tracking
    total_capacity = Column(Integer, nullable=False)      # Total orders allowed (copied from RestaurantSlotConfig)
    booked_orders = Column(Integer, default=0)            # Number of orders already scheduled
    remaining_capacity = Column(Integer, nullable=False)  # Remaining slots available
    
    # Status
    is_available = Column(Boolean, default=True)
    is_manually_disabled = Column(Boolean, default=False)  # Admin can disable specific date slots
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    restaurant = relationship("Restaurant", backref="slot_availabilities")
    time_slot = relationship("TimeSlot", back_populates="slot_availabilities")
    
    # Composite unique constraint to prevent duplicate entries
    __table_args__ = (
        {'sqlite_autoincrement': True},
    )
    
    def __repr__(self):
        return f"<SlotAvailability restaurant={self.restaurant_id} date={self.date} slot={self.time_slot_id} remaining={self.remaining_capacity}>"


class ScheduledOrderReminder(Base):
    """
    Reminders for scheduled orders - for notifications
    """
    __tablename__ = "scheduled_order_reminders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Reminder Settings
    reminder_1_hours = Column(Integer, default=24)  # 24 hours before
    reminder_2_hours = Column(Integer, default=2)   # 2 hours before
    reminder_3_hours = Column(Integer, default=0)   # 30 minutes before (0.5 would be float)
    
    # Tracking
    reminder_1_sent = Column(Boolean, default=False)
    reminder_2_sent = Column(Boolean, default=False)
    reminder_3_sent = Column(Boolean, default=False)
    
    reminder_1_sent_at = Column(DateTime, nullable=True)
    reminder_2_sent_at = Column(DateTime, nullable=True)
    reminder_3_sent_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order = relationship("Order", backref="reminder")
    
    def __repr__(self):
        return f"<ScheduledOrderReminder order_id={self.order_id}>"
