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
            "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Oasis_de_Huacachina%2C_Ica%2C_Per%C3%BA%2C_2015-07-29%2C_DD_23.JPG/960px-Oasis_de_Huacachina%2C_Ica%2C_Per%C3%BA%2C_2015-07-29%2C_DD_23.JPG"
        },
        {
            "id": "paracas",
            "name": "Islas Ballestas & Paracas",
            "tag": "Pisco · Océano Pacífico",
            "description": "Navegación en deslizadores para avistar lobos marinos, pingüinos de Humboldt y aves guaneras.",
            "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Islas_Ballestas_2.JPG/960px-Islas_Ballestas_2.JPG"
        },
        {
            "id": "cachiche",
            "name": "Brujas de Cachiche",
            "tag": "Ica · Misticismo y Tradición",
            "description": "Tierra de brujas, la enigmática Palmera de las 7 Cabezas y secretos tradicionales de la campiña.",
            "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/PALMERA_DE_SIETE_CABEZAS.jpg/960px-PALMERA_DE_SIETE_CABEZAS.jpg"
        },
        {
            "id": "nasca",
            "name": "Líneas de Nasca",
            "tag": "Nasca · Arqueología Milenaria",
            "description": "Sobrevuelos en avionetas Cessna para admirar el Colibrí, el Mono y la Araña desde el cielo.",
            "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/Nazca_Lines_Hummingbird_%28cropped%29.jpg/960px-Nazca_Lines_Hummingbird_%28cropped%29.jpg"
        },
        {
            "id": "playas-paracas",
            "name": "Playa Roja & La Mina",
            "tag": "Reserva Nacional de Paracas",
            "description": "Aguas turquesas y contrastes únicos de arena roja donde el desierto se funde con el Pacífico.",
            "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/Playa_Roja_-_Paracas_National_Reserve%2C_Ica.jpg/960px-Playa_Roja_-_Paracas_National_Reserve%2C_Ica.jpg"
        },
        {
            "id": "canon-perdidos",
            "name": "Cañón de los Perdidos",
            "tag": "Ocucaje · Expedición Fósil 4x4",
            "description": "Aventura todoterreno hacia profundas grietas paleontológicas milenarias en el corazón de Ocucaje.",
            "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Ca%C3%B1%C3%B3n_de_los_Perdidos.jpg/960px-Ca%C3%B1%C3%B3n_de_los_Perdidos.jpg"
        }
    ]
    return jsonify({"success": True, "data": destinations}), 200
