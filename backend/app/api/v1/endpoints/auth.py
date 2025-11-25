from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime
import httpx

from app.db.session import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash,
    decode_token
)
from app.core.config import settings
from app.models.user import User, AuthProvider
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserLogin,
    Token,
    TokenRefresh,
    GoogleAuthData,
    PhoneOTPRequest,
    PhoneOTPVerify
)

router = APIRouter()


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user with email and password"""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if phone already exists
    if user_data.phone:
        existing_phone = db.query(User).filter(User.phone == user_data.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
    
    # Create user
    user = User(
        email=user_data.email,
        phone=user_data.phone,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        hashed_password=get_password_hash(user_data.password),
        auth_provider=AuthProvider.EMAIL
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login with email and password"""
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id)
    )


@router.post("/login/email", response_model=Token)
async def login_with_email(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password (JSON body)"""
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id)
    )


@router.post("/google", response_model=Token)
async def google_auth(auth_data: GoogleAuthData, db: Session = Depends(get_db)):
    """Authenticate with Google OAuth"""
    try:
        # Verify Google token
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {auth_data.access_token}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google token"
                )
            
            google_user = response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to verify Google token"
        )
    
    email = google_user.get("email")
    google_id = google_user.get("sub")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by Google"
        )
    
    # Check if user exists
    user = db.query(User).filter(
        (User.email == email) | (User.google_id == google_id)
    ).first()
    
    if user:
        # Update Google ID if not set
        if not user.google_id:
            user.google_id = google_id
        user.last_login = datetime.utcnow()
        db.commit()
    else:
        # Create new user
        user = User(
            email=email,
            first_name=google_user.get("given_name"),
            last_name=google_user.get("family_name"),
            profile_picture=google_user.get("picture"),
            google_id=google_id,
            auth_provider=AuthProvider.GOOGLE,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id)
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    payload = decode_token(token_data.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id)
    )


@router.post("/phone/send-otp")
async def send_phone_otp(data: PhoneOTPRequest, db: Session = Depends(get_db)):
    """Send OTP to phone number for verification"""
    import random
    from datetime import timedelta
    
    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    expiry = datetime.utcnow() + timedelta(minutes=10)
    
    # Find or create user by phone
    user = db.query(User).filter(User.phone == data.phone).first()
    
    if user:
        user.phone_otp = otp
        user.phone_otp_expiry = expiry
    else:
        # For new users, we'll just return OTP for now
        # In production, send via SMS service (Twilio, MSG91)
        pass
    
    db.commit()
    
    # In development, return OTP directly
    # In production, send via SMS and remove this
    return {
        "message": "OTP sent successfully",
        "otp": otp  # Remove in production
    }


@router.post("/phone/verify", response_model=Token)
async def verify_phone_otp(data: PhoneOTPVerify, db: Session = Depends(get_db)):
    """Verify phone OTP and login/register"""
    user = db.query(User).filter(User.phone == data.phone).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number not found"
        )
    
    if not user.phone_otp or user.phone_otp != data.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )
    
    if user.phone_otp_expiry and user.phone_otp_expiry < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired"
        )
    
    # Clear OTP
    user.phone_otp = None
    user.phone_otp_expiry = None
    user.is_verified = True
    user.last_login = datetime.utcnow()
    db.commit()
    
    return Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id)
    )
