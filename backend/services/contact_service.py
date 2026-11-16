import urllib.parse
from backend.models import db, ContactMessage
from backend.config import Config
from backend.security import validate_email

class ContactService:
    @staticmethod
    def save_message(name: str, email: str, message: str, phone: str = "", tour_interest: str = "") -> dict:
        if not name or len(name.strip()) < 2:
            raise ValueError("El nombre es obligatorio.")

        email = email.strip().lower()
        if not validate_email(email):
            raise ValueError("El correo electrónico no tiene un formato válido.")

        if not message or len(message.strip()) < 5:
            raise ValueError("El mensaje debe contener al menos 5 caracteres.")

        msg_record = ContactMessage(
            name=name.strip(),
            email=email,
            phone=phone.strip() if phone else "",
            tour_interest=tour_interest.strip() if tour_interest else "",
            message=message.strip(),
            status="nuevo"
        )
        db.session.add(msg_record)
        db.session.commit()

        # WhatsApp link directly to Buganvilla Tours support
        wa_text = (
            f"Hola Buganvilla Tours,\n"
            f"Mi nombre es *{name.strip()}*.\n"
            f"Deseo consultar sobre: *{tour_interest or 'Tours en Ica/Paracas'}*.\n\n"
            f"*Mensaje:* {message.strip()}\n"
            f"*Correo:* {email}\n"
            f"*Teléfono:* {phone or 'No especificado'}\n\n"
            f"Quedo atento a su respuesta. Muchas gracias."
        )
        encoded_wa = urllib.parse.quote(wa_text)
        whatsapp_url = f"https://wa.me/{Config.WHATSAPP_NUMBER}?text={encoded_wa}"

        return {
            "success": True,
            "message": "Mensaje recibido correctamente. Nos pondremos en contacto contigo a la brevedad.",
            "contact_id": msg_record.id,
            "whatsapp_direct_url": whatsapp_url
        }

    @staticmethod
    def get_whatsapp_support_url(custom_message: str = "") -> str:
        base_msg = custom_message or "Hola Buganvilla Tours, deseo recibir asesoría para mi viaje a Ica y Paracas."
        encoded = urllib.parse.quote(base_msg)
        return f"https://wa.me/{Config.WHATSAPP_NUMBER}?text={encoded}"
