from flask import Blueprint, request, jsonify
from backend.services.payment_service import PaymentService
from backend.models import Booking, Payment
from backend.security import rate_limit

payment_bp = Blueprint("payments", __name__, url_prefix="/api/payments")

@payment_bp.route("/process", methods=["POST"])
@rate_limit(max_requests=20, window_seconds=60)
def process_payment():
    data = request.get_json() or {}
    ref_code = data.get("reference_code", "").strip()
    method = data.get("method", "").strip().lower()

    if not ref_code:
        return jsonify({"success": False, "error": "Debe especificar el código de reserva (reference_code)."}), 400
    if not method:
        return jsonify({"success": False, "error": "Debe seleccionar un método de pago ('yape', 'tarjeta', 'transferencia')."}), 400

    try:
        voucher_result = PaymentService.process_payment(
            reference_code=ref_code,
            method=method,
            payment_data=data
        )
        return jsonify(voucher_result), 200
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": "Error interno al procesar el pago."}), 500


@payment_bp.route("/voucher/<string:reference_code>", methods=["GET"])
def get_voucher(reference_code):
    booking = Booking.query.filter_by(reference_code=reference_code.strip()).first()
    if not booking:
        return jsonify({"success": False, "error": "Reserva no encontrada."}), 404

    payment = Payment.query.filter_by(booking_id=booking.id, status="completado").first()
    if not payment:
        # Create a pending payment representation if not completed
        payment = Payment(
            booking_id=booking.id,
            method="pendiente",
            amount=booking.total_amount,
            currency="PEN",
            approval_code="EN ESPERA",
            transaction_code="PENDIENTE",
            status="pendiente"
        )

    res = PaymentService.generate_voucher_response(booking, payment)
    return jsonify(res), 200
