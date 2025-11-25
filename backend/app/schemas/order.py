from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.order import OrderStatus, OrderType


# Cart Schemas
class CartItemBase(BaseModel):
    menu_item_id: int
    quantity: int = Field(..., ge=1)
    special_instructions: Optional[str] = None


class CartItemCreate(CartItemBase):
    pass


class CartItemUpdate(BaseModel):
    quantity: Optional[int] = Field(None, ge=1)
    special_instructions: Optional[str] = None


class CartItemResponse(BaseModel):
    id: int
    cart_id: int
    menu_item_id: int
    quantity: int
    unit_price: float
    special_instructions: Optional[str] = None
    
    # Menu item details for display
    item_name: Optional[str] = None
    item_image: Optional[str] = None
    item_description: Optional[str] = None
    
    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: int
    user_id: int
    restaurant_id: Optional[int] = None
    items: List[CartItemResponse] = []
    total_items: int = 0
    subtotal: float = 0.0
    
    # Restaurant details
    restaurant_name: Optional[str] = None
    restaurant_logo: Optional[str] = None
    delivery_fee: float = 0.0
    minimum_order: float = 0.0
    
    class Config:
        from_attributes = True


class ClearCart(BaseModel):
    confirm: bool = True


# Order Schemas
class OrderItemBase(BaseModel):
    menu_item_id: int
    quantity: int = Field(..., ge=1)
    special_instructions: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: int
    menu_item_id: Optional[int] = None
    item_name: str
    item_description: Optional[str] = None
    item_image: Optional[str] = None
    unit_price: float
    quantity: int
    total_price: float
    special_instructions: Optional[str] = None
    
    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    address_id: int
    delivery_instructions: Optional[str] = None
    coupon_code: Optional[str] = None
    
    # For scheduled orders (Phase 2)
    order_type: OrderType = OrderType.INSTANT
    scheduled_date: Optional[datetime] = None
    scheduled_time_slot: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    id: int
    order_number: str
    user_id: int
    restaurant_id: Optional[int] = None
    address_id: Optional[int] = None
    order_type: OrderType
    status: OrderStatus
    subtotal: float
    tax_amount: float
    delivery_fee: float
    discount_amount: float
    total_amount: float
    coupon_code: Optional[str] = None
    delivery_instructions: Optional[str] = None
    estimated_delivery_time: Optional[datetime] = None
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    
    # Nested
    items: List[OrderItemResponse] = []
    
    # Additional display info
    restaurant_name: Optional[str] = None
    restaurant_logo: Optional[str] = None
    delivery_address: Optional[str] = None
    
    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    id: int
    order_number: str
    order_type: OrderType
    status: OrderStatus
    total_amount: float
    total_items: int
    restaurant_name: Optional[str] = None
    restaurant_logo: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
