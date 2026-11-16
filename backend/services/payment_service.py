import json
import random
import string
import re
from datetime import datetime
from backend.models import db, Booking, Payment
from backend.config import Config
from backend.services.booking_service import BookingService
from backend.services.currency_service import CurrencyService

class PaymentService:
    @staticmethod
    def process_payment(
        reference_code: str,
        method: str,
        payment_data: dict = None
    ) -> dict:
        payment_data = payment_data or {}
        booking = Booking.query.filter_by(reference_code=reference_code.strip()).first()
        if not booking:
            raise ValueError(f"No se encontró la reserva con código {reference_code}.")

        if booking.status == "confirmada":
            existing_payment = Payment.query.filter_by(booking_id=booking.id, status="completado").first()
            if existing_payment:
                return PaymentService.generate_voucher_response(booking, existing_payment)

        method = method.strip().lower()
        valid_methods = ["yape", "plin", "tarjeta", "paypal", "transferencia", "transferencia_bcp"]
        if method not in valid_methods:
            raise ValueError(f"Método de pago no reconocido. Métodos válidos: {', '.join(valid_methods)}.")

        currency = booking.currency or "PEN"
        amount = float(booking.total_currency if booking.total_currency else booking.total_amount)
        
        card_last4 = None
        approval_code = None
        transaction_code = None
        gateway_meta = {}

        # 1. YAPE (BCP)
        if method == "yape":
            token = str(payment_data.get("approval_code") or payment_data.get("token") or "").strip()
            if not token or len(token) < 4:
                raise ValueError("Debe ingresar el código de aprobación de Yape (4 a 6 dígitos).")
            if not re.match(r"^\d+$", token):
                raise ValueError("El código de aprobación de Yape debe contener únicamente números.")

            approval_code = token
            transaction_code = f"YAPE-{token.zfill(6)}-{random.randint(1000, 9999)}"
            gateway_meta = {
                "gateway": "Yape BCP Instant API Simulator",
                "phone_holder": Config.YAPE_HOLDER,
                "yape_number": Config.YAPE_NUMBER,
                "verification_status": "APPROVED",
                "currency": currency,
                "timestamp": datetime.utcnow().isoformat()
            }

        # 2. PLIN (Interbank, BBVA, Scotiabank)
        elif method == "plin":
            token = str(payment_data.get("approval_code") or payment_data.get("token") or "").strip()
            if not token or len(token) < 4:
                raise ValueError("Debe ingresar el código de confirmación de Plin.")

            approval_code = token
            transaction_code = f"PLIN-{token.zfill(6)}-{random.randint(1000, 9999)}"
            gateway_meta = {
                "gateway": "Plin Perú Simulator",
                "phone_number": Config.WHATSAPP_DISPLAY,
                "status": "APPROVED",
                "currency": currency,
                "timestamp": datetime.utcnow().isoformat()
            }

        # 3. TARJETA CRÉDITO / DÉBITO (Visa, Mastercard, Amex)
        elif method == "tarjeta":
            card_number = re.sub(r"[\s\-]", "", str(payment_data.get("card_number", "")))
            if not card_number or len(card_number) < 13:
                card_last4 = "4557"
            else:
                card_last4 = card_number[-4:]

            approval_code = "".join(random.choices(string.digits, k=6))
            transaction_code = f"TX-CARD-{random.randint(100000, 999999)}"
            gateway_meta = {
                "gateway": "Niubiz / Izipay Gateway Simulator",
                "brand": "VISA / Mastercard / Amex",
                "card_last4": card_last4,
                "authorization_code": approval_code,
                "secure_3d": True,
                "currency": currency,
                "timestamp": datetime.utcnow().isoformat()
            }

        # 4. PAYPAL (Global / USD / EUR)
        elif method == "paypal":
            paypal_order = str(payment_data.get("order_id") or "").strip()
            approval_code = "".join(random.choices(string.ascii_uppercase + string.digits, k=10))
            transaction_code = f"PAYPAL-{approval_code}"
            gateway_meta = {
                "gateway": "PayPal Commerce Platform Simulator",
                "order_id": paypal_order or f"ORD-{random.randint(100000, 999999)}",
                "payer_email": booking.titular_email,
                "status": "COMPLETED",
                "currency": currency,
                "timestamp": datetime.utcnow().isoformat()
            }

        # 5. TRANSFERENCIA BANCARIA BCP
        elif method in ["transferencia", "transferencia_bcp"]:
            approval_code = f"BCP-{random.randint(1000000, 9999999)}"
            transaction_code = f"OP-{random.randint(100000, 999999)}"
            gateway_meta = {
                "gateway": "BCP Telecrédito Automático",
                "destination_account": Config.BCP_ACCOUNT_SOLES,
                "cci": Config.BCP_CCI,
                "status": "APPROVED",
                "currency": currency,
                "timestamp": datetime.utcnow().isoformat()
            }

        payment = Payment(
            booking_id=booking.id,
            method=method,
            amount=amount,
            currency=currency,
            transaction_code=transaction_code,
            approval_code=approval_code,
            card_last4=card_last4,
            status="completado",
            gateway_response=json.dumps(gateway_meta)
        )
        db.session.add(payment)

        booking.status = "confirmada"
        db.session.commit()

        return PaymentService.generate_voucher_response(booking, payment)

    @staticmethod
    def generate_voucher_response(booking: Booking, payment: Payment) -> dict:
        pkg = booking.package
        whatsapp_url = BookingService.generate_whatsapp_url(booking.reference_code)
        sym = CurrencyService.get_symbol(booking.currency)
        total_val = booking.total_currency if booking.total_currency else booking.total_amount

        return {
            "success": True,
            "message": "¡Pago verificado y reserva confirmada exitosamente!",
            "voucher": {
                "reference_code": booking.reference_code,
                "status": booking.status,
                "issue_date": datetime.utcnow().strftime("%d/%m/%Y %H:%M"),
                "tour": {
                    "id": pkg.id if pkg else None,
                    "name": pkg.name if pkg else "Tour Buganvilla",
                    "category": pkg.category if pkg else "aventura",
                    "duration": pkg.duration if pkg else "Full Day"
                },
                "traveler": {
                    "titular_name": booking.titular_name,
                    "titular_doc": booking.titular_doc,
                    "titular_phone": booking.titular_phone,
                    "titular_email": booking.titular_email,
                    "hotel_pickup": booking.hotel_pickup or "A coordinar con el operador"
                },
                "booking_details": {
                    "tour_date": booking.booking_date.strftime("%d/%m/%Y"),
                    "travelers": booking.travelers,
                    "unit_price": f"S/. {booking.unit_price:.2f}",
                    "total_amount": f"{sym} {total_val:.2f}",
                    "currency": booking.currency
                },
                "payment_details": {
                    "method": payment.method.upper(),
                    "amount_paid": f"{sym} {payment.amount:.2f}",
                    "currency": payment.currency,
                    "approval_code": payment.approval_code,
                    "transaction_code": payment.transaction_code,
                    "card_last4": payment.card_last4
                },
                "company": {
                    "name": Config.COMPANY_NAME,
                    "ruc": Config.COMPANY_RUC,
                    "address": Config.COMPANY_ADDRESS,
                    "license": Config.COMPANY_DIRCETUR,
                    "phones": [Config.WHATSAPP_DISPLAY, Config.SECONDARY_WHATSAPP, Config.LANDLINE_PHONE],
                    "email": Config.COMPANY_EMAIL,
                    "whatsapp_url": whatsapp_url
                }
            }
        }
