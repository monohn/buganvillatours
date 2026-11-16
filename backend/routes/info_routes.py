from flask import Blueprint, jsonify
from backend.config import Config
from backend.services.currency_service import CurrencyService

info_bp = Blueprint("info", __name__, url_prefix="/api/info")

@info_bp.route("", methods=["GET"])
def get_company_info():
    return jsonify({
        "success": True,
        "company": {
            "name": Config.COMPANY_NAME,
            "ruc": Config.COMPANY_RUC,
            "license": Config.COMPANY_DIRCETUR,
            "address": Config.COMPANY_ADDRESS,
            "city": Config.COMPANY_CITY,
            "email": Config.COMPANY_EMAIL,
            "phones": {
                "landline": Config.LANDLINE_PHONE,
                "whatsapp_main": Config.WHATSAPP_DISPLAY,
                "whatsapp_secondary": Config.SECONDARY_WHATSAPP,
                "whatsapp_raw": Config.WHATSAPP_NUMBER
            },
            "currencies": CurrencyService.get_supported_currencies(),
            "payment_accounts": {
                "currency_base": Config.CURRENCY,
                "yape": {
                    "number": Config.YAPE_NUMBER,
                    "holder": Config.YAPE_HOLDER
                },
                "plin": {
                    "number": Config.WHATSAPP_DISPLAY,
                    "holder": Config.COMPANY_NAME
                },
                "bcp": {
                    "account_soles": Config.BCP_ACCOUNT_SOLES,
                    "cci_soles": Config.BCP_CCI,
                    "account_usd": "215-98421040-1-30",
                    "holder": Config.COMPANY_NAME
                },
                "paypal": {
                    "recipient": "pagos@buganvillatours.com.pe",
                    "accepted_currencies": ["USD", "EUR"]
                }
            },
            "institutional": {
                "mision": "Somos una empresa que brinda un servicio personalizado, innovador y especializado, que hacemos realidad los sueños de nuestros clientes, generando una experiencia única, siendo responsables con nuestro entorno natural. Ser líderes en atención y satisfacción de nuestros clientes, aportando valor a la Región y extendiendo nuestros servicios a nivel nacional e internacional.",
                "vision": "Consolidarnos como el tour operador líder y referente indiscutible de turismo receptivo y de aventura en Ica, Paracas, Nasca y Chincha; reconocidos por la excelencia, seguridad y calidez humana de nuestras experiencias, promoviendo el turismo sostenible y el desarrollo económico y cultural de nuestra región.",
                "founding_year": 2001,
                "experience_years": 25
            }
        }
    }), 200

@info_bp.route("/currency/rates", methods=["GET"])
@info_bp.route("/currencies", methods=["GET"])
def get_currency_rates():
    return jsonify({
        "success": True,
        "base": "PEN",
        "currencies": CurrencyService.get_supported_currencies(),
        "rates": CurrencyService.EXCHANGE_RATES,
        "symbols": CurrencyService.CURRENCY_SYMBOLS
    }), 200
