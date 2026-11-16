from flask import Blueprint, request, jsonify, g
from backend.services.booking_service import BookingService
from backend.security import token_optional, rate_limit

booking_bp = Blueprint("bookings", __name__, url_prefix="/api/bookings")

@booking_bp.route("", methods=["POST"])
@rate_limit(max_requests=30, window_seconds=60)
@token_optional
def create_booking():
    data = request.get_json() or {}
    user_id = int(g.current_user.get("user_id") or g.current_user["sub"]) if g.current_user else None

    try:
        booking = BookingService.create_booking(
            package_id=data.get("package_id"),
            booking_date_str=data.get("booking_date", ""),
            travelers=data.get("travelers", 1),
            titular_name=data.get("titular_name", ""),
            titular_doc=data.get("titular_doc", ""),
            titular_phone=data.get("titular_phone", ""),
            titular_email=data.get("titular_email", ""),
            hotel_pickup=data.get("hotel_pickup", ""),
            notes=data.get("notes", ""),
            user_id=user_id,
            currency=data.get("currency", "PEN")
        )
        return jsonify({
            "success": True,
            "message": "Reserva creada exitosamente. Proceda con el pago para su confirmación.",
            "data": booking
        }), 201
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": "Error interno al procesar la reserva."}), 500


@booking_bp.route("/<string:reference_code>", methods=["GET"])
def get_booking(reference_code):
    booking = BookingService.get_booking_by_reference(reference_code)
    if not booking:
        return jsonify({"success": False, "error": "Reserva no encontrada."}), 404
    return jsonify({"success": True, "data": booking}), 200


@booking_bp.route("/my-bookings", methods=["GET"])
@token_optional
def my_bookings():
    user_id = int(g.current_user.get("user_id") or g.current_user["sub"]) if g.current_user else None
    email = request.args.get("email")

    if not user_id and not email:
        return jsonify({
            "success": False,
            "error": "Debe iniciar sesión o especificar su correo para consultar sus reservas."
        }), 400

    bookings = BookingService.get_user_bookings(user_id=user_id, user_email=email)
    return jsonify({
        "success": True,
        "count": len(bookings),
        "data": bookings
    }), 200


@booking_bp.route("/<string:reference_code>/whatsapp", methods=["GET"])
def get_whatsapp_url(reference_code):
    url = BookingService.generate_whatsapp_url(reference_code)
    return jsonify({
        "success": True,
        "whatsapp_url": url
    }), 200
