from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
import re

from app.db.session import get_db
from app.models.restaurant import Restaurant, RestaurantStatus, MenuCategory, MenuItem
from app.schemas.restaurant import (
    RestaurantResponse,
    RestaurantListResponse,
    RestaurantWithMenu,
    MenuCategoryWithItems,
    MenuItemResponse
)
from app.schemas.common import PaginatedResponse

router = APIRouter()


def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name"""
    slug = name.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    return slug


@router.get("", response_model=PaginatedResponse[RestaurantListResponse])
async def list_restaurants(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    city: Optional[str] = None,
    cuisine: Optional[str] = None,
    is_veg: Optional[bool] = None,
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    sort_by: Optional[str] = Query("rating", regex="^(rating|name|delivery_fee|preparation_time)$"),
    sort_order: Optional[str] = Query("desc", regex="^(asc|desc)$")
):
    """List restaurants with search and filters"""
    query = db.query(Restaurant).filter(Restaurant.status == RestaurantStatus.ACTIVE)
    
    # Search
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Restaurant.name.ilike(search_term),
                Restaurant.cuisine_type.ilike(search_term),
                Restaurant.description.ilike(search_term)
            )
        )
    
    # Filters
    if city:
        query = query.filter(Restaurant.city.ilike(f"%{city}%"))
    
    if cuisine:
        query = query.filter(Restaurant.cuisine_type.ilike(f"%{cuisine}%"))
    
    if is_veg is not None:
        if is_veg:
            query = query.filter(Restaurant.is_veg == True)
        else:
            query = query.filter(Restaurant.is_non_veg == True)
    
    if min_rating is not None:
        query = query.filter(Restaurant.rating >= min_rating)
    
    # Sorting
    sort_column = getattr(Restaurant, sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Featured restaurants first
    query = query.order_by(Restaurant.is_featured.desc())
    
    # Pagination
    total = query.count()
    pages = (total + size - 1) // size
    items = query.offset((page - 1) * size).limit(size).all()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/featured", response_model=List[RestaurantListResponse])
async def get_featured_restaurants(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=50)
):
    """Get featured restaurants"""
    restaurants = db.query(Restaurant).filter(
        Restaurant.status == RestaurantStatus.ACTIVE,
        Restaurant.is_featured == True
    ).order_by(Restaurant.rating.desc()).limit(limit).all()
    
    return restaurants


@router.get("/nearby", response_model=List[RestaurantListResponse])
async def get_nearby_restaurants(
    db: Session = Depends(get_db),
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius: float = Query(10, description="Radius in kilometers"),
    limit: int = Query(20, ge=1, le=100)
):
    """Get restaurants within a radius"""
    # Simple distance calculation using Haversine formula approximation
    # For production, use PostGIS or proper geospatial queries
    
    restaurants = db.query(Restaurant).filter(
        Restaurant.status == RestaurantStatus.ACTIVE,
        Restaurant.latitude.isnot(None),
        Restaurant.longitude.isnot(None)
    ).all()
    
    # Filter by distance
    nearby = []
    for r in restaurants:
        # Approximate distance calculation
        lat_diff = abs(r.latitude - latitude) * 111  # 1 degree ≈ 111 km
        lon_diff = abs(r.longitude - longitude) * 111 * 0.85  # Adjust for latitude
        distance = (lat_diff ** 2 + lon_diff ** 2) ** 0.5
        
        if distance <= radius and distance <= r.delivery_radius:
            nearby.append(r)
    
    # Sort by distance and limit
    return nearby[:limit]


@router.get("/cuisines", response_model=List[str])
async def get_cuisines(db: Session = Depends(get_db)):
    """Get list of all available cuisines"""
    restaurants = db.query(Restaurant.cuisine_type).filter(
        Restaurant.status == RestaurantStatus.ACTIVE,
        Restaurant.cuisine_type.isnot(None)
    ).distinct().all()
    
    cuisines = set()
    for r in restaurants:
        if r.cuisine_type:
            for cuisine in r.cuisine_type.split(","):
                cuisines.add(cuisine.strip())
    
    return sorted(list(cuisines))


@router.get("/{slug}", response_model=RestaurantWithMenu)
async def get_restaurant(slug: str, db: Session = Depends(get_db)):
    """Get restaurant details with full menu"""
    restaurant = db.query(Restaurant).filter(
        Restaurant.slug == slug,
        Restaurant.status == RestaurantStatus.ACTIVE
    ).first()
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    # Get categories with items
    categories = db.query(MenuCategory).filter(
        MenuCategory.restaurant_id == restaurant.id,
        MenuCategory.is_active == True
    ).order_by(MenuCategory.display_order).all()
    
    categories_with_items = []
    for category in categories:
        items = db.query(MenuItem).filter(
            MenuItem.category_id == category.id,
            MenuItem.is_available == True
        ).order_by(MenuItem.display_order).all()
        
        cat_data = MenuCategoryWithItems(
            id=category.id,
            restaurant_id=category.restaurant_id,
            name=category.name,
            description=category.description,
            image=category.image,
            display_order=category.display_order,
            is_active=category.is_active,
            items=[MenuItemResponse.model_validate(item) for item in items]
        )
        categories_with_items.append(cat_data)
    
    return RestaurantWithMenu(
        **RestaurantResponse.model_validate(restaurant).model_dump(),
        categories=categories_with_items
    )


@router.get("/{slug}/menu", response_model=List[MenuCategoryWithItems])
async def get_restaurant_menu(slug: str, db: Session = Depends(get_db)):
    """Get restaurant menu organized by categories"""
    restaurant = db.query(Restaurant).filter(
        Restaurant.slug == slug,
        Restaurant.status == RestaurantStatus.ACTIVE
    ).first()
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    categories = db.query(MenuCategory).filter(
        MenuCategory.restaurant_id == restaurant.id,
        MenuCategory.is_active == True
    ).order_by(MenuCategory.display_order).all()
    
    result = []
    for category in categories:
        items = db.query(MenuItem).filter(
            MenuItem.category_id == category.id,
            MenuItem.is_available == True
        ).order_by(MenuItem.display_order).all()
        
        cat_data = MenuCategoryWithItems(
            id=category.id,
            restaurant_id=category.restaurant_id,
            name=category.name,
            description=category.description,
            image=category.image,
            display_order=category.display_order,
            is_active=category.is_active,
            items=[MenuItemResponse.model_validate(item) for item in items]
        )
        result.append(cat_data)
    
    return result


@router.get("/{slug}/search", response_model=List[MenuItemResponse])
async def search_menu_items(
    slug: str,
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """Search menu items in a restaurant"""
    restaurant = db.query(Restaurant).filter(
        Restaurant.slug == slug,
        Restaurant.status == RestaurantStatus.ACTIVE
    ).first()
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    search_term = f"%{q}%"
    items = db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant.id,
        MenuItem.is_available == True,
        or_(
            MenuItem.name.ilike(search_term),
            MenuItem.description.ilike(search_term),
            MenuItem.ingredients.ilike(search_term)
        )
    ).all()
    
    return items
