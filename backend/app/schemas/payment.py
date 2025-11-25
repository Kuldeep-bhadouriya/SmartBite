from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.payment import PaymentStatus, PaymentMethod


class PaymentCreate(BaseModel):
    order_id: int
    payment_method: PaymentMethod
    amount: float


class PaymentIntentCreate(BaseModel):
    order_id: int
    payment_method: PaymentMethod


class PaymentIntentResponse(BaseModel):
    client_secret: Optional[str] = None
    payment_intent_id: Optional[str] = None
    order_id: Optional[str] = None  # For Razorpay
    amount: float
    currency: str = "INR"


class PaymentConfirm(BaseModel):
    payment_intent_id: Optional[str] = None
    gateway_payment_id: Optional[str] = None
    gateway_order_id: Optional[str] = None
    gateway_signature: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    payment_method: PaymentMethod
    status: PaymentStatus
    amount: float
    currency: str
    gateway: Optional[str] = None
    transaction_id: Optional[str] = None
    card_last_four: Optional[str] = None
    card_brand: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CODPaymentConfirm(BaseModel):
    order_id: int


class RefundRequest(BaseModel):
    order_id: int
    amount: Optional[float] = None  # Full refund if not specified
    reason: str
