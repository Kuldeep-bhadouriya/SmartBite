from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PaymentMethod(str, enum.Enum):
    CARD = "card"
    UPI = "upi"
    WALLET = "wallet"
    NETBANKING = "netbanking"
    COD = "cod"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Payment Details
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    
    # Gateway Details
    gateway = Column(String(50), nullable=True)  # stripe, razorpay
    gateway_payment_id = Column(String(255), nullable=True)
    gateway_order_id = Column(String(255), nullable=True)
    gateway_signature = Column(String(500), nullable=True)
    
    # Transaction Details
    transaction_id = Column(String(255), unique=True, nullable=True)
    
    # Card Details (last 4 digits only)
    card_last_four = Column(String(4), nullable=True)
    card_brand = Column(String(50), nullable=True)
    
    # UPI Details
    upi_id = Column(String(255), nullable=True)
    
    # Refund
    refund_amount = Column(Float, default=0.0)
    refund_reason = Column(Text, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    
    # Metadata (renamed to avoid SQLAlchemy reserved word)
    payment_metadata = Column(Text, nullable=True)  # JSON string for additional info
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    order = relationship("Order", back_populates="payment")
