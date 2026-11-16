from flask import Blueprint, request, jsonify
from backend.services.contact_service import ContactService
from backend.security import rate_limit

contact_bp = Blueprint("contact", __name__, url_prefix="/api/contact")

@contact_bp.route("", methods=["POST"])
@rate_limit(max_requests=15, window_seconds=60)
def send_contact():
    data = request.get_json() or {}
    try:
        res = ContactService.save_message(
            name=data.get("name", ""),
            email=data.get("email", ""),
            message=data.get("message", ""),
            phone=data.get("phone", ""),
            tour_interest=data.get("tour_interest", "")
        )
        return jsonify(res), 201
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception:
        return jsonify({"success": False, "error": "Error interno al enviar el mensaje de contacto."}), 500


@contact_bp.route("/whatsapp-link", methods=["GET"])
def get_whatsapp_support():
    custom_msg = request.args.get("message", "")
    url = ContactService.get_whatsapp_support_url(custom_msg)
    return jsonify({
        "success": True,
        "whatsapp_url": url
    }), 200
