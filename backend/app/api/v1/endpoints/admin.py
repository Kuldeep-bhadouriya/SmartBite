from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import re

from app.db.session import get_db
from app.api.deps import get_admin_user
from app.models.user import User, UserRole
from app.models.restaurant import Restaurant, RestaurantStatus, MenuCategory, MenuItem
from app.models.order import Order, OrderStatus
from app.models.payment import Payment, PaymentStatus
from app.schemas.restaurant import (
    RestaurantCreate, RestaurantUpdate, RestaurantResponse,
    MenuCategoryCreate, MenuCategoryUpdate, MenuCategoryResponse,
    MenuItemCreate, MenuItemUpdate, MenuItemResponse
)
from app.schemas.order import OrderResponse, OrderStatusUpdate
from app.schemas.common import (
    MessageResponse, DashboardStats, OrderStats, PaginatedResponse
)

router = APIRouter()


def generate_slug(name: str, db: Session) -> str:
    """Generate unique URL-friendly slug"""
    base_slug = name.lower().strip()
    base_slug = re.sub(r'[^\w\s-]', '', base_slug)
    base_slug = re.sub(r'[\s_-]+', '-', base_slug)
    
    slug = base_slug
    counter = 1
    while db.query(Restaurant).filter(Restaurant.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    return slug


# Dashboard
@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    
    # Total counts
    total_orders = db.query(Order).count()
    total_users = db.query(User).filter(User.role == UserRole.USER).count()
    total_restaurants = db.query(Restaurant).count()
    
    # Revenue
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.status == OrderStatus.DELIVERED
    ).scalar() or 0
    
    # Today's stats
    orders_today = db.query(Order).filter(Order.created_at >= today_start).count()
    revenue_today = db.query(func.sum(Order.total_amount)).filter(
        Order.created_at >= today_start,
        Order.status == OrderStatus.DELIVERED
    ).scalar() or 0
    
    # Active orders
    pending_orders = db.query(Order).filter(Order.status == OrderStatus.PENDING).count()
    active_statuses = [
        OrderStatus.CONFIRMED, OrderStatus.PREPARING,
        OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY
    ]
    active_orders = db.query(Order).filter(Order.status.in_(active_statuses)).count()
    
    return DashboardStats(
        total_orders=total_orders,
        total_revenue=total_revenue,
        total_users=total_users,
        total_restaurants=total_restaurants,
        orders_today=orders_today,
        revenue_today=revenue_today,
        pending_orders=pending_orders,
        active_orders=active_orders
    )


@router.get("/orders/stats", response_model=OrderStats)
async def get_order_stats(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get order statistics by status"""
    stats = {}
    for status in OrderStatus:
        count = db.query(Order).filter(Order.status == status).count()
        stats[status.value] = count
    
    return OrderStats(
        total_orders=sum(stats.values()),
        pending=stats.get("pending", 0),
        confirmed=stats.get("confirmed", 0),
        preparing=stats.get("preparing", 0),
        out_for_delivery=stats.get("out_for_delivery", 0),
        delivered=stats.get("delivered", 0),
        cancelled=stats.get("cancelled", 0)
    )


# Restaurant Management
@router.get("/restaurants", response_model=PaginatedResponse[RestaurantResponse])
async def list_all_restaurants(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: Optional[RestaurantStatus] = None,
    search: Optional[str] = None
):
    """List all restaurants (admin)"""
    query = db.query(Restaurant)
    
    if status_filter:
        query = query.filter(Restaurant.status == status_filter)
    
    if search:
        query = query.filter(Restaurant.name.ilike(f"%{search}%"))
    
    total = query.count()
    pages = (total + size - 1) // size
    restaurants = query.offset((page - 1) * size).limit(size).all()
    
    return PaginatedResponse(
        items=restaurants,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.post("/restaurants", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED)
async def create_restaurant(
    restaurant_data: RestaurantCreate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new restaurant"""
    # Generate slug
    slug = restaurant_data.slug or generate_slug(restaurant_data.name, db)
    
    restaurant = Restaurant(
        **restaurant_data.model_dump(exclude={"slug"}),
        slug=slug
    )
    
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    
    return restaurant


@router.get("/restaurants/{restaurant_id}", response_model=RestaurantResponse)
async def get_restaurant_admin(
    restaurant_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get restaurant details (admin)"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    return restaurant


@router.put("/restaurants/{restaurant_id}", response_model=RestaurantResponse)
async def update_restaurant(
    restaurant_id: int,
    restaurant_data: RestaurantUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update restaurant"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    update_data = restaurant_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(restaurant, field, value)
    
    db.commit()
    db.refresh(restaurant)
    
    return restaurant


@router.delete("/restaurants/{restaurant_id}", response_model=MessageResponse)
async def delete_restaurant(
    restaurant_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete restaurant (soft delete by setting status)"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    restaurant.status = RestaurantStatus.INACTIVE
    db.commit()
    
    return MessageResponse(message="Restaurant deactivated successfully")


# Menu Category Management
@router.post("/categories", response_model=MenuCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: MenuCategoryCreate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create menu category"""
    # Verify restaurant exists
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == category_data.restaurant_id
    ).first()
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    category = MenuCategory(**category_data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return category


@router.put("/categories/{category_id}", response_model=MenuCategoryResponse)
async def update_category(
    category_id: int,
    category_data: MenuCategoryUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update menu category"""
    category = db.query(MenuCategory).filter(MenuCategory.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return category


@router.delete("/categories/{category_id}", response_model=MessageResponse)
async def delete_category(
    category_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete menu category"""
    category = db.query(MenuCategory).filter(MenuCategory.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    db.delete(category)
    db.commit()
    
    return MessageResponse(message="Category deleted successfully")


# Menu Item Management
@router.post("/menu-items", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
async def create_menu_item(
    item_data: MenuItemCreate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create menu item"""
    # Verify restaurant and category exist
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == item_data.restaurant_id
    ).first()
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    category = db.query(MenuCategory).filter(
        MenuCategory.id == item_data.category_id,
        MenuCategory.restaurant_id == item_data.restaurant_id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found or doesn't belong to this restaurant"
        )
    
    item = MenuItem(**item_data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return item


@router.put("/menu-items/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    item_id: int,
    item_data: MenuItemUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update menu item"""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    
    update_data = item_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    
    return item


@router.delete("/menu-items/{item_id}", response_model=MessageResponse)
async def delete_menu_item(
    item_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete menu item"""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    
    db.delete(item)
    db.commit()
    
    return MessageResponse(message="Menu item deleted successfully")


# Order Management
@router.get("/orders", response_model=PaginatedResponse[OrderResponse])
async def list_all_orders(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: Optional[OrderStatus] = None,
    restaurant_id: Optional[int] = None
):
    """List all orders (admin)"""
    query = db.query(Order)
    
    if status_filter:
        query = query.filter(Order.status == status_filter)
    
    if restaurant_id:
        query = query.filter(Order.restaurant_id == restaurant_id)
    
    query = query.order_by(Order.created_at.desc())
    
    total = query.count()
    pages = (total + size - 1) // size
    orders = query.offset((page - 1) * size).limit(size).all()
    
    # Build response (simplified)
    from app.api.v1.endpoints.orders import get_order_response
    items = [get_order_response(order, db) for order in orders]
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.put("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update order status"""
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    order.status = status_data.status
    
    # Update timestamps based on status
    if status_data.status == OrderStatus.CONFIRMED:
        order.confirmed_at = datetime.utcnow()
    elif status_data.status == OrderStatus.DELIVERED:
        order.delivered_at = datetime.utcnow()
        order.actual_delivery_time = datetime.utcnow()
        
        # Complete COD payment
        payment = db.query(Payment).filter(Payment.order_id == order.id).first()
        if payment and payment.payment_method.value == "cod":
            payment.status = PaymentStatus.COMPLETED
            payment.completed_at = datetime.utcnow()
    
    elif status_data.status == OrderStatus.CANCELLED:
        order.cancelled_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    from app.api.v1.endpoints.orders import get_order_response
    return get_order_response(order, db)
