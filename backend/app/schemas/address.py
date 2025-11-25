from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.address import AddressType


class AddressBase(BaseModel):
    address_type: AddressType = AddressType.HOME
    label: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    landmark: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "India"
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    delivery_instructions: Optional[str] = None


class AddressCreate(AddressBase):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: bool = False


class AddressUpdate(BaseModel):
    address_type: Optional[AddressType] = None
    label: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    landmark: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    delivery_instructions: Optional[str] = None
    is_default: Optional[bool] = None


class AddressResponse(AddressBase):
    id: int
    user_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: bool
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class SetDefaultAddress(BaseModel):
    address_id: int
