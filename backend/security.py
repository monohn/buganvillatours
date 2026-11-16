import time
import re
import random
import string
from datetime import datetime, timedelta
from functools import wraps
from collections import defaultdict
from flask import request, jsonify, g
import jwt
from backend.config import Config

_ip_request_timestamps = defaultdict(list)

def rate_limit(max_requests=60, window_seconds=60):
    """Simple in-memory rate limiting decorator per client IP."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1").split(",")[0].strip()
            now = time.time()
            cutoff = now - window_seconds
            
            _ip_request_timestamps[ip] = [ts for ts in _ip_request_timestamps[ip] if ts > cutoff]
            
            if len(_ip_request_timestamps[ip]) >= max_requests:
                return jsonify({
                    "success": False,
                    "error": "Límite de solicitudes excedido. Por favor espere un momento antes de reintentar."
                }), 429
                
            _ip_request_timestamps[ip].append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator


def generate_verification_code() -> str:
    """Generates a secure 6-digit numeric verification code."""
    return "".join(random.choices(string.digits, k=6))


def create_access_token(user_id: int, email: str, name: str, role: str = "cliente") -> str:
    """Generate a signed JWT token valid for Config.JWT_EXPIRATION_HOURS."""
    exp = datetime.utcnow() + timedelta(hours=Config.JWT_EXPIRATION_HOURS)
    payload = {
        "sub": str(user_id),
        "user_id": user_id,
        "email": email,
        "name": name,
        "role": role,
        "iat": datetime.utcnow(),
        "exp": exp
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    """Decode and verify JWT signature and expiration."""
    try:
        return jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({
                "success": False,
                "error": "Acceso no autorizado. Debe iniciar sesión."
            }), 401

        token = auth_header.split(" ")[1].strip()
        payload = decode_access_token(token)
        if not payload:
            return jsonify({
                "success": False,
                "error": "Sesión inválida o expirada. Por favor inicie sesión nuevamente."
            }), 401

        g.current_user = payload
        return f(*args, **kwargs)
    return decorated


def token_optional(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        g.current_user = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1].strip()
            payload = decode_access_token(token)
            if payload:
                g.current_user = payload
        return f(*args, **kwargs)
    return decorated


def validate_email(email: str) -> bool:
    if not email:
        return False
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return bool(re.match(pattern, email.strip()))
