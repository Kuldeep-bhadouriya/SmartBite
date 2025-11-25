from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base_models import Base, TimestampMixin


class MealRecommendation(Base, TimestampMixin):
    __tablename__ = "meal_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False)
    
    # Recommendation metadata
    score = Column(Float, nullable=False)  # Recommendation confidence score (0-1)
    reason = Column(String(255), nullable=True)  # e.g., "Based on your order history", "Trending"
    recommendation_type = Column(String(50), nullable=False)  # "collaborative", "preference", "trending", "similar"
    
    # Context
    context = Column(Text, nullable=True)  # JSON string with additional context
    expires_at = Column(DateTime, nullable=True)  # When this recommendation expires
    
    # Tracking
    is_shown = Column(Integer, default=0)  # How many times shown
    is_clicked = Column(Integer, default=0)  # How many times clicked
    is_ordered = Column(Integer, default=0)  # How many times ordered
    
    # Relationships
    user = relationship("User")
    menu_item = relationship("MenuItem")


class UserItemInteraction(Base, TimestampMixin):
    """Track user interactions with menu items for better recommendations"""
    __tablename__ = "user_item_interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False)
    
    # Interaction metrics
    view_count = Column(Integer, default=0)
    order_count = Column(Integer, default=0)
    last_ordered_at = Column(DateTime, nullable=True)
    total_spent = Column(Float, default=0.0)
    
    # Implicit ratings
    implicit_rating = Column(Float, nullable=True)  # Calculated based on interactions
    
    # Relationships
    user = relationship("User")
    menu_item = relationship("MenuItem")
