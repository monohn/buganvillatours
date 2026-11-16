from flask import Blueprint, request, jsonify
from backend.services.tour_service import TourService

tour_bp = Blueprint("tours", __name__, url_prefix="/api/tours")

@tour_bp.route("", methods=["GET"])
def list_tours():
    category = request.args.get("category")
    search = request.args.get("search")
    currency = request.args.get("currency", "PEN")
    tours = TourService.get_all_tours(category=category, search=search, currency=currency)
    return jsonify({
        "success": True,
        "count": len(tours),
        "currency": currency.upper(),
        "data": tours
    }), 200

@tour_bp.route("/<int:tour_id>", methods=["GET"])
def get_tour(tour_id):
    currency = request.args.get("currency", "PEN")
    tour = TourService.get_tour_by_id(tour_id, currency=currency)
    if not tour:
        return jsonify({"success": False, "error": "Tour no encontrado."}), 404
    return jsonify({"success": True, "data": tour}), 200

@tour_bp.route("/slug/<string:slug>", methods=["GET"])
def get_tour_by_slug(slug):
    currency = request.args.get("currency", "PEN")
    tour = TourService.get_tour_by_slug(slug, currency=currency)
    if not tour:
        return jsonify({"success": False, "error": "Tour no encontrado."}), 404
    return jsonify({"success": True, "data": tour}), 200

@tour_bp.route("/destinations", methods=["GET"])
def list_destinations():
    destinations = [
        {
            "id": "huacachina",
            "name": "Oasis de Huacachina",
            "tag": "Ica · Desierto & Dunas",
            "description": "El único oasis natural de América entre dunas doradas, perfecto para paseos en tubulares y sandboarding.",
            "image_url": "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&q=80"
        },
        {
            "id": "paracas",
            "name": "Islas Ballestas & Paracas",
            "tag": "Pisco · Océano Pacífico",
            "description": "Navegación en deslizadores para avistar lobos marinos, pingüinos de Humboldt y aves guaneras.",
            "image_url": "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=800&q=80"
        },
        {
            "id": "cachiche",
            "name": "Brujas de Cachiche",
            "tag": "Ica · Misticismo y Tradición",
            "description": "Tierra de brujas, la enigmática Palmera de las 7 Cabezas y secretos tradicionales de la campiña.",
            "image_url": "https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?w=800&q=80"
        },
        {
            "id": "nasca",
            "name": "Líneas de Nasca",
            "tag": "Nasca · Arqueología Milenaria",
            "description": "Sobrevuelos en avionetas Cessna para admirar el Colibrí, el Mono y la Araña desde el cielo.",
            "image_url": "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80"
        },
        {
            "id": "playas-paracas",
            "name": "Playa Roja & La Mina",
            "tag": "Reserva Nacional de Paracas",
            "description": "Aguas turquesas y contrastes únicos de arena roja donde el desierto se funde con el Pacífico.",
            "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80"
        },
        {
            "id": "canon-perdidos",
            "name": "Cañón de los Perdidos",
            "tag": "Ocucaje · Expedición Fósil 4x4",
            "description": "Aventura todoterreno hacia profundas grietas paleontológicas milenarias en el corazón de Ocucaje.",
            "image_url": "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80"
        }
    ]
    return jsonify({"success": True, "data": destinations}), 200
