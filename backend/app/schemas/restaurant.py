from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.restaurant import RestaurantStatus, ItemType


# Restaurant Schemas
class RestaurantBase(BaseModel):
    name: str
    description: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: str
    city: str
    state: Optional[str] = None
    postal_code: Optional[str] = None
    cuisine_type: Optional[str] = None
    is_veg: bool = False
    is_non_veg: bool = True
    average_cost_for_two: Optional[float] = None


class RestaurantCreate(RestaurantBase):
    slug: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    logo: Optional[str] = None
    cover_image: Optional[str] = None
    opening_time: str = "09:00"
    closing_time: str = "22:00"
    preparation_time: int = 30
    delivery_radius: float = 10.0
    minimum_order: float = 0.0
    delivery_fee: float = 0.0
    free_delivery_above: Optional[float] = None


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    cuisine_type: Optional[str] = None
    is_veg: Optional[bool] = None
    is_non_veg: Optional[bool] = None
    average_cost_for_two: Optional[float] = None
    logo: Optional[str] = None
    cover_image: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    status: Optional[RestaurantStatus] = None
    is_featured: Optional[bool] = None
    preparation_time: Optional[int] = None
    delivery_radius: Optional[float] = None
    minimum_order: Optional[float] = None
    delivery_fee: Optional[float] = None
    free_delivery_above: Optional[float] = None


class RestaurantResponse(RestaurantBase):
    id: int
    slug: str
    logo: Optional[str] = None
    cover_image: Optional[str] = None
    rating: float
    total_ratings: int
    status: RestaurantStatus
    is_featured: bool
    opening_time: str
    closing_time: str
    preparation_time: int
    delivery_radius: float
    minimum_order: float
    delivery_fee: float
    free_delivery_above: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class RestaurantListResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    address: str
    city: str
    cuisine_type: Optional[str] = None
    is_veg: bool
    is_non_veg: bool
    logo: Optional[str] = None
    cover_image: Optional[str] = None
    rating: float
    total_ratings: int
    average_cost_for_two: Optional[float] = None
    delivery_fee: float
    preparation_time: int
    is_featured: bool
    
    class Config:
        from_attributes = True


# Menu Category Schemas
class MenuCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    display_order: int = 0


class MenuCategoryCreate(MenuCategoryBase):
    restaurant_id: int


class MenuCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class MenuCategoryResponse(MenuCategoryBase):
    id: int
    restaurant_id: int
    is_active: bool
    
    class Config:
        from_attributes = True


# Menu Item Schemas
class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    price: float = Field(..., gt=0)
    discounted_price: Optional[float] = None
    item_type: ItemType = ItemType.VEG
    is_spicy: bool = False
    spice_level: int = Field(default=0, ge=0, le=5)
    allergens: Optional[str] = None
    ingredients: Optional[str] = None
    preparation_time: int = 20
    serves: int = 1


class MenuItemCreate(MenuItemBase):
    restaurant_id: int
    category_id: int


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    price: Optional[float] = None
    discounted_price: Optional[float] = None
    item_type: Optional[ItemType] = None
    is_spicy: Optional[bool] = None
    spice_level: Optional[int] = None
    allergens: Optional[str] = None
    ingredients: Optional[str] = None
    is_available: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_bestseller: Optional[bool] = None
    preparation_time: Optional[int] = None
    serves: Optional[int] = None
    display_order: Optional[int] = None
    category_id: Optional[int] = None
    # Nutrition fields
    calories: Optional[int] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    fiber: Optional[float] = None


class MenuItemResponse(MenuItemBase):
    id: int
    restaurant_id: int
    category_id: int
    is_available: bool
    is_featured: bool
    is_bestseller: bool
    rating: float
    total_ratings: int
    display_order: int
    calories: Optional[int] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    fiber: Optional[float] = None
    
    class Config:
        from_attributes = True


# Restaurant with Menu
class MenuCategoryWithItems(MenuCategoryResponse):
    items: List[MenuItemResponse] = []


class RestaurantWithMenu(RestaurantResponse):
    categories: List[MenuCategoryWithItems] = []
