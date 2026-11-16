import os
from pathlib import Path
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS

from backend.config import Config
from backend.models import db, User
from backend.services.tour_service import TourService

# Blueprints
from backend.routes.auth_routes import auth_bp
from backend.routes.tour_routes import tour_bp
from backend.routes.booking_routes import booking_bp
from backend.routes.payment_routes import payment_bp
from backend.routes.contact_routes import contact_bp
from backend.routes.info_routes import info_bp

ROOT_DIR = Path(__file__).resolve().parent.parent

def create_app():
    app = Flask(
        __name__, 
        static_folder=str(ROOT_DIR), 
        static_url_path=""
    )
    app.config.from_object(Config)

    # Enable CORS for frontend integration
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize Database
    db.init_app(app)

    # Register API Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(tour_bp)
    app.register_blueprint(booking_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(contact_bp)
    app.register_blueprint(info_bp)

    # Health check
    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "online",
            "service": "Buganvilla Tours API",
            "version": "1.0.0",
            "currency": "PEN (S/.)",
            "company": Config.COMPANY_NAME
        }), 200

    # Serve Frontend SPA
    @app.route("/", methods=["GET"])
    def serve_index():
        return send_from_directory(str(ROOT_DIR), "index.html")

    @app.errorhandler(404)
    def handle_404(e):
        from flask import request
        if request.path.startswith("/api/"):
            return jsonify({"success": False, "error": "Endpoint de API no encontrado."}), 404
        return send_from_directory(str(ROOT_DIR), "index.html")

    @app.errorhandler(500)
    def handle_500(e):
        return jsonify({"success": False, "error": "Error interno del servidor."}), 500

    # Setup database tables and seed data
    with app.app_context():
        db.create_all()
        TourService.seed_tours()
        
        # Seed demo client user if not exists
        if not User.query.filter_by(email="diego@ejemplo.com").first():
            demo_user = User(
                name="Diego Mucha",
                email="diego@ejemplo.com",
                phone="+51 956 789 012",
                document_type="DNI",
                document_number="74829103",
                role="cliente",
                is_active=True
            )
            demo_user.set_password("diego123")
            db.session.add(demo_user)
            db.session.commit()

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Servidor Buganvilla Tours corriendo en http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
