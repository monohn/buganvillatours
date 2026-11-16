import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "buganvilla-tours-secret-key-ica-2026-safe")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-buganvilla-peru-auth-secret-key-9988")
    JWT_EXPIRATION_HOURS = int(os.environ.get("JWT_EXPIRATION_HOURS", 48))
    
    # SQLite Database location
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", 
        f"sqlite:///{BASE_DIR / 'buganvilla.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Company Official Information
    COMPANY_NAME = "Buganvilla Tours E.I.R.L."
    COMPANY_RUC = "20534892019"
    COMPANY_ADDRESS = "Calle Camino Real D15, Residencial La Angostura, Ica, Perú"
    COMPANY_CITY = "Ica, Perú"
    COMPANY_EMAIL = "reservas@buganvillatours.com.pe"
    COMPANY_DIRCETUR = "DIRCETUR Ica Licencia Oficial Nº 042"
    
    # Telephony & WhatsApp
    WHATSAPP_NUMBER = "51956623396"
    WHATSAPP_DISPLAY = "+51 956 623 396"
    SECONDARY_WHATSAPP = "+51 948 401 267"
    LANDLINE_PHONE = "(056) 256581"
    
    # Payment details
    YAPE_NUMBER = "956 789 012"
    YAPE_HOLDER = "Buganvilla Tours E.I.R.L."
    BCP_ACCOUNT_SOLES = "215-98421039-0-28"
    BCP_CCI = "002-215-0098421039028-14"
    CURRENCY = "PEN"
    CURRENCY_SYMBOL = "S/."
    
    # CORS
    CORS_ORIGINS = ["*"]
