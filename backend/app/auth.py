import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "rifas-dev-secret-change-in-production")
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "168"))
ALGORITHM = "HS256"

if not os.getenv("ADMIN_PASSWORD"):
    print("[SECURITY WARNING] ADMIN_PASSWORD no configurada. Usando valor de desarrollo (admin123). Configura esta variable en producción.")
if not os.getenv("JWT_SECRET_KEY"):
    print("[SECURITY WARNING] JWT_SECRET_KEY no configurada. Usando clave de desarrollo. Configura esta variable en producción.")

security = HTTPBearer()


def verify_admin_credentials(username: str, password: str) -> bool:
    username_ok = hmac.compare_digest(username.encode(), ADMIN_USERNAME.encode())
    password_ok = hmac.compare_digest(password.encode(), ADMIN_PASSWORD.encode())
    return username_ok and password_ok


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise exc
        return {"username": username}
    except jwt.PyJWTError:
        raise exc


# Alias for backward compat with any existing imports
get_current_user = get_current_admin
