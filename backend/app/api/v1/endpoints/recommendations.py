from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.recommendation import MealRecommendation, UserItemInteraction
from app.models.restaurant import MenuItem
from app.schemas.recommendation import (
    MealRecommendationResponse,
    RecommendationRequest,
    SimilarItemsRequest,
    TrendingItemsRequest,
    UserItemInteractionCreate,
    RecommendationFeedback
)
from app.services.recommendation_service import RecommendationService

router = APIRouter()


@router.get("/", response_model=List[MealRecommendationResponse])
def get_recommendations(
    request: RecommendationRequest = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get personalized meal recommendations for the current user"""
    service = RecommendationService(db)
    
    recommendations = service.get_recommendations_for_user(
        user_id=current_user.id,
        limit=request.limit,
        recommendation_type=request.recommendation_type
    )
    
    # Save recommendations for tracking
    service.save_recommendations(current_user.id, recommendations)
    
    # Load menu item details
    result = []
    for rec in recommendations:
        menu_item = db.query(MenuItem).options(
            joinedload(MenuItem.restaurant)
        ).filter(MenuItem.id == rec["menu_item_id"]).first()
        
        if menu_item:
            result.append(MealRecommendationResponse(
                id=0,  # Not saved yet
                menu_item_id=rec["menu_item_id"],
                score=rec["score"],
                reason=rec.get("reason"),
                recommendation_type=rec["recommendation_type"],
                menu_item={
                    "id": menu_item.id,
                    "name": menu_item.name,
                    "description": menu_item.description,
                    "price": menu_item.price,
                    "image_url": menu_item.image_url,
                    "is_available": menu_item.is_available
                },
                restaurant={
                    "id": menu_item.restaurant.id,
                    "name": menu_item.restaurant.name,
                    "slug": menu_item.restaurant.slug
                } if menu_item.restaurant else None
            ))
    
    return result


@router.get("/similar/{menu_item_id}", response_model=List[MealRecommendationResponse])
def get_similar_items(
    menu_item_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get items similar to a specific menu item"""
    service = RecommendationService(db)
    
    recommendations = service.similar_items(
        menu_item_id=menu_item_id,
        limit=limit
    )
    
    # Load menu item details
    result = []
    for rec in recommendations:
        menu_item = db.query(MenuItem).options(
            joinedload(MenuItem.restaurant)
        ).filter(MenuItem.id == rec["menu_item_id"]).first()
        
        if menu_item:
            result.append(MealRecommendationResponse(
                id=0,
                menu_item_id=rec["menu_item_id"],
                score=rec["score"],
                reason=rec.get("reason"),
                recommendation_type=rec["recommendation_type"],
                menu_item={
                    "id": menu_item.id,
                    "name": menu_item.name,
                    "description": menu_item.description,
                    "price": menu_item.price,
                    "image_url": menu_item.image_url,
                    "is_available": menu_item.is_available
                },
                restaurant={
                    "id": menu_item.restaurant.id,
                    "name": menu_item.restaurant.name,
                    "slug": menu_item.restaurant.slug
                } if menu_item.restaurant else None
            ))
    
    return result


@router.get("/trending", response_model=List[MealRecommendationResponse])
def get_trending_items(
    limit: int = 10,
    time_period: str = "week",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get trending menu items"""
    service = RecommendationService(db)
    
    days_map = {"day": 1, "week": 7, "month": 30}
    days = days_map.get(time_period, 7)
    
    recommendations = service.trending_items(
        user_id=current_user.id,
        limit=limit,
        days=days
    )
    
    # Load menu item details
    result = []
    for rec in recommendations:
        menu_item = db.query(MenuItem).options(
            joinedload(MenuItem.restaurant)
        ).filter(MenuItem.id == rec["menu_item_id"]).first()
        
        if menu_item:
            result.append(MealRecommendationResponse(
                id=0,
                menu_item_id=rec["menu_item_id"],
                score=rec["score"],
                reason=rec.get("reason"),
                recommendation_type=rec["recommendation_type"],
                menu_item={
                    "id": menu_item.id,
                    "name": menu_item.name,
                    "description": menu_item.description,
                    "price": menu_item.price,
                    "image_url": menu_item.image_url,
                    "is_available": menu_item.is_available
                },
                restaurant={
                    "id": menu_item.restaurant.id,
                    "name": menu_item.restaurant.name,
                    "slug": menu_item.restaurant.slug
                } if menu_item.restaurant else None
            ))
    
    return result


@router.post("/track-interaction", status_code=status.HTTP_204_NO_CONTENT)
def track_interaction(
    interaction: UserItemInteractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Track user interaction with a menu item"""
    service = RecommendationService(db)
    
    service.track_interaction(
        user_id=current_user.id,
        menu_item_id=interaction.menu_item_id,
        interaction_type=interaction.interaction_type
    )
    
    return None


@router.post("/feedback", status_code=status.HTTP_204_NO_CONTENT)
def submit_feedback(
    feedback: RecommendationFeedback,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit feedback on a recommendation"""
    recommendation = db.query(MealRecommendation).filter(
        MealRecommendation.id == feedback.recommendation_id,
        MealRecommendation.user_id == current_user.id
    ).first()
    
    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found"
        )
    
    # Update tracking metrics
    if feedback.action == "shown":
        recommendation.is_shown += 1
    elif feedback.action == "clicked":
        recommendation.is_clicked += 1
    elif feedback.action == "ordered":
        recommendation.is_ordered += 1
    
    db.commit()
    
    return None


@router.get("/for-meal-planner", response_model=List[MealRecommendationResponse])
def get_recommendations_for_meal_planner(
    day_of_week: int,
    meal_type: str,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recommendations for a specific meal slot in the planner"""
    service = RecommendationService(db)
    
    # Get general recommendations
    recommendations = service.get_recommendations_for_user(
        user_id=current_user.id,
        limit=limit * 2  # Get more to filter
    )
    
    # Could add meal_type specific filtering here
    # For now, just return the recommendations
    
    result = []
    for rec in recommendations[:limit]:
        menu_item = db.query(MenuItem).options(
            joinedload(MenuItem.restaurant)
        ).filter(MenuItem.id == rec["menu_item_id"]).first()
        
        if menu_item:
            result.append(MealRecommendationResponse(
                id=0,
                menu_item_id=rec["menu_item_id"],
                score=rec["score"],
                reason=rec.get("reason"),
                recommendation_type=rec["recommendation_type"],
                menu_item={
                    "id": menu_item.id,
                    "name": menu_item.name,
                    "description": menu_item.description,
                    "price": menu_item.price,
                    "image_url": menu_item.image_url,
                    "is_available": menu_item.is_available
                },
                restaurant={
                    "id": menu_item.restaurant.id,
                    "name": menu_item.restaurant.name,
                    "slug": menu_item.restaurant.slug
                } if menu_item.restaurant else None
            ))
    
    return result
