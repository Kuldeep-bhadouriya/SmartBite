# Import all models for Alembic migrations
from sqlalchemy import Column, DateTime
from datetime import datetime
from app.db.base import Base


class TimestampMixin:
    """Mixin to add created_at and updated_at timestamp fields"""
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


from app.models.user import User
from app.models.restaurant import Restaurant, MenuCategory, MenuItem
from app.models.order import Order, OrderItem
from app.models.address import Address
from app.models.payment import Payment
from app.models.cart import Cart, CartItem
from app.models.time_slot import TimeSlot, RestaurantSlotConfig, SlotAvailability, ScheduledOrderReminder
