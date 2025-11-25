from pydantic import BaseModel
from typing import Generic, TypeVar, Optional, List

T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None


# Dashboard Statistics
class DashboardStats(BaseModel):
    total_orders: int
    total_revenue: float
    total_users: int
    total_restaurants: int
    orders_today: int
    revenue_today: float
    pending_orders: int
    active_orders: int


class OrderStats(BaseModel):
    total_orders: int
    pending: int
    confirmed: int
    preparing: int
    out_for_delivery: int
    delivered: int
    cancelled: int


class RestaurantStats(BaseModel):
    total_orders: int
    total_revenue: float
    average_order_value: float
    rating: float
    total_ratings: int
