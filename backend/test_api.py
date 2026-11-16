import unittest
import uuid
from datetime import date, timedelta
from backend.app import create_app
from backend.models import db, User, Booking, Payment, TourPackage

class BuganvillaBackendTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_01_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "online")
        self.assertEqual(data["currency"], "PEN (S/.)")

    def test_02_get_tours_and_currencies(self):
        # Soles
        res = self.client.get("/api/tours")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["count"], 8)
        self.assertEqual(data["currency"], "PEN")

        # USD
        res_usd = self.client.get("/api/tours?currency=USD")
        self.assertEqual(res_usd.status_code, 200)
        data_usd = res_usd.get_json()
        self.assertEqual(data_usd["currency"], "USD")
        self.assertIn("$", data_usd["data"][0]["price_formatted"])

        # Currency rates endpoint
        res_rates = self.client.get("/api/info/currency/rates")
        self.assertEqual(res_rates.status_code, 200)
        data_rates = res_rates.get_json()
        self.assertIn("USD", data_rates["rates"])
        self.assertIn("EUR", data_rates["rates"])

    def test_03_auth_register_verification_code_and_login(self):
        email = f"test_{uuid.uuid4().hex[:8]}@viajero.pe"
        # Register
        reg_res = self.client.post("/api/auth/register", json={
            "name": "Viajero Ica Test",
            "email": email,
            "password": "password123",
            "phone": "+51 956 111 222",
            "document_number": "48592019"
        })
        self.assertEqual(reg_res.status_code, 201)
        reg_data = reg_res.get_json()
        self.assertTrue(reg_data["success"])
        v_code = reg_data["data"]["verification_code"]
        self.assertTrue(bool(v_code))
        self.assertEqual(len(v_code), 6)

        # Verify Code
        ver_res = self.client.post("/api/auth/verify-code", json={
            "email": email,
            "code": v_code
        })
        self.assertEqual(ver_res.status_code, 200)
        ver_data = ver_res.get_json()
        self.assertTrue(ver_data["data"]["user"]["is_verified"])
        token = ver_data["data"]["token"]

        # Profile check with JWT
        prof_res = self.client.get("/api/auth/profile", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(prof_res.status_code, 200)
        prof_data = prof_res.get_json()
        self.assertEqual(prof_data["data"]["name"], "Viajero Ica Test")

    def test_04_create_booking_multi_currency_and_pay_paypal(self):
        # Create booking in USD for 2 travelers
        future_date = (date.today() + timedelta(days=5)).strftime("%Y-%m-%d")
        b_res = self.client.post("/api/bookings", json={
            "package_id": 1,
            "booking_date": future_date,
            "travelers": 2,
            "currency": "USD",
            "titular_name": "John Smith",
            "titular_doc": "USA-998811",
            "titular_phone": "+1 415 555 2671",
            "titular_email": "johnsmith@gmail.com",
            "hotel_pickup": "Hotel Las Dunas, Ica",
            "notes": "Arriving from Lima by luxury bus"
        })
        self.assertEqual(b_res.status_code, 201)
        b_data = b_res.get_json()["data"]
        ref_code = b_data["reference_code"]
        self.assertEqual(b_data["currency"], "USD")
        self.assertIn("$", b_data["total_formatted"])

        # Pay with PayPal
        pay_res = self.client.post("/api/payments/process", json={
            "reference_code": ref_code,
            "method": "paypal",
            "order_id": "PAYPAL-ORD-TEST-99"
        })
        self.assertEqual(pay_res.status_code, 200)
        voucher = pay_res.get_json()["voucher"]
        self.assertEqual(voucher["status"], "confirmada")
        self.assertEqual(voucher["payment_details"]["method"], "PAYPAL")
        self.assertEqual(voucher["booking_details"]["currency"], "USD")

    def test_05_create_booking_and_pay_yape(self):
        future_date = (date.today() + timedelta(days=3)).strftime("%Y-%m-%d")
        b_res = self.client.post("/api/bookings", json={
            "package_id": 2,
            "booking_date": future_date,
            "travelers": 1,
            "currency": "PEN",
            "titular_name": "Carla Quispe",
            "titular_doc": "71829103",
            "titular_phone": "+51 956 789 012",
            "titular_email": "carla@gmail.com"
        })
        self.assertEqual(b_res.status_code, 201)
        b_data = b_res.get_json()["data"]
        ref_code = b_data["reference_code"]

        # Pay with Yape
        pay_res = self.client.post("/api/payments/process", json={
            "reference_code": ref_code,
            "method": "yape",
            "approval_code": "918273"
        })
        self.assertEqual(pay_res.status_code, 200)
        voucher = pay_res.get_json()["voucher"]
        self.assertEqual(voucher["payment_details"]["approval_code"], "918273")
        self.assertEqual(voucher["status"], "confirmada")

    def test_06_contact_submission_and_whatsapp(self):
        res = self.client.post("/api/contact", json={
            "name": "Maria Elena",
            "email": "maria@gmail.com",
            "phone": "+51 988 777 666",
            "tour_interest": "Sobrevuelo Líneas de Nasca",
            "message": "Hola, ¿tienen disponibilidad para 2 personas este fin de semana?"
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("whatsapp_direct_url", data)
        self.assertIn("51956623396", data["whatsapp_direct_url"])

if __name__ == "__main__":
    unittest.main()
