import json
from backend.models import db, TourPackage
from backend.services.currency_service import CurrencyService

INITIAL_PACKAGES = [
    {
        "id": 1,
        "name": "Aventura en Huacachina: Tubulares & Sandboarding",
        "slug": "huacachina-tubulares-sandboarding",
        "category": "aventura",
        "duration": "Medio Día (2.5 hrs)",
        "price": 85.0,
        "description": "Adrenalina pura en carros tubulares por las dunas gigantes y práctica de sandboarding guiado al atardecer en el oasis de América.",
        "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9d/Dune_Buggy_at_Huacachina_%287136152157%29.jpg/960px-Dune_Buggy_at_Huacachina_%287136152157%29.jpg",
        "highlights": [
            "Tubulares con chofer certificado DIRCETUR",
            "Tablas profesionales para sandboarding (de pie o acostado)",
            "Parada panorámica para fotos del sunset en el desierto"
        ],
        "includes": [
            "Paseo en buggy tubular 4x4",
            "Tablas e instrucción de sandboarding",
            "Pago de tasa de embarque municipal",
            "Chofer y guía especializado"
        ],
        "itinerary": "Punto de encuentro en oficina Buganvilla Huacachina. Ascenso a las dunas maestras, 3 paradas de descenso en sandboarding, sesión de fotos al atardecer y retorno al oasis.",
        "max_capacity": 25
    },
    {
        "id": 2,
        "name": "Islas Ballestas & Reserva Nacional de Paracas",
        "slug": "islas-ballestas-reserva-paracas",
        "category": "naturaleza",
        "duration": "Full Day (8 hrs)",
        "price": 135.0,
        "description": "Excursión marina en deslizador a las islas para ver lobos de mar, pingüinos de Humboldt y el enigmático Candelabro, más playas vírgenes.",
        "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Islas_Ballestas_2.JPG/960px-Islas_Ballestas_2.JPG",
        "highlights": [
            "Deslizador moderno con chalecos salvavidas y motores ecológicos",
            "Avistamiento de lobos marinos, pingüinos y aves guaneras",
            "Recorrido terrestre por la Reserva Nacional de Paracas"
        ],
        "includes": [
            "Transporte turístico privado con aire acondicionado",
            "Embarcación turística a Islas Ballestas",
            "Tickets de ingreso SERNANP y DIRCETUR",
            "Guía oficial de turismo bilingüe"
        ],
        "itinerary": "07:30 AM salida desde Ica hacia El Chaco Paracas. 08:00 AM navegación marítima a Ballestas (2 hrs). Almuerzo marino libre. 01:30 PM circuito terrestre: Mirador Playa Roja, La Mina y retorno a Ica.",
        "max_capacity": 30
    },
    {
        "id": 3,
        "name": "Sobrevuelo Clásico a las Enigmáticas Líneas de Nasca",
        "slug": "sobrevuelo-lineas-nasca",
        "category": "cultura",
        "duration": "Full Day (10 hrs)",
        "price": 390.0,
        "description": "Vista aérea de los misteriosos geoglifos milenarios (El Colibrí, El Mono, El Astronauta, La Araña) en avionetas Cessna con ventana individual.",
        "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/Nazca_Lines_Hummingbird_%28cropped%29.jpg/960px-Nazca_Lines_Hummingbird_%28cropped%29.jpg",
        "highlights": [
            "Avionetas Cessna Grand Caravan con ventana individual para cada pasajero",
            "Pilotos bilingües altamente calificados",
            "Certificado oficial de sobrevuelo Buganvilla Tours"
        ],
        "includes": [
            "Traslado Ica - Aeródromo María Reiche (Nasca) - Ica",
            "Sobrevuelo de 35 minutos sobre 12 geoglifos",
            "Asistencia personalizada y briefing audiovisual previo",
            "Seguros aéreos de pasajeros"
        ],
        "itinerary": "Salida temprano desde Ica por la Panamericana Sur. Llegada al aeródromo de Nasca, control de pesaje y tasas. Sobrevuelo de 35 minutos. Visita al Mirador de Nasca y Casa Museo María Reiche.",
        "max_capacity": 15
    },
    {
        "id": 4,
        "name": "Glamping Exclusivo en Dunas de Huacachina",
        "slug": "glamping-dunas-huacachina",
        "category": "aventura",
        "duration": "2 Días / 1 Noche",
        "price": 580.0,
        "description": "Campamento de lujo bajo el cielo estrellado del desierto iqueño con domo privado, fogata, cena parrillera gourmet y maridaje de pisco.",
        "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/View_from_Honeymoon_Desert_Tent_..._%2850950160223%29.jpg/960px-View_from_Honeymoon_Desert_Tent_..._%2850950160223%29.jpg",
        "highlights": [
            "Domo privado de lujo con cama confortable, alfombras y luces cálidas",
            "Cena parrillera con maridaje de vino y pisco iqueño",
            "Desayuno buffet al amanecer en medio de las dunas vírgenes"
        ],
        "includes": [
            "Paseo en tubulares privado al campamento",
            "Noche en domo glamping acondicionado",
            "Cena completa + botella de vino iqueño",
            "Fogata y música acústica bajo las estrellas",
            "Desayuno continental"
        ],
        "itinerary": "Día 1: 04:30 PM partida en buggy hacia el desierto profundo. Puesta de sol, acomodación en domo, fogata y cena. Día 2: 06:30 AM amanecer en el desierto, desayuno y retorno al oasis.",
        "max_capacity": 12
    },
    {
        "id": 5,
        "name": "Ruta del Pisco & Bodegas Tradicionales Iqueñas",
        "slug": "ruta-del-pisco-bodegas",
        "category": "cultura",
        "duration": "1 Día (5 hrs)",
        "price": 110.0,
        "description": "Recorrido vitivinícola tradicional en el Valle de Ica con cata guiada de piscos de uvas quebranta, italia, acholado y visita a falcas coloniales.",
        "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Bodega_El_Catador_%287521862384%29.jpg/960px-Bodega_El_Catador_%287521862384%29.jpg",
        "highlights": [
            "Degustación guiada de piscos y vinos premiados internacionalmente",
            "Historia de la destilación tradicional en Ica y falcas de cobre",
            "Visita a bodegas artesanales y bodega industrial moderna"
        ],
        "includes": [
            "Transporte turístico privado",
            "Visita a 3 bodegas (El Catador, Tacama y Vista Alegre)",
            "Degustación de más de 8 variedades de vinos y piscos",
            "Sommelier / Guía especialista en enoturismo"
        ],
        "itinerary": "Recojo en hotel a las 10:30 AM. Visita a bodega centenaria artesanal con explicación del proceso de pisa y destilación. Cata guiada. Almuerzo campestre criollo (libre). Retorno 03:30 PM.",
        "max_capacity": 20
    },
    {
        "id": 6,
        "name": "Expedición 4x4 al Cañón de los Perdidos",
        "slug": "expedicion-canon-de-los-perdidos",
        "category": "naturaleza",
        "duration": "Full Day (8 hrs)",
        "price": 190.0,
        "description": "Aventura todoterreno hacia el cañón milenario en el desierto de Ocucaje. Paisajes paleontológicos únicos, fósiles marinos y grietas gigantescas.",
        "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Ca%C3%B1%C3%B3n_de_los_Perdidos.jpg/960px-Ca%C3%B1%C3%B3n_de_los_Perdidos.jpg",
        "highlights": [
            "Camionetas 4x4 acondicionadas y equipadas para desierto profundo",
            "Trekking moderado por el fondo del cañón y lagunas de agua salobre",
            "Guía paleontológico certificado"
        ],
        "includes": [
            "Transporte 4x4 desde Ica con chofer experto",
            "Guía de expedición y primeros auxilios",
            "Box lunch energético (sándwich, fruta, frutos secos, agua)",
            "Ticket de ingreso comunal a Ocucaje"
        ],
        "itinerary": "06:30 AM salida hacia el sur de Ica. Ingreso por la pampa fósil de Ocucaje. Llegada al Mirador del Cañón. Descenso a pie de 1.5 hrs por las gargantas naturales. Fotos y regreso 02:30 PM.",
        "max_capacity": 16
    },
    {
        "id": 7,
        "name": "Místico Cachiche: Brujas, Palmera de 7 Cabezas & Luren",
        "slug": "mistico-cachiche-brujas-luren",
        "category": "cultura",
        "duration": "Medio Día (3.5 hrs)",
        "price": 75.0,
        "description": "Visita al legendario pueblo de las Brujas de Cachiche, la enigmática Palmera de las 7 Cabezas, el Santuario del Señor de Luren y dulcerías de tejas.",
        "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/ESTATUA_DE_LA_BRUJA_DE_CACHICHE.jpg/960px-ESTATUA_DE_LA_BRUJA_DE_CACHICHE.jpg",
        "highlights": [
            "Monumento a la famosa Bruja Julia Hernández Pecho",
            "Leyenda y visita a la enigmática Palmera de las 7 Cabezas",
            "Degustación de tejas y chocotejas iqueñas tradicionales"
        ],
        "includes": [
            "Movilidad turística con A/C",
            "Guía local conocedor de mitos y tradiciones iqueñas",
            "Degustación de dulces típicos iqueños",
            "Entrada al bosque de Cachiche"
        ],
        "itinerary": "Inicio en Plaza de Armas de Ica. Traslado a Cachiche, recorrido por el parque de las brujas y la pirámide de energía. Parada en la Palmera de 7 Cabezas. Visita al Santuario del Señor de Luren.",
        "max_capacity": 25
    },
    {
        "id": 8,
        "name": "Playas Secretas de Paracas: La Mina & Playa Roja",
        "slug": "playas-secretas-paracas-la-mina",
        "category": "naturaleza",
        "duration": "Full Day (7 hrs)",
        "price": 120.0,
        "description": "Recorrido costero por las bahías más hermosas de la Reserva Nacional de Paracas con tiempo libre para baño en aguas cristalinas y fotografía.",
        "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/Playa_Roja_-_Paracas_National_Reserve%2C_Ica.jpg/960px-Playa_Roja_-_Paracas_National_Reserve%2C_Ica.jpg",
        "highlights": [
            "Tiempo libre para disfrutar y bañarse en Playa La Mina y Raspón",
            "Mirador panorámico de la inusual Playa Roja y acantilados de roca",
            "Transporte turístico con aire acondicionado y tickets de ingreso"
        ],
        "includes": [
            "Traslado ida y vuelta desde Ica o Paracas",
            "Boleto de ingreso oficial SERNANP a la Reserva",
            "Guía turístico orientador",
            "Tiempo libre de 3 horas para playa y descanso"
        ],
        "itinerary": "09:00 AM salida hacia la Península de Paracas. Visita a la formación rocosa La Catedral, Mirador de Playa Roja, llegada a Playa La Mina para disfrute de playa. Retorno 04:30 PM.",
        "max_capacity": 20
    }
]

class TourService:
    @staticmethod
    def get_all_tours(category: str = None, search: str = None, currency: str = "PEN"):
        query = TourPackage.query.filter_by(is_active=True)
        if category and category.lower() != "all":
            query = query.filter_by(category=category.lower())
        if search:
            query = query.filter(TourPackage.name.ilike(f"%{search}%"))

        rate = CurrencyService.EXCHANGE_RATES.get(currency.upper(), 1.0)
        symbol = CurrencyService.CURRENCY_SYMBOLS.get(currency.upper(), "S/.")

        return [pkg.to_dict(target_currency=currency.upper(), rate=rate, symbol=symbol) for pkg in query.all()]

    @staticmethod
    def get_tour_by_id(tour_id: int, currency: str = "PEN"):
        pkg = TourPackage.query.filter_by(id=tour_id, is_active=True).first()
        if not pkg:
            return None
        rate = CurrencyService.EXCHANGE_RATES.get(currency.upper(), 1.0)
        symbol = CurrencyService.CURRENCY_SYMBOLS.get(currency.upper(), "S/.")
        return pkg.to_dict(target_currency=currency.upper(), rate=rate, symbol=symbol)

    @staticmethod
    def get_tour_by_slug(slug: str, currency: str = "PEN"):
        pkg = TourPackage.query.filter_by(slug=slug, is_active=True).first()
        if not pkg:
            return None
        rate = CurrencyService.EXCHANGE_RATES.get(currency.upper(), 1.0)
        symbol = CurrencyService.CURRENCY_SYMBOLS.get(currency.upper(), "S/.")
        return pkg.to_dict(target_currency=currency.upper(), rate=rate, symbol=symbol)

    @staticmethod
    def seed_tours():
        if TourPackage.query.count() == 0:
            for item in INITIAL_PACKAGES:
                pkg = TourPackage(
                    id=item["id"],
                    name=item["name"],
                    slug=item["slug"],
                    category=item["category"],
                    duration=item["duration"],
                    price=item["price"],
                    description=item["description"],
                    image_url=item["image_url"],
                    highlights=json.dumps(item["highlights"], ensure_ascii=False),
                    includes=json.dumps(item["includes"], ensure_ascii=False),
                    itinerary=item["itinerary"],
                    max_capacity=item["max_capacity"],
                    is_active=True
                )
                db.session.add(pkg)
            db.session.commit()
