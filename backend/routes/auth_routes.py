from flask import Blueprint, request, jsonify, g
from backend.services.auth_service import AuthService
from backend.security import token_required, rate_limit

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
@rate_limit(max_requests=20, window_seconds=60)
def register():
    data = request.get_json() or {}
    try:
        res = AuthService.register(
            name=data.get("name", ""),
            email=data.get("email", ""),
            password=data.get("password", ""),
            phone=data.get("phone", ""),
            document_number=data.get("document_number", "")
        )
        return jsonify({
            "success": True,
            "message": "Usuario registrado exitosamente. Se ha enviado un código de verificación.",
            "data": res
        }), 201
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": "Error interno al procesar el registro."}), 500


@auth_bp.route("/verify-code", methods=["POST"])
@rate_limit(max_requests=20, window_seconds=60)
def verify_code():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    code = data.get("code", "").strip()

    if not email or not code:
        return jsonify({"success": False, "error": "Debe proporcionar correo y código de verificación."}), 400

    try:
        res = AuthService.verify_code(email, code)
        return jsonify({
            "success": True,
            "message": res["message"],
            "data": res
        }), 200
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception:
        return jsonify({"success": False, "error": "Error al verificar el código."}), 500


@auth_bp.route("/resend-code", methods=["POST"])
@rate_limit(max_requests=10, window_seconds=60)
def resend_code():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    if not email:
        return jsonify({"success": False, "error": "Debe proporcionar su correo electrónico."}), 400

    try:
        res = AuthService.resend_code(email)
        return jsonify(res), 200
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception:
        return jsonify({"success": False, "error": "Error al reenviar el código."}), 500


@auth_bp.route("/login", methods=["POST"])
@rate_limit(max_requests=25, window_seconds=60)
def login():
    data = request.get_json() or {}
    try:
        res = AuthService.login(
            email=data.get("email", ""),
            password=data.get("password", "")
        )
        return jsonify({
            "success": True,
            "message": "Inicio de sesión exitoso.",
            "data": res
        }), 200
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 401
    except Exception as e:
        return jsonify({"success": False, "error": "Error interno al procesar el inicio de sesión."}), 500


@auth_bp.route("/profile", methods=["GET"])
@token_required
def get_profile():
    try:
        user_id = int(g.current_user.get("user_id") or g.current_user["sub"])
        profile = AuthService.get_profile(user_id)
        return jsonify({"success": True, "data": profile}), 200
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 404
    except Exception:
        return jsonify({"success": False, "error": "Error al recuperar perfil."}), 500


@auth_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile():
    data = request.get_json() or {}
    try:
        user_id = int(g.current_user.get("user_id") or g.current_user["sub"])
        updated = AuthService.update_profile(user_id, data)
        return jsonify({
            "success": True,
            "message": "Perfil actualizado correctamente.",
            "data": updated
        }), 200
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception:
        return jsonify({"success": False, "error": "Error al actualizar perfil."}), 500
