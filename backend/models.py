import json
import random
import string
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(30), nullable=True)
    document_type = db.Column(db.String(20), default="DNI")
    document_number = db.Column(db.String(30), nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default="cliente")
    is_active = db.Column(db.Boolean, default=True)
    
    # Email Verification Security
    is_verified = db.Column(db.Boolean, default=False)
    verification_code = db.Column(db.String(10), nullable=True)
    verification_code_expires_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    bookings = db.relationship("Booking", backref="user", lazy=True)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256")

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone or "",
            "document_type": self.document_type,
            "document_number": self.document_number or "",
            "role": self.role,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class TourPackage(db.Model):
    __tablename__ = "tour_packages"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(180), nullable=False)
    slug = db.Column(db.String(180), unique=True, nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False)  # aventura, naturaleza, cultura
    duration = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Float, nullable=False)  # Base price in Soles (PEN S/.)
    description = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(300), nullable=False)
    highlights = db.Column(db.Text, nullable=True)  # JSON string list
    includes = db.Column(db.Text, nullable=True)    # JSON string list
    itinerary = db.Column(db.Text, nullable=True)
    max_capacity = db.Column(db.Integer, default=20)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    bookings = db.relationship("Booking", backref="package", lazy=True)

    def to_dict(self, target_currency="PEN", rate=1.0, symbol="S/."):
        hl = []
        inc = []
        if self.highlights:
            try:
                hl = json.loads(self.highlights)
            except Exception:
                hl = [self.highlights]
        if self.includes:
            try:
                inc = json.loads(self.includes)
            except Exception:
                inc = [self.includes]

        converted_price = round(self.price * rate, 2)

        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "category": self.category,
            "duration": self.duration,
            "price_pen": self.price,
            "price": converted_price,
            "currency": target_currency,
            "currency_symbol": symbol,
            "price_formatted": f"{symbol} {converted_price:.2f}",
            "description": self.description,
            "image_url": self.image_url,
            "highlights": hl,
            "includes": inc,
            "itinerary": self.itinerary or "",
            "max_capacity": self.max_capacity,
            "is_active": self.is_active
        }


class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    reference_code = db.Column(db.String(30), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    package_id = db.Column(db.Integer, db.ForeignKey("tour_packages.id"), nullable=False)
    booking_date = db.Column(db.Date, nullable=False)
    travelers = db.Column(db.Integer, nullable=False, default=1)
    
    # Financials (Base PEN + Currency selected by customer)
    unit_price = db.Column(db.Float, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)
    tax_amount = db.Column(db.Float, default=0.0)
    total_amount = db.Column(db.Float, nullable=False)  # in PEN
    
    currency = db.Column(db.String(10), default="PEN")   # PEN, USD, EUR
    currency_rate = db.Column(db.Float, default=1.0)
    total_currency = db.Column(db.Float, nullable=True)  # in chosen currency
    
    # Passenger info
    titular_name = db.Column(db.String(120), nullable=False)
    titular_doc = db.Column(db.String(30), nullable=False)
    titular_phone = db.Column(db.String(30), nullable=False)
    titular_email = db.Column(db.String(120), nullable=False)
    hotel_pickup = db.Column(db.String(200), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    # Status: 'pendiente', 'confirmada', 'completada', 'cancelada'
    status = db.Column(db.String(30), default="pendiente", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    payments = db.relationship("Payment", backref="booking", lazy=True, cascade="all, delete-orphan")

    @classmethod
    def generate_reference(cls):
        rand_num = "".join(random.choices(string.digits, k=5))
        return f"BGN-{rand_num}"

    def to_dict(self):
        sym = "S/." if self.currency == "PEN" else ("$" if self.currency == "USD" else "€")
        final_amt = self.total_currency if self.total_currency else self.total_amount
        return {
            "id": self.id,
            "reference_code": self.reference_code,
            "user_id": self.user_id,
            "package_id": self.package_id,
            "package_name": self.package.name if self.package else "Tour Buganvilla",
            "package": self.package.to_dict() if self.package else None,
            "booking_date": self.booking_date.strftime("%Y-%m-%d") if self.booking_date else None,
            "travelers": self.travelers,
            "unit_price": self.unit_price,
            "subtotal": self.subtotal,
            "tax_amount": self.tax_amount,
            "total_amount_pen": self.total_amount,
            "currency": self.currency,
            "currency_rate": self.currency_rate,
            "total_amount": final_amt,
            "total_formatted": f"{sym} {final_amt:.2f}",
            "titular_name": self.titular_name,
            "titular_doc": self.titular_doc,
            "titular_phone": self.titular_phone,
            "titular_email": self.titular_email,
            "hotel_pickup": self.hotel_pickup or "",
            "notes": self.notes or "",
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "payments": [p.to_dict() for p in self.payments]
        }


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), nullable=False)
    method = db.Column(db.String(30), nullable=False)  # 'yape', 'plin', 'tarjeta', 'paypal', 'transferencia'
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default="PEN")
    transaction_code = db.Column(db.String(50), nullable=True)
    approval_code = db.Column(db.String(50), nullable=True)
    card_last4 = db.Column(db.String(4), nullable=True)
    status = db.Column(db.String(30), default="completado")  # 'completado', 'fallido', 'pendiente'
    gateway_response = db.Column(db.Text, nullable=True)     # JSON response
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        sym = "S/." if self.currency == "PEN" else ("$" if self.currency == "USD" else "€")
        return {
            "id": self.id,
            "booking_id": self.booking_id,
            "method": self.method,
            "amount": self.amount,
            "currency": self.currency,
            "amount_formatted": f"{sym} {self.amount:.2f}",
            "transaction_code": self.transaction_code,
            "approval_code": self.approval_code,
            "card_last4": self.card_last4,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class ContactMessage(db.Model):
    __tablename__ = "contact_messages"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    tour_interest = db.Column(db.String(150), nullable=True)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default="nuevo")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone or "",
            "tour_interest": self.tour_interest or "",
            "message": self.message,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
