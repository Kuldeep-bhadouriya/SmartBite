from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class RestaurantStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    SUSPENDED = "suspended"


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Contact
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Location
    address = Column(String(500), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Media
    logo = Column(String(500), nullable=True)
    cover_image = Column(String(500), nullable=True)
    images = Column(Text, nullable=True)  # JSON array of image URLs
    
    # Business Info
    cuisine_type = Column(String(255), nullable=True)  # Comma-separated cuisines
    is_veg = Column(Boolean, default=False)
    is_non_veg = Column(Boolean, default=True)
    average_cost_for_two = Column(Float, nullable=True)
    
    # Ratings
    rating = Column(Float, default=0.0)
    total_ratings = Column(Integer, default=0)
    
    # Operations
    status = Column(SQLEnum(RestaurantStatus), default=RestaurantStatus.ACTIVE)
    is_featured = Column(Boolean, default=False)
    opening_time = Column(String(10), default="09:00")
    closing_time = Column(String(10), default="22:00")
    preparation_time = Column(Integer, default=30)  # in minutes
    
    # Delivery
    delivery_radius = Column(Float, default=10.0)  # in km
    minimum_order = Column(Float, default=0.0)
    delivery_fee = Column(Float, default=0.0)
    free_delivery_above = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    categories = relationship("MenuCategory", back_populates="restaurant", cascade="all, delete-orphan")
    menu_items = relationship("MenuItem", back_populates="restaurant", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="restaurant")


class MenuCategory(Base):
    __tablename__ = "menu_categories"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    image = Column(String(500), nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    restaurant = relationship("Restaurant", back_populates="categories")
    items = relationship("MenuItem", back_populates="category", cascade="all, delete-orphan")


class ItemType(str, enum.Enum):
    VEG = "veg"
    NON_VEG = "non_veg"
    EGG = "egg"
    VEGAN = "vegan"


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("menu_categories.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    image = Column(String(500), nullable=True)
    
    # Pricing
    price = Column(Float, nullable=False)
    discounted_price = Column(Float, nullable=True)
    
    # Food Type
    item_type = Column(SQLEnum(ItemType), default=ItemType.VEG)
    
    # Dietary Info
    is_spicy = Column(Boolean, default=False)
    spice_level = Column(Integer, default=0)  # 0-5
    allergens = Column(String(500), nullable=True)  # Comma-separated
    ingredients = Column(Text, nullable=True)
    
    # Nutrition (for Phase 4)
    calories = Column(Integer, nullable=True)
    protein = Column(Float, nullable=True)
    carbs = Column(Float, nullable=True)
    fat = Column(Float, nullable=True)
    fiber = Column(Float, nullable=True)
    
    # Status
    is_available = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    is_bestseller = Column(Boolean, default=False)
    
    # Preparation
    preparation_time = Column(Integer, default=20)  # in minutes
    serves = Column(Integer, default=1)
    
    # Ratings
    rating = Column(Float, default=0.0)
    total_ratings = Column(Integer, default=0)
    
    # Display
    display_order = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    restaurant = relationship("Restaurant", back_populates="menu_items")
    category = relationship("MenuCategory", back_populates="items")
    
    @property
    def final_price(self):
        return self.discounted_price if self.discounted_price else self.price
    
    @property
    def discount_percentage(self):
        if self.discounted_price and self.price > 0:
            return round((1 - self.discounted_price / self.price) * 100)
        return 0
