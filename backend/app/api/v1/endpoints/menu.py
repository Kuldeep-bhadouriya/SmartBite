from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models.restaurant import MenuItem, MenuCategory
from app.schemas.restaurant import MenuItemResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("/items", response_model=PaginatedResponse[MenuItemResponse])
async def list_menu_items(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    is_veg: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
):
    """List menu items with filters"""
    query = db.query(MenuItem).filter(MenuItem.is_available == True)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(MenuItem.name.ilike(search_term))
    
    if category_id:
        query = query.filter(MenuItem.category_id == category_id)
    
    if is_veg is not None:
        if is_veg:
            query = query.filter(MenuItem.item_type.in_(["veg", "vegan"]))
        else:
            query = query.filter(MenuItem.item_type.in_(["non_veg", "egg"]))
    
    if is_featured is not None:
        query = query.filter(MenuItem.is_featured == is_featured)
    
    if min_price is not None:
        query = query.filter(MenuItem.price >= min_price)
    
    if max_price is not None:
        query = query.filter(MenuItem.price <= max_price)
    
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


@router.get("/items/{item_id}", response_model=MenuItemResponse)
async def get_menu_item(item_id: int, db: Session = Depends(get_db)):
    """Get a specific menu item"""
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.is_available == True
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    
    return item


@router.get("/bestsellers", response_model=List[MenuItemResponse])
async def get_bestsellers(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=50)
):
    """Get bestseller items"""
    items = db.query(MenuItem).filter(
        MenuItem.is_available == True,
        MenuItem.is_bestseller == True
    ).order_by(MenuItem.rating.desc()).limit(limit).all()
    
    return items


@router.get("/featured", response_model=List[MenuItemResponse])
async def get_featured_items(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=50)
):
    """Get featured items"""
    items = db.query(MenuItem).filter(
        MenuItem.is_available == True,
        MenuItem.is_featured == True
    ).order_by(MenuItem.rating.desc()).limit(limit).all()
    
    return items
