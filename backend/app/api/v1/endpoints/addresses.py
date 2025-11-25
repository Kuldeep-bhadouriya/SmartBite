from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate, AddressResponse, SetDefaultAddress
from app.schemas.common import MessageResponse

router = APIRouter()


@router.get("", response_model=List[AddressResponse])
async def list_addresses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all addresses for current user"""
    addresses = db.query(Address).filter(
        Address.user_id == current_user.id,
        Address.is_active == True
    ).order_by(Address.is_default.desc(), Address.created_at.desc()).all()
    
    return addresses


@router.post("", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
async def create_address(
    address_data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new address"""
    # If this is the first address or marked as default, make it default
    existing_count = db.query(Address).filter(
        Address.user_id == current_user.id,
        Address.is_active == True
    ).count()
    
    is_default = address_data.is_default or existing_count == 0
    
    # If setting as default, unset other defaults
    if is_default:
        db.query(Address).filter(
            Address.user_id == current_user.id
        ).update({"is_default": False})
    
    address = Address(
        user_id=current_user.id,
        **address_data.model_dump()
    )
    address.is_default = is_default
    
    db.add(address)
    db.commit()
    db.refresh(address)
    
    return address


@router.get("/{address_id}", response_model=AddressResponse)
async def get_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific address"""
    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id,
        Address.is_active == True
    ).first()
    
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
    
    return address


@router.put("/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: int,
    address_data: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an address"""
    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id,
        Address.is_active == True
    ).first()
    
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
    
    # Handle default setting
    if address_data.is_default:
        db.query(Address).filter(
            Address.user_id == current_user.id,
            Address.id != address_id
        ).update({"is_default": False})
    
    # Update fields
    update_data = address_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(address, field, value)
    
    db.commit()
    db.refresh(address)
    
    return address


@router.delete("/{address_id}", response_model=MessageResponse)
async def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an address (soft delete)"""
    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id,
        Address.is_active == True
    ).first()
    
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
    
    address.is_active = False
    
    # If this was default, set another as default
    if address.is_default:
        other_address = db.query(Address).filter(
            Address.user_id == current_user.id,
            Address.id != address_id,
            Address.is_active == True
        ).first()
        
        if other_address:
            other_address.is_default = True
    
    db.commit()
    
    return MessageResponse(message="Address deleted successfully")


@router.post("/set-default", response_model=AddressResponse)
async def set_default_address(
    data: SetDefaultAddress,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set an address as default"""
    address = db.query(Address).filter(
        Address.id == data.address_id,
        Address.user_id == current_user.id,
        Address.is_active == True
    ).first()
    
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
    
    # Unset all other defaults
    db.query(Address).filter(
        Address.user_id == current_user.id
    ).update({"is_default": False})
    
    address.is_default = True
    db.commit()
    db.refresh(address)
    
    return address


@router.get("/default", response_model=AddressResponse)
async def get_default_address(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get default address"""
    address = db.query(Address).filter(
        Address.user_id == current_user.id,
        Address.is_default == True,
        Address.is_active == True
    ).first()
    
    if not address:
        # Return first active address
        address = db.query(Address).filter(
            Address.user_id == current_user.id,
            Address.is_active == True
        ).first()
    
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No address found"
        )
    
    return address
