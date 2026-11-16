from datetime import datetime, timedelta
from backend.models import db, User
from backend.security import create_access_token, validate_email, generate_verification_code

class AuthService:
    @staticmethod
    def register(name: str, email: str, password: str, phone: str = "", document_number: str = "") -> dict:
        if not name or len(name.strip()) < 2:
            raise ValueError("El nombre completo debe tener al menos 2 caracteres.")

        email = email.strip().lower()
        if not validate_email(email):
            raise ValueError("El formato del correo electrónico no es válido.")

        if not password or len(password) < 6:
            raise ValueError("La contraseña debe tener al menos 6 caracteres.")

        existing = User.query.filter_by(email=email).first()
        if existing:
            raise ValueError("Ya existe una cuenta registrada con este correo electrónico.")

        # Generate 6-digit email verification code
        code = generate_verification_code()
        expires_at = datetime.utcnow() + timedelta(minutes=15)

        user = User(
            name=name.strip(),
            email=email,
            phone=phone.strip() if phone else "",
            document_number=document_number.strip() if document_number else "",
            role="cliente",
            is_active=True,
            is_verified=False,
            verification_code=code,
            verification_code_expires_at=expires_at
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        # Simulated email dispatch
        print(f"📧 [EMAIL SIMULATOR] Código de verificación enviado a {email}: {code} (Válido por 15 min)")

        token = create_access_token(user.id, user.email, user.name, user.role)
        return {
            "user": user.to_dict(),
            "token": token,
            "verification_code": code,  # Provided for demo/testing convenience
            "requires_verification": True,
            "message": f"Hemos enviado un código de 6 dígitos a {email}."
        }

    @staticmethod
    def verify_code(email: str, code: str) -> dict:
        email = email.strip().lower()
        code = code.strip()

        user = User.query.filter_by(email=email).first()
        if not user:
            raise ValueError("Usuario no encontrado.")

        if user.is_verified:
            return {"user": user.to_dict(), "message": "Esta cuenta ya ha sido verificada previamente."}

        if not user.verification_code or user.verification_code != code:
            raise ValueError("El código de verificación ingresado es incorrecto.")

        if user.verification_code_expires_at and datetime.utcnow() > user.verification_code_expires_at:
            raise ValueError("El código de verificación ha expirado. Solicite uno nuevo.")

        user.is_verified = True
        user.verification_code = None
        user.verification_code_expires_at = None
        db.session.commit()

        token = create_access_token(user.id, user.email, user.name, user.role)
        return {
            "user": user.to_dict(),
            "token": token,
            "message": "¡Cuenta verificada exitosamente!"
        }

    @staticmethod
    def resend_code(email: str) -> dict:
        email = email.strip().lower()
        user = User.query.filter_by(email=email).first()
        if not user:
            raise ValueError("Usuario no encontrado.")

        code = generate_verification_code()
        user.verification_code = code
        user.verification_code_expires_at = datetime.utcnow() + timedelta(minutes=15)
        db.session.commit()

        print(f"📧 [EMAIL SIMULATOR] Nuevo código de verificación enviado a {email}: {code}")

        return {
            "success": True,
            "verification_code": code,
            "message": f"Se ha enviado un nuevo código de verificación a {email}."
        }

    @staticmethod
    def login(email: str, password: str) -> dict:
        email = email.strip().lower()
        if not email or not password:
            raise ValueError("Debe ingresar correo y contraseña.")

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            raise ValueError("Credenciales inválidas. Verifique su correo o contraseña.")

        if not user.is_active:
            raise ValueError("Esta cuenta se encuentra temporalmente desactivada.")

        token = create_access_token(user.id, user.email, user.name, user.role)
        return {
            "user": user.to_dict(),
            "token": token
        }

    @staticmethod
    def get_profile(user_id: int) -> dict:
        user = db.session.get(User, user_id)
        if not user:
            raise ValueError("Usuario no encontrado.")
        
        user_dict = user.to_dict()
        user_dict["total_bookings"] = len(user.bookings)
        return user_dict

    @staticmethod
    def update_profile(user_id: int, data: dict) -> dict:
        user = db.session.get(User, user_id)
        if not user:
            raise ValueError("Usuario no encontrado.")

        if "name" in data and data["name"].strip():
            user.name = data["name"].strip()
        if "phone" in data:
            user.phone = data["phone"].strip()
        if "document_number" in data:
            user.document_number = data["document_number"].strip()
        if "document_type" in data:
            user.document_type = data["document_type"].strip()

        db.session.commit()
        return user.to_dict()
