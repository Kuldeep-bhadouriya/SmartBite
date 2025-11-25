from sqlalchemy import Column, Integer, String, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.db.base_models import Base, TimestampMixin


class DietaryType(str, enum.Enum):
    VEG = "veg"
    NON_VEG = "non_veg"
    VEGAN = "vegan"
    JAIN = "jain"
    EGGETARIAN = "eggetarian"


class SpiceLevel(str, enum.Enum):
    NONE = "none"
    MILD = "mild"
    MEDIUM = "medium"
    HOT = "hot"
    EXTRA_HOT = "extra_hot"


class UserPreference(Base, TimestampMixin):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Dietary preferences
    dietary_type = Column(SQLEnum(DietaryType), default=DietaryType.VEG)
    cuisine_preferences = Column(JSON, default=list)  # List of preferred cuisines
    spice_level = Column(SQLEnum(SpiceLevel), default=SpiceLevel.MEDIUM)
    
    # Allergen information
    allergens = Column(JSON, default=list)  # List of allergens to avoid
    
    # Budget preferences
    min_budget = Column(Integer, nullable=True)  # Minimum price range
    max_budget = Column(Integer, nullable=True)  # Maximum price range
    
    # Additional preferences
    favorite_restaurants = Column(JSON, default=list)  # List of restaurant IDs
    disliked_items = Column(JSON, default=list)  # List of menu item IDs to avoid
    
    # Relationships
    user = relationship("User", back_populates="preferences")
