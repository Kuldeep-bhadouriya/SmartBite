from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, restaurants, menu, cart, orders, addresses, payments, admin, time_slots

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(restaurants.router, prefix="/restaurants", tags=["Restaurants"])
api_router.include_router(menu.router, prefix="/menu", tags=["Menu"])
api_router.include_router(cart.router, prefix="/cart", tags=["Cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(addresses.router, prefix="/addresses", tags=["Addresses"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(time_slots.router, prefix="/time-slots", tags=["Time Slots & Scheduling"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
