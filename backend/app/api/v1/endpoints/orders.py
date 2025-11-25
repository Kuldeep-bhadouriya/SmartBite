from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, timedelta, date
import uuid

from app.db.session import get_db
from app.api.deps import get_current_user, get_admin_user
from app.models.user import User
from app.models.order import Order, OrderItem, OrderStatus, OrderType
from app.models.cart import Cart, CartItem
from app.models.restaurant import Restaurant, MenuItem
from app.models.address import Address
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.models.time_slot import TimeSlot, SlotAvailability, ScheduledOrderReminder
from app.schemas.order import (
    OrderCreate, OrderResponse, OrderListResponse, OrderStatusUpdate, OrderItemResponse
)
from app.schemas.time_slot import ScheduledOrderEdit, ScheduledOrderCancel
from app.schemas.common import PaginatedResponse, MessageResponse

router = APIRouter()


def generate_order_number() -> str:
    """Generate unique order number"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M")
    unique_id = str(uuid.uuid4())[:6].upper()
    return f"SB{timestamp}{unique_id}"


def get_order_response(order: Order, db: Session) -> OrderResponse:
    """Build order response with details"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
    address = db.query(Address).filter(Address.id == order.address_id).first()
    
    items = []
    for item in order.items:
        items.append(OrderItemResponse(
            id=item.id,
            menu_item_id=item.menu_item_id,
            item_name=item.item_name,
            item_description=item.item_description,
            item_image=item.item_image,
            unit_price=item.unit_price,
            quantity=item.quantity,
            total_price=item.total_price,
            special_instructions=item.special_instructions
        ))
    
    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        user_id=order.user_id,
        restaurant_id=order.restaurant_id,
        address_id=order.address_id,
        order_type=order.order_type,
        status=order.status,
        subtotal=order.subtotal,
        tax_amount=order.tax_amount,
        delivery_fee=order.delivery_fee,
        discount_amount=order.discount_amount,
        total_amount=order.total_amount,
        coupon_code=order.coupon_code,
        delivery_instructions=order.delivery_instructions,
        estimated_delivery_time=order.estimated_delivery_time,
        created_at=order.created_at,
        confirmed_at=order.confirmed_at,
        delivered_at=order.delivered_at,
        items=items,
        restaurant_name=restaurant.name if restaurant else None,
        restaurant_logo=restaurant.logo if restaurant else None,
        delivery_address=address.full_address if address else None
    )


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new order from cart (supports both instant and scheduled delivery)"""
    # Get user's cart
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    
    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty"
        )
    
    # Validate address
    address = db.query(Address).filter(
        Address.id == order_data.address_id,
        Address.user_id == current_user.id,
        Address.is_active == True
    ).first()
    
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery address not found"
        )
    
    # Get restaurant
    restaurant = db.query(Restaurant).filter(Restaurant.id == cart.restaurant_id).first()
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    # Validate scheduled order if applicable
    scheduled_time_slot_name = None
    if order_data.order_type == OrderType.SCHEDULED:
        if not order_data.scheduled_date or not order_data.time_slot_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Scheduled date and time slot are required for scheduled orders"
            )
        
        # Get time slot
        time_slot = db.query(TimeSlot).filter(TimeSlot.id == order_data.time_slot_id).first()
        if not time_slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Time slot not found"
            )
        
        scheduled_time_slot_name = time_slot.name
        scheduled_date = order_data.scheduled_date.date() if isinstance(order_data.scheduled_date, datetime) else order_data.scheduled_date
        
        # Check slot availability
        slot_avail = db.query(SlotAvailability).filter(
            and_(
                SlotAvailability.restaurant_id == restaurant.id,
                SlotAvailability.time_slot_id == order_data.time_slot_id,
                SlotAvailability.date == scheduled_date
            )
        ).first()
        
        if not slot_avail or slot_avail.remaining_capacity <= 0 or not slot_avail.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected time slot is not available"
            )
        
        # Update slot availability
        slot_avail.booked_orders += 1
        slot_avail.remaining_capacity -= 1
        if slot_avail.remaining_capacity <= 0:
            slot_avail.is_available = False
    
    # Calculate totals
    subtotal = cart.subtotal
    tax_rate = 0.05  # 5% GST
    tax_amount = round(subtotal * tax_rate, 2)
    delivery_fee = restaurant.delivery_fee
    
    # Free delivery check
    if restaurant.free_delivery_above and subtotal >= restaurant.free_delivery_above:
        delivery_fee = 0
    
    # Minimum order check
    if subtotal < restaurant.minimum_order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum order amount is ₹{restaurant.minimum_order}"
        )
    
    # Apply discount (placeholder - would integrate with coupon system)
    discount_amount = 0
    
    total_amount = subtotal + tax_amount + delivery_fee - discount_amount
    
    # Estimated delivery time
    if order_data.order_type == OrderType.INSTANT:
        estimated_delivery = datetime.utcnow() + timedelta(minutes=restaurant.preparation_time + 20)
    else:
        # For scheduled orders, set estimated delivery to scheduled time
        estimated_delivery = order_data.scheduled_date
    
    # Create order
    order = Order(
        order_number=generate_order_number(),
        user_id=current_user.id,
        restaurant_id=restaurant.id,
        address_id=address.id,
        order_type=order_data.order_type,
        subtotal=subtotal,
        tax_amount=tax_amount,
        delivery_fee=delivery_fee,
        discount_amount=discount_amount,
        total_amount=total_amount,
        coupon_code=order_data.coupon_code,
        delivery_instructions=order_data.delivery_instructions,
        estimated_delivery_time=estimated_delivery,
        scheduled_date=order_data.scheduled_date if order_data.order_type == OrderType.SCHEDULED else None,
        scheduled_time_slot=scheduled_time_slot_name
    )
    db.add(order)
    db.flush()
    
    # Create order items
    for cart_item in cart.items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == cart_item.menu_item_id).first()
        
        order_item = OrderItem(
            order_id=order.id,
            menu_item_id=cart_item.menu_item_id,
            item_name=menu_item.name,
            item_description=menu_item.description,
            item_image=menu_item.image,
            unit_price=cart_item.unit_price,
            quantity=cart_item.quantity,
            total_price=cart_item.unit_price * cart_item.quantity,
            special_instructions=cart_item.special_instructions
        )
        db.add(order_item)
    
    # Create reminder for scheduled orders
    if order_data.order_type == OrderType.SCHEDULED:
        reminder = ScheduledOrderReminder(
            order_id=order.id,
            reminder_1_hours=24,
            reminder_2_hours=2,
            reminder_3_hours=0  # 30 minutes represented as 0 (would use fractional hours)
        )
        db.add(reminder)
    
    # Clear cart
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    cart.restaurant_id = None
    
    db.commit()
    db.refresh(order)
    
    return get_order_response(order, db)


@router.get("", response_model=PaginatedResponse[OrderListResponse])
async def list_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    status_filter: Optional[OrderStatus] = None
):
    """Get user's order history"""
    query = db.query(Order).filter(Order.user_id == current_user.id)
    
    if status_filter:
        query = query.filter(Order.status == status_filter)
    
    query = query.order_by(Order.created_at.desc())
    
    total = query.count()
    pages = (total + size - 1) // size
    orders = query.offset((page - 1) * size).limit(size).all()
    
    items = []
    for order in orders:
        restaurant = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
        items.append(OrderListResponse(
            id=order.id,
            order_number=order.order_number,
            order_type=order.order_type,
            status=order.status,
            total_amount=order.total_amount,
            total_items=len(order.items),
            restaurant_name=restaurant.name if restaurant else None,
            restaurant_logo=restaurant.logo if restaurant else None,
            created_at=order.created_at
        ))
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/active", response_model=List[OrderResponse])
async def get_active_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's active orders"""
    active_statuses = [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
        OrderStatus.OUT_FOR_DELIVERY
    ]
    
    orders = db.query(Order).filter(
        Order.user_id == current_user.id,
        Order.status.in_(active_statuses)
    ).order_by(Order.created_at.desc()).all()
    
    return [get_order_response(order, db) for order in orders]


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get order details"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return get_order_response(order, db)


@router.get("/track/{order_number}", response_model=OrderResponse)
async def track_order(
    order_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track order by order number"""
    order = db.query(Order).filter(
        Order.order_number == order_number,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return get_order_response(order, db)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel an order"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Can only cancel pending or confirmed orders
    if order.status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel order in current status"
        )
    
    order.status = OrderStatus.CANCELLED
    order.cancelled_at = datetime.utcnow()
    
    # Handle refund if payment was made
    payment = db.query(Payment).filter(Payment.order_id == order.id).first()
    if payment and payment.status == PaymentStatus.COMPLETED:
        payment.status = PaymentStatus.REFUNDED
        payment.refunded_at = datetime.utcnow()
        payment.refund_amount = payment.amount
    
    db.commit()
    db.refresh(order)
    
    return get_order_response(order, db)


@router.post("/{order_id}/reorder", response_model=MessageResponse)
async def reorder(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add items from previous order to cart"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Get or create cart
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    
    # Clear existing cart if from different restaurant
    if cart.restaurant_id and cart.restaurant_id != order.restaurant_id:
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    
    cart.restaurant_id = order.restaurant_id
    
    # Add items to cart
    for order_item in order.items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == order_item.menu_item_id).first()
        
        if menu_item and menu_item.is_available:
            existing = db.query(CartItem).filter(
                CartItem.cart_id == cart.id,
                CartItem.menu_item_id == order_item.menu_item_id
            ).first()
            
            if existing:
                existing.quantity += order_item.quantity
            else:
                cart_item = CartItem(
                    cart_id=cart.id,
                    menu_item_id=order_item.menu_item_id,
                    quantity=order_item.quantity,
                    unit_price=menu_item.discounted_price or menu_item.price,
                    special_instructions=order_item.special_instructions
                )
                db.add(cart_item)
    
    db.commit()
    
    return MessageResponse(message="Items added to cart")


# ============================================
# Scheduled Order Management
# ============================================

@router.get("/scheduled/upcoming", response_model=List[OrderResponse])
async def get_upcoming_scheduled_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's upcoming scheduled orders"""
    orders = db.query(Order).filter(
        Order.user_id == current_user.id,
        Order.order_type == OrderType.SCHEDULED,
        Order.scheduled_date >= datetime.utcnow(),
        Order.status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED])
    ).order_by(Order.scheduled_date).all()
    
    return [get_order_response(order, db) for order in orders]


@router.put("/{order_id}/reschedule", response_model=OrderResponse)
async def reschedule_order(
    order_id: int,
    schedule_update: ScheduledOrderEdit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit/reschedule a scheduled order"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id,
        Order.order_type == OrderType.SCHEDULED
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled order not found"
        )
    
    # Can only reschedule pending or confirmed orders
    if order.status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reschedule order in current status"
        )
    
    # Check if order is too close to scheduled time
    if order.scheduled_date:
        hours_until = (order.scheduled_date - datetime.utcnow()).total_seconds() / 3600
        if hours_until < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot reschedule order less than 2 hours before delivery time"
            )
    
    # Update scheduled date/time if provided
    if schedule_update.scheduled_date and schedule_update.time_slot_id:
        # Release old slot
        if order.scheduled_date:
            old_date = order.scheduled_date.date()
            old_slots = db.query(SlotAvailability).filter(
                and_(
                    SlotAvailability.restaurant_id == order.restaurant_id,
                    SlotAvailability.date == old_date
                )
            ).all()
            for slot in old_slots:
                if slot.booked_orders > 0:
                    slot.booked_orders -= 1
                    slot.remaining_capacity += 1
                    if slot.remaining_capacity > 0:
                        slot.is_available = True
        
        # Get new time slot
        time_slot = db.query(TimeSlot).filter(TimeSlot.id == schedule_update.time_slot_id).first()
        if not time_slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Time slot not found"
            )
        
        # Check new slot availability
        new_slot_avail = db.query(SlotAvailability).filter(
            and_(
                SlotAvailability.restaurant_id == order.restaurant_id,
                SlotAvailability.time_slot_id == schedule_update.time_slot_id,
                SlotAvailability.date == schedule_update.scheduled_date
            )
        ).first()
        
        if not new_slot_avail or new_slot_avail.remaining_capacity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected time slot is not available"
            )
        
        # Book new slot
        new_slot_avail.booked_orders += 1
        new_slot_avail.remaining_capacity -= 1
        if new_slot_avail.remaining_capacity <= 0:
            new_slot_avail.is_available = False
        
        # Update order
        order.scheduled_date = datetime.combine(schedule_update.scheduled_date, time_slot.start_time)
        order.scheduled_time_slot = time_slot.name
        order.estimated_delivery_time = order.scheduled_date
    
    # Update delivery instructions if provided
    if schedule_update.delivery_instructions is not None:
        order.delivery_instructions = schedule_update.delivery_instructions
    
    db.commit()
    db.refresh(order)
    
    return get_order_response(order, db)


@router.post("/{order_id}/cancel-scheduled", response_model=OrderResponse)
async def cancel_scheduled_order(
    order_id: int,
    cancel_data: ScheduledOrderCancel,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a scheduled order with reason"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id,
        Order.order_type == OrderType.SCHEDULED
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled order not found"
        )
    
    # Can only cancel pending or confirmed orders
    if order.status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel order in current status"
        )
    
    # Release slot capacity
    if order.scheduled_date:
        scheduled_date = order.scheduled_date.date()
        slot_availabilities = db.query(SlotAvailability).filter(
            and_(
                SlotAvailability.restaurant_id == order.restaurant_id,
                SlotAvailability.date == scheduled_date
            )
        ).all()
        
        for slot in slot_availabilities:
            if slot.booked_orders > 0:
                slot.booked_orders -= 1
                slot.remaining_capacity += 1
                if slot.remaining_capacity > 0:
                    slot.is_available = True
    
    # Cancel order
    order.status = OrderStatus.CANCELLED
    order.cancelled_at = datetime.utcnow()
    order.cancellation_reason = cancel_data.cancellation_reason
    
    # Handle refund if payment was made
    payment = db.query(Payment).filter(Payment.order_id == order.id).first()
    if payment and payment.status == PaymentStatus.COMPLETED:
        payment.status = PaymentStatus.REFUNDED
        payment.refunded_at = datetime.utcnow()
        payment.refund_amount = payment.amount
    
    db.commit()
    db.refresh(order)
    
    return get_order_response(order, db)
