from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
import stripe
import uuid

from app.db.session import get_db
from app.api.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.order import Order, OrderStatus
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.schemas.payment import (
    PaymentIntentCreate, PaymentIntentResponse, PaymentConfirm,
    PaymentResponse, CODPaymentConfirm, RefundRequest
)
from app.schemas.common import MessageResponse

router = APIRouter()

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


@router.post("/create-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    payment_data: PaymentIntentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a payment intent for card payments"""
    # Get order
    order = db.query(Order).filter(
        Order.id == payment_data.order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not in pending status"
        )
    
    # Check if payment already exists
    existing_payment = db.query(Payment).filter(Payment.order_id == order.id).first()
    if existing_payment and existing_payment.status == PaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment already completed for this order"
        )
    
    # Create Stripe payment intent
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(order.total_amount * 100),  # Convert to paise
            currency="inr",
            metadata={
                "order_id": order.id,
                "user_id": current_user.id,
                "order_number": order.order_number
            }
        )
        
        # Create or update payment record
        if existing_payment:
            existing_payment.gateway_payment_id = intent.id
            existing_payment.payment_method = payment_data.payment_method
            existing_payment.status = PaymentStatus.PROCESSING
        else:
            payment = Payment(
                order_id=order.id,
                payment_method=payment_data.payment_method,
                amount=order.total_amount,
                gateway="stripe",
                gateway_payment_id=intent.id,
                status=PaymentStatus.PROCESSING
            )
            db.add(payment)
        
        db.commit()
        
        return PaymentIntentResponse(
            client_secret=intent.client_secret,
            payment_intent_id=intent.id,
            amount=order.total_amount,
            currency="INR"
        )
        
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/confirm", response_model=PaymentResponse)
async def confirm_payment(
    payment_data: PaymentConfirm,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirm payment after successful processing"""
    payment = db.query(Payment).filter(
        Payment.gateway_payment_id == payment_data.payment_intent_id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Verify with Stripe
    try:
        intent = stripe.PaymentIntent.retrieve(payment_data.payment_intent_id)
        
        if intent.status == "succeeded":
            payment.status = PaymentStatus.COMPLETED
            payment.completed_at = datetime.utcnow()
            payment.transaction_id = str(uuid.uuid4())
            
            # Update order status
            order = db.query(Order).filter(Order.id == payment.order_id).first()
            if order:
                order.status = OrderStatus.CONFIRMED
                order.confirmed_at = datetime.utcnow()
            
            # Get card details if available
            if intent.payment_method:
                pm = stripe.PaymentMethod.retrieve(intent.payment_method)
                if pm.card:
                    payment.card_last_four = pm.card.last4
                    payment.card_brand = pm.card.brand
            
            db.commit()
            db.refresh(payment)
            
            return payment
        else:
            payment.status = PaymentStatus.FAILED
            payment.error_message = f"Payment status: {intent.status}"
            db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment was not successful"
            )
            
    except stripe.error.StripeError as e:
        payment.status = PaymentStatus.FAILED
        payment.error_message = str(e)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/cod", response_model=PaymentResponse)
async def process_cod_payment(
    payment_data: CODPaymentConfirm,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process Cash on Delivery payment"""
    order = db.query(Order).filter(
        Order.id == payment_data.order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not in pending status"
        )
    
    # Check if payment already exists
    existing_payment = db.query(Payment).filter(Payment.order_id == order.id).first()
    if existing_payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment already exists for this order"
        )
    
    # Create COD payment record
    payment = Payment(
        order_id=order.id,
        payment_method=PaymentMethod.COD,
        amount=order.total_amount,
        status=PaymentStatus.PENDING,  # Will be completed on delivery
        transaction_id=f"COD-{uuid.uuid4().hex[:8].upper()}"
    )
    db.add(payment)
    
    # Confirm order
    order.status = OrderStatus.CONFIRMED
    order.confirmed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(payment)
    
    return payment


@router.get("/order/{order_id}", response_model=PaymentResponse)
async def get_payment_status(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment status for an order"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    payment = db.query(Payment).filter(Payment.order_id == order.id).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    return payment


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        
        payment = db.query(Payment).filter(
            Payment.gateway_payment_id == payment_intent["id"]
        ).first()
        
        if payment and payment.status != PaymentStatus.COMPLETED:
            payment.status = PaymentStatus.COMPLETED
            payment.completed_at = datetime.utcnow()
            
            order = db.query(Order).filter(Order.id == payment.order_id).first()
            if order:
                order.status = OrderStatus.CONFIRMED
                order.confirmed_at = datetime.utcnow()
            
            db.commit()
    
    elif event["type"] == "payment_intent.payment_failed":
        payment_intent = event["data"]["object"]
        
        payment = db.query(Payment).filter(
            Payment.gateway_payment_id == payment_intent["id"]
        ).first()
        
        if payment:
            payment.status = PaymentStatus.FAILED
            payment.error_message = payment_intent.get("last_payment_error", {}).get("message")
            db.commit()
    
    return {"status": "success"}
