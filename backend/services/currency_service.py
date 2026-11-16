class CurrencyService:
    # Base is PEN (Soles peruanos)
    EXCHANGE_RATES = {
        "PEN": 1.0,
        "USD": 0.2667,   # 1 PEN = 0.2667 USD (approx 3.75 PEN per USD)
        "EUR": 0.2469    # 1 PEN = 0.2469 EUR (approx 4.05 PEN per EUR)
    }

    CURRENCY_SYMBOLS = {
        "PEN": "S/.",
        "USD": "$",
        "EUR": "€"
    }

    CURRENCY_NAMES = {
        "PEN": "Soles Peruanos",
        "USD": "Dólares Americanos",
        "EUR": "Euros"
    }

    @classmethod
    def get_supported_currencies(cls):
        return [
            {
                "code": "PEN",
                "name": cls.CURRENCY_NAMES["PEN"],
                "symbol": cls.CURRENCY_SYMBOLS["PEN"],
                "rate": cls.EXCHANGE_RATES["PEN"],
                "is_base": True
            },
            {
                "code": "USD",
                "name": cls.CURRENCY_NAMES["USD"],
                "symbol": cls.CURRENCY_SYMBOLS["USD"],
                "rate": cls.EXCHANGE_RATES["USD"],
                "is_base": False
            },
            {
                "code": "EUR",
                "name": cls.CURRENCY_NAMES["EUR"],
                "symbol": cls.CURRENCY_SYMBOLS["EUR"],
                "rate": cls.EXCHANGE_RATES["EUR"],
                "is_base": False
            }
        ]

    @classmethod
    def convert_from_pen(cls, amount_pen: float, target_currency: str = "PEN") -> dict:
        cur = (target_currency or "PEN").upper().strip()
        if cur not in cls.EXCHANGE_RATES:
            cur = "PEN"

        rate = cls.EXCHANGE_RATES[cur]
        converted = round(float(amount_pen) * rate, 2)
        sym = cls.CURRENCY_SYMBOLS[cur]

        return {
            "amount": converted,
            "currency": cur,
            "rate": rate,
            "symbol": sym,
            "formatted": f"{sym} {converted:.2f}"
        }

    @classmethod
    def get_symbol(cls, currency: str = "PEN") -> str:
        return cls.CURRENCY_SYMBOLS.get((currency or "PEN").upper().strip(), "S/.")
