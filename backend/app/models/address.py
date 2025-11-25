from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class AddressType(str, enum.Enum):
    HOME = "home"
    WORK = "work"
    OFFICE = "office"
    HOSTEL = "hostel"
    OTHER = "other"


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Address Details
    address_type = Column(SQLEnum(AddressType), default=AddressType.HOME)
    label = Column(String(100), nullable=True)  # Custom label
    
    # Full Address
    address_line1 = Column(String(500), nullable=False)
    address_line2 = Column(String(500), nullable=True)
    landmark = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    country = Column(String(100), default="India")
    
    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Contact for this address
    contact_name = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    
    # Delivery Instructions
    delivery_instructions = Column(String(500), nullable=True)
    
    # Status
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="addresses")
    orders = relationship("Order", back_populates="delivery_address")
    
    @property
    def full_address(self):
        parts = [self.address_line1]
        if self.address_line2:
            parts.append(self.address_line2)
        if self.landmark:
            parts.append(f"Near {self.landmark}")
        parts.extend([self.city, self.state, self.postal_code])
        return ", ".join(parts)
