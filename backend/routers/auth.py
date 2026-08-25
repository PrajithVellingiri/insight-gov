from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import get_current_user
from models.user import User
from repositories.user_repo import UserRepository
from schemas.auth import CitizenRegisterRequest, LoginRequest, TokenResponse, UserOut, PreferencesUpdate
from services.auth_service import AuthService

router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new citizen account",
)
def register(
    data: CitizenRegisterRequest, db: Session = Depends(get_db)
) -> TokenResponse:
    """
    Public registration endpoint — creates citizen accounts only.

    Officers are created exclusively through the admin panel
    (POST /admin/officers).
    """
    repo = UserRepository(db)

    if repo.get_by_email(data.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        name=data.name,
        email=data.email,
        hashed_password=AuthService.hash_password(data.password),
        role="citizen",
        department_id=None,  # Citizens never belong to a department
    )
    user = repo.create(user)

    token = AuthService.create_access_token(str(user.id), user.role)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive a JWT",
)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    repo = UserRepository(db)
    user = repo.get_by_email(data.email)

    if not user or not AuthService.verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = AuthService.create_access_token(str(user.id), user.role)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get the current user's profile",
)
def get_me(current_user: User = Depends(get_current_user)) -> UserOut:
    """
    Returns the authenticated user's profile.
    Called by the frontend AuthContext on initial load to validate a stored JWT
    and restore the user session without requiring re-login.
    """
    return UserOut.model_validate(current_user)

@router.patch(
    "/preferences",
    response_model=UserOut,
    summary="Update user preferences",
)
def update_preferences(
    data: PreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserOut:
    # Update current user preferences
    prefs = dict(current_user.preferences)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        prefs[key] = value
        
    current_user.preferences = prefs
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)
