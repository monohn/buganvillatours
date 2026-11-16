import urllib.parse
from datetime import datetime, date
from backend.models import db, Booking, TourPackage, User
from backend.services.currency_service import CurrencyService
from backend.config import Config

class BookingService:
    @staticmethod
    def create_booking(
        package_id: int,
        booking_date_str: str,
        travelers: int,
        titular_name: str,
        titular_doc: str,
        titular_phone: str,
        titular_email: str,
        hotel_pickup: str = "",
        notes: str = "",
        user_id: int = None,
        currency: str = "PEN"
    ) -> dict:
        package = TourPackage.query.filter_by(id=package_id, is_active=True).first()
        if not package:
            raise ValueError("El paquete turístico seleccionado no existe o no está disponible.")

        try:
            b_date = datetime.strptime(booking_date_str.strip(), "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Formato de fecha inválido. Debe ser AAAA-MM-DD.")

        if b_date < date.today():
            raise ValueError("La fecha de reserva no puede ser anterior a hoy.")

        if not travelers or int(travelers) < 1:
            raise ValueError("Debe reservar para al menos 1 viajero.")
            
        travelers = int(travelers)
        if travelers > package.max_capacity:
            raise ValueError(f"La capacidad máxima para este tour es de {package.max_capacity} personas.")

        if not titular_name.strip():
            raise ValueError("El nombre completo del titular es obligatorio.")
        if not titular_doc.strip():
            raise ValueError("El documento de identidad (DNI o Pasaporte) es obligatorio.")
        if not titular_phone.strip():
            raise ValueError("El número de teléfono o WhatsApp es obligatorio.")
        if not titular_email.strip():
            raise ValueError("El correo electrónico para el envío del voucher es obligatorio.")

        if not user_id:
            user = User.query.filter_by(email=titular_email.strip().lower()).first()
            if user:
                user_id = user.id

        currency = (currency or "PEN").upper().strip()
        rate = CurrencyService.EXCHANGE_RATES.get(currency, 1.0)
        
        unit_price_pen = float(package.price)
        subtotal_pen = round(unit_price_pen * travelers, 2)
        total_pen = subtotal_pen
        
        # Converted currency
        total_conv = round(total_pen * rate, 2)

        while True:
            ref_code = Booking.generate_reference()
            if not Booking.query.filter_by(reference_code=ref_code).first():
                break

        booking = Booking(
            reference_code=ref_code,
            user_id=user_id,
            package_id=package.id,
            booking_date=b_date,
            travelers=travelers,
            unit_price=unit_price_pen,
            subtotal=subtotal_pen,
            tax_amount=0.0,
            total_amount=total_pen,
            currency=currency,
            currency_rate=rate,
            total_currency=total_conv,
            titular_name=titular_name.strip(),
            titular_doc=titular_doc.strip(),
            titular_phone=titular_phone.strip(),
            titular_email=titular_email.strip().lower(),
            hotel_pickup=hotel_pickup.strip() if hotel_pickup else None,
            notes=notes.strip() if notes else None,
            status="pendiente"
        )

        db.session.add(booking)
        db.session.commit()

        return booking.to_dict()

    @staticmethod
    def get_booking_by_reference(reference_code: str) -> dict:
        booking = Booking.query.filter_by(reference_code=reference_code.strip()).first()
        if not booking:
            return None
        return booking.to_dict()

    @staticmethod
    def get_user_bookings(user_id: int = None, user_email: str = None) -> list:
        query = Booking.query
        if user_id:
            query = query.filter_by(user_id=user_id)
        elif user_email:
            query = query.filter_by(titular_email=user_email.strip().lower())
        else:
            return []

        bookings = query.order_by(Booking.created_at.desc()).all()
        return [b.to_dict() for b in bookings]

    @staticmethod
    def generate_whatsapp_url(reference_code: str) -> str:
        booking = Booking.query.filter_by(reference_code=reference_code.strip()).first()
        if not booking:
            msg = f"¡Hola Buganvilla Tours! Deseo consultar sobre mis reservas turísticas en Ica."
        else:
            pkg_name = booking.package.name if booking.package else "Tour Buganvilla"
            b_date = booking.booking_date.strftime("%d/%m/%Y")
            sym = CurrencyService.get_symbol(booking.currency)
            amt = booking.total_currency if booking.total_currency else booking.total_amount
            msg = (
                f"Hola Buganvilla Tours,\n"
                f"He realizado una reserva directa en su página web:\n\n"
                f"*Código de Reserva:* {booking.reference_code}\n"
                f"*Tour:* {pkg_name}\n"
                f"*Fecha:* {b_date}\n"
                f"*Pasajeros:* {booking.travelers} persona(s)\n"
                f"*Titular:* {booking.titular_name} (Doc: {booking.titular_doc})\n"
                f"*Total:* {sym} {amt:.2f} {booking.currency}\n"
                f"*Estado:* {booking.status.upper()}\n\n"
                f"Por favor confirmar los detalles del servicio y horario de recojo. Muchas gracias."
            )

        encoded_msg = urllib.parse.quote(msg)
        return f"https://wa.me/{Config.WHATSAPP_NUMBER}?text={encoded_msg}"
