from fastapi import APIRouter, Depends, HTTPException, status
from ..schemas import LoginRequest, TokenResponse
from ..auth import verify_admin_credentials, create_access_token, get_current_admin, JWT_EXPIRE_HOURS

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    if not verify_admin_credentials(payload.username, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )
    token = create_access_token({"sub": payload.username})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        username=payload.username,
        is_admin=True,
        expires_in=JWT_EXPIRE_HOURS * 3600,
    )


@router.get("/me")
def me(current_admin: dict = Depends(get_current_admin)):
    return {"authenticated": True, "username": current_admin["username"]}
