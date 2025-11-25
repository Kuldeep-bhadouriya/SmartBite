"""
Recommendation Service for Meal Suggestions
Implements collaborative filtering and other recommendation algorithms
"""
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from datetime import datetime, timedelta
from collections import defaultdict
import math

from app.models.recommendation import MealRecommendation, UserItemInteraction
from app.models.order import Order, OrderItem, OrderStatus
from app.models.restaurant import MenuItem
from app.models.user_preference import UserPreference


class RecommendationService:
    """Service for generating meal recommendations using various algorithms"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_recommendations_for_user(
        self, 
        user_id: int, 
        limit: int = 10,
        recommendation_type: Optional[str] = None
    ) -> List[MealRecommendation]:
        """
        Get personalized recommendations for a user
        Combines multiple recommendation strategies
        """
        recommendations = []
        
        if recommendation_type == "collaborative" or not recommendation_type:
            recommendations.extend(self.collaborative_filtering(user_id, limit // 2))
        
        if recommendation_type == "preference" or not recommendation_type:
            recommendations.extend(self.preference_based_recommendations(user_id, limit // 2))
        
        if recommendation_type == "trending" or not recommendation_type:
            recommendations.extend(self.trending_items(user_id, limit // 3))
        
        if recommendation_type == "history" or not recommendation_type:
            recommendations.extend(self.history_based_recommendations(user_id, limit // 3))
        
        # Sort by score and deduplicate
        seen_items = set()
        unique_recommendations = []
        
        for rec in sorted(recommendations, key=lambda x: x["score"], reverse=True):
            if rec["menu_item_id"] not in seen_items:
                seen_items.add(rec["menu_item_id"])
                unique_recommendations.append(rec)
                
                if len(unique_recommendations) >= limit:
                    break
        
        return unique_recommendations
    
    def collaborative_filtering(self, user_id: int, limit: int = 10) -> List[Dict]:
        """
        Find users with similar taste and recommend items they liked
        Simple user-based collaborative filtering
        """
        # Get items the user has ordered
        user_orders = self.db.query(OrderItem.menu_item_id, func.count(OrderItem.id).label("count"))\
            .join(Order)\
            .filter(
                Order.user_id == user_id,
                Order.status.in_([OrderStatus.DELIVERED, OrderStatus.CONFIRMED])
            )\
            .group_by(OrderItem.menu_item_id)\
            .all()
        
        if not user_orders:
            return []
        
        user_item_ids = {item.menu_item_id for item in user_orders}
        
        # Find similar users who ordered the same items
        similar_users = self.db.query(
            Order.user_id,
            func.count(OrderItem.menu_item_id.distinct()).label("common_items")
        )\
            .join(OrderItem)\
            .filter(
                Order.user_id != user_id,
                OrderItem.menu_item_id.in_(user_item_ids),
                Order.status.in_([OrderStatus.DELIVERED, OrderStatus.CONFIRMED])
            )\
            .group_by(Order.user_id)\
            .order_by(desc("common_items"))\
            .limit(10)\
            .all()
        
        if not similar_users:
            return []
        
        similar_user_ids = [u.user_id for u in similar_users]
        
        # Get items ordered by similar users that current user hasn't ordered
        recommended_items = self.db.query(
            OrderItem.menu_item_id,
            func.count(OrderItem.id).label("popularity"),
            func.avg(MenuItem.price).label("avg_price")
        )\
            .join(Order)\
            .join(MenuItem)\
            .filter(
                Order.user_id.in_(similar_user_ids),
                OrderItem.menu_item_id.notin_(user_item_ids),
                MenuItem.is_available == True,
                Order.status.in_([OrderStatus.DELIVERED, OrderStatus.CONFIRMED])
            )\
            .group_by(OrderItem.menu_item_id)\
            .order_by(desc("popularity"))\
            .limit(limit)\
            .all()
        
        recommendations = []
        for item in recommended_items:
            score = min(item.popularity / 10.0, 1.0)  # Normalize score
            recommendations.append({
                "menu_item_id": item.menu_item_id,
                "score": score,
                "reason": "Users with similar taste also enjoyed this",
                "recommendation_type": "collaborative"
            })
        
        return recommendations
    
    def preference_based_recommendations(self, user_id: int, limit: int = 10) -> List[Dict]:
        """
        Recommend based on user's dietary preferences and favorites
        """
        # Get user preferences
        preferences = self.db.query(UserPreference).filter(
            UserPreference.user_id == user_id
        ).first()
        
        if not preferences:
            return []
        
        # Get items ordered by the user
        user_item_ids = {
            item.menu_item_id 
            for item in self.db.query(OrderItem.menu_item_id).join(Order).filter(
                Order.user_id == user_id
            ).distinct().all()
        }
        
        # Build query based on preferences
        query = self.db.query(MenuItem)\
            .filter(MenuItem.is_available == True)
        
        # Filter by dietary type
        if preferences.dietary_type:
            # Note: Assumes MenuItem has a dietary_type field or category
            # Adjust based on your actual schema
            pass
        
        # Filter by price range
        if preferences.min_budget:
            query = query.filter(MenuItem.price >= preferences.min_budget)
        if preferences.max_budget:
            query = query.filter(MenuItem.price <= preferences.max_budget)
        
        # Filter by favorite restaurants
        if preferences.favorite_restaurants:
            query = query.filter(MenuItem.restaurant_id.in_(preferences.favorite_restaurants))
        
        # Exclude disliked items
        if preferences.disliked_items:
            query = query.filter(MenuItem.id.notin_(preferences.disliked_items))
        
        # Exclude already ordered items
        if user_item_ids:
            query = query.filter(MenuItem.id.notin_(user_item_ids))
        
        items = query.limit(limit).all()
        
        recommendations = []
        for item in items:
            score = 0.7  # Base score for preference match
            
            # Boost score if from favorite restaurant
            if preferences.favorite_restaurants and item.restaurant_id in preferences.favorite_restaurants:
                score += 0.2
            
            recommendations.append({
                "menu_item_id": item.id,
                "score": min(score, 1.0),
                "reason": "Matches your preferences",
                "recommendation_type": "preference"
            })
        
        return recommendations
    
    def trending_items(self, user_id: int, limit: int = 10, days: int = 7) -> List[Dict]:
        """
        Recommend trending items based on recent orders
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Get items ordered by the user
        user_item_ids = {
            item.menu_item_id 
            for item in self.db.query(OrderItem.menu_item_id).join(Order).filter(
                Order.user_id == user_id
            ).distinct().all()
        }
        
        trending = self.db.query(
            OrderItem.menu_item_id,
            func.count(OrderItem.id).label("order_count"),
            func.count(Order.user_id.distinct()).label("unique_users")
        )\
            .join(Order)\
            .join(MenuItem)\
            .filter(
                Order.created_at >= cutoff_date,
                Order.status.in_([OrderStatus.DELIVERED, OrderStatus.CONFIRMED]),
                MenuItem.is_available == True
            )\
            .group_by(OrderItem.menu_item_id)\
            .having(func.count(OrderItem.id) >= 5)\
            .order_by(desc("order_count"))\
            .limit(limit * 2)\
            .all()
        
        recommendations = []
        for item in trending:
            if item.menu_item_id not in user_item_ids:
                score = min(item.order_count / 50.0, 1.0)  # Normalize
                recommendations.append({
                    "menu_item_id": item.menu_item_id,
                    "score": score,
                    "reason": f"Trending now - {item.order_count} orders this week",
                    "recommendation_type": "trending"
                })
                
                if len(recommendations) >= limit:
                    break
        
        return recommendations
    
    def history_based_recommendations(self, user_id: int, limit: int = 10) -> List[Dict]:
        """
        Recommend items similar to user's order history
        """
        # Get user's most frequently ordered items
        frequent_items = self.db.query(
            OrderItem.menu_item_id,
            func.count(OrderItem.id).label("order_count"),
            func.max(Order.created_at).label("last_ordered")
        )\
            .join(Order)\
            .filter(
                Order.user_id == user_id,
                Order.status.in_([OrderStatus.DELIVERED, OrderStatus.CONFIRMED])
            )\
            .group_by(OrderItem.menu_item_id)\
            .order_by(desc("order_count"))\
            .limit(5)\
            .all()
        
        if not frequent_items:
            return []
        
        # Get similar items (from same restaurants or categories)
        frequent_item_ids = [item.menu_item_id for item in frequent_items]
        
        # Get restaurant IDs of frequently ordered items
        restaurant_ids = [
            r.restaurant_id 
            for r in self.db.query(MenuItem.restaurant_id).filter(
                MenuItem.id.in_(frequent_item_ids)
            ).distinct().all()
        ]
        
        # Find similar items from those restaurants
        similar_items = self.db.query(MenuItem)\
            .filter(
                MenuItem.restaurant_id.in_(restaurant_ids),
                MenuItem.id.notin_(frequent_item_ids),
                MenuItem.is_available == True
            )\
            .limit(limit)\
            .all()
        
        recommendations = []
        for item in similar_items:
            recommendations.append({
                "menu_item_id": item.id,
                "score": 0.75,
                "reason": "Similar to items you frequently order",
                "recommendation_type": "history"
            })
        
        return recommendations
    
    def similar_items(self, menu_item_id: int, limit: int = 10) -> List[Dict]:
        """
        Find items similar to a given menu item
        Based on same restaurant, category, or price range
        """
        item = self.db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
        if not item:
            return []
        
        # Find items from same restaurant or similar price range
        similar = self.db.query(MenuItem)\
            .filter(
                or_(
                    MenuItem.restaurant_id == item.restaurant_id,
                    and_(
                        MenuItem.price >= item.price * 0.8,
                        MenuItem.price <= item.price * 1.2
                    )
                ),
                MenuItem.id != menu_item_id,
                MenuItem.is_available == True
            )\
            .limit(limit)\
            .all()
        
        recommendations = []
        for similar_item in similar:
            score = 0.8 if similar_item.restaurant_id == item.restaurant_id else 0.6
            recommendations.append({
                "menu_item_id": similar_item.id,
                "score": score,
                "reason": "Similar to this item",
                "recommendation_type": "similar"
            })
        
        return recommendations
    
    def track_interaction(
        self, 
        user_id: int, 
        menu_item_id: int, 
        interaction_type: str
    ) -> UserItemInteraction:
        """
        Track user interactions with menu items for better recommendations
        """
        interaction = self.db.query(UserItemInteraction).filter(
            UserItemInteraction.user_id == user_id,
            UserItemInteraction.menu_item_id == menu_item_id
        ).first()
        
        if not interaction:
            interaction = UserItemInteraction(
                user_id=user_id,
                menu_item_id=menu_item_id
            )
            self.db.add(interaction)
        
        if interaction_type == "view":
            interaction.view_count += 1
        elif interaction_type == "order":
            interaction.order_count += 1
            interaction.last_ordered_at = datetime.utcnow()
            
            # Update total spent
            item = self.db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
            if item:
                interaction.total_spent += item.price
        
        # Calculate implicit rating based on interactions
        interaction.implicit_rating = self._calculate_implicit_rating(interaction)
        
        self.db.commit()
        self.db.refresh(interaction)
        
        return interaction
    
    def _calculate_implicit_rating(self, interaction: UserItemInteraction) -> float:
        """
        Calculate implicit rating (0-5) based on user interactions
        """
        rating = 0.0
        
        # Order count contributes most
        rating += min(interaction.order_count * 0.5, 3.0)
        
        # View count contributes less
        rating += min(interaction.view_count * 0.1, 1.0)
        
        # Recent orders boost rating
        if interaction.last_ordered_at:
            days_since = (datetime.utcnow() - interaction.last_ordered_at).days
            recency_boost = max(1.0 - (days_since / 30), 0) * 0.5
            rating += recency_boost
        
        return min(rating, 5.0)
    
    def save_recommendations(
        self, 
        user_id: int, 
        recommendations: List[Dict],
        expires_in_days: int = 7
    ):
        """
        Save recommendations to database for tracking
        """
        expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        for rec in recommendations:
            existing = self.db.query(MealRecommendation).filter(
                MealRecommendation.user_id == user_id,
                MealRecommendation.menu_item_id == rec["menu_item_id"],
                MealRecommendation.recommendation_type == rec["recommendation_type"]
            ).first()
            
            if existing:
                existing.score = rec["score"]
                existing.reason = rec.get("reason")
                existing.expires_at = expires_at
            else:
                recommendation = MealRecommendation(
                    user_id=user_id,
                    menu_item_id=rec["menu_item_id"],
                    score=rec["score"],
                    reason=rec.get("reason"),
                    recommendation_type=rec["recommendation_type"],
                    expires_at=expires_at
                )
                self.db.add(recommendation)
        
        self.db.commit()
