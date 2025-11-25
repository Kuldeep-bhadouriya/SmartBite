from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.cart import Cart, CartItem
from app.models.restaurant import Restaurant, MenuItem
from app.schemas.order import CartItemCreate, CartItemUpdate, CartResponse, CartItemResponse, ClearCart
from app.schemas.common import MessageResponse

router = APIRouter()


def get_cart_response(cart: Cart, db: Session) -> CartResponse:
    """Build cart response with item details"""
    items = []
    for cart_item in cart.items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == cart_item.menu_item_id).first()
        item_response = CartItemResponse(
            id=cart_item.id,
            cart_id=cart_item.cart_id,
            menu_item_id=cart_item.menu_item_id,
            quantity=cart_item.quantity,
            unit_price=cart_item.unit_price,
            special_instructions=cart_item.special_instructions,
            item_name=menu_item.name if menu_item else None,
            item_image=menu_item.image if menu_item else None,
            item_description=menu_item.description if menu_item else None
        )
        items.append(item_response)
    
    restaurant = None
    if cart.restaurant_id:
        restaurant = db.query(Restaurant).filter(Restaurant.id == cart.restaurant_id).first()
    
    return CartResponse(
        id=cart.id,
        user_id=cart.user_id,
        restaurant_id=cart.restaurant_id,
        items=items,
        total_items=cart.total_items,
        subtotal=cart.subtotal,
        restaurant_name=restaurant.name if restaurant else None,
        restaurant_logo=restaurant.logo if restaurant else None,
        delivery_fee=restaurant.delivery_fee if restaurant else 0,
        minimum_order=restaurant.minimum_order if restaurant else 0
    )


@router.get("", response_model=CartResponse)
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's cart"""
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    
    if not cart:
        # Create empty cart
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    
    return get_cart_response(cart, db)


@router.post("/items", response_model=CartResponse)
async def add_to_cart(
    item_data: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add item to cart"""
    # Get or create cart
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    
    # Get menu item
    menu_item = db.query(MenuItem).filter(
        MenuItem.id == item_data.menu_item_id,
        MenuItem.is_available == True
    ).first()
    
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found or not available"
        )
    
    # Check if cart has items from different restaurant
    if cart.restaurant_id and cart.restaurant_id != menu_item.restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add items from different restaurants. Please clear cart first."
        )
    
    # Update cart restaurant
    cart.restaurant_id = menu_item.restaurant_id
    
    # Check if item already in cart
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.menu_item_id == item_data.menu_item_id
    ).first()
    
    if existing_item:
        existing_item.quantity += item_data.quantity
        existing_item.special_instructions = item_data.special_instructions or existing_item.special_instructions
    else:
        cart_item = CartItem(
            cart_id=cart.id,
            menu_item_id=menu_item.id,
            quantity=item_data.quantity,
            unit_price=menu_item.discounted_price or menu_item.price,
            special_instructions=item_data.special_instructions
        )
        db.add(cart_item)
    
    db.commit()
    db.refresh(cart)
    
    return get_cart_response(cart, db)


@router.put("/items/{item_id}", response_model=CartResponse)
async def update_cart_item(
    item_id: int,
    item_data: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update cart item quantity or instructions"""
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    
    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )
    
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    
    if item_data.quantity is not None:
        cart_item.quantity = item_data.quantity
    
    if item_data.special_instructions is not None:
        cart_item.special_instructions = item_data.special_instructions
    
    db.commit()
    db.refresh(cart)
    
    return get_cart_response(cart, db)


@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_from_cart(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove item from cart"""
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    
    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )
    
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    
    db.delete(cart_item)
    
    # If cart is empty, reset restaurant
    remaining_items = db.query(CartItem).filter(CartItem.cart_id == cart.id).count()
    if remaining_items == 0:
        cart.restaurant_id = None
    
    db.commit()
    db.refresh(cart)
    
    return get_cart_response(cart, db)


@router.post("/clear", response_model=MessageResponse)
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all items from cart"""
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    
    if cart:
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        cart.restaurant_id = None
        db.commit()
    
    return MessageResponse(message="Cart cleared successfully")
