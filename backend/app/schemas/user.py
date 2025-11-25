from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole, AuthProvider


# Base User Schema
class UserBase(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


# Create User (Signup)
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


# Social Login
class SocialLogin(BaseModel):
    provider: AuthProvider
    token: str


class GoogleAuthData(BaseModel):
    access_token: str


# User Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Phone OTP Request
class PhoneOTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)


class PhoneOTPVerify(BaseModel):
    phone: str
    otp: str = Field(..., min_length=6, max_length=6)


# Update Profile
class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


# Response Schema
class UserResponse(BaseModel):
    id: int
    email: str
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_picture: Optional[str] = None
    auth_provider: AuthProvider
    is_active: bool
    is_verified: bool
    role: UserRole
    created_at: datetime
    
    class Config:
        from_attributes = True


# Token Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    token_type: Optional[str] = None
