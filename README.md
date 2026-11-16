# 🌴 Buganvilla Tours E.I.R.L. - Sistema de Reservas y Pagos en Línea

Plataforma oficial de reservas directas y pasarela de pago para la agencia de viajes y tour operador **Buganvilla Tours E.I.R.L.** (Ica, Paracas, Nasca, Chincha - DIRCETUR Licencia Oficial Nº 042-2018-GR-ICA - RUC 20534892019).

---

## 🏛️ 1. Arquitectura por Capas Completa (Backend & Frontend Modular)

El proyecto cuenta con una separación estricta y profesional de responsabilidades:

```
Buganvilla-Tours/
├── index.html                  # Punto de entrada raíz (Frontend SPA responsivo)
├── requirements.txt            # Dependencias del servidor Flask y seguridad
├── run_server.sh               # Script ejecutable de inicio en un clic
├── venv/                       # Entorno virtual de Python
├── frontend/                   # Capa de Presentación Modular
│   ├── index.html              # Vista cliente SPA
│   ├── css/
│   │   ├── variables.css       # Tokens de diseño, paleta morada, tipografía y sombras
│   │   ├── styles.css          # Componentes visuales, hero, wizard, cards y modales
│   │   └── responsive.css      # Reglas responsivas (desktop, laptop, tablet y móvil)
│   └── js/
│       ├── config.js           # Constantes globales, URLs de CDN de Ica y datos de empresa
│       ├── currency.js         # Motor multimoneda reactivo (Soles PEN, Dólares USD, Euros EUR)
│       ├── auth.js             # Gestión de sesión JWT y verificación OTP de 6 dígitos
│       ├── booking.js          # Wizard de reserva en 5 pasos y pasarela de pago
│       └── app.js              # Controlador principal, router hash, catálogo y dashboard
└── backend/                    # Capa de Backend y Lógica de Negocio (Python / Flask)
    ├── app.py                  # Factory, Blueprints, CORS y despacho de frontend
    ├── config.py               # Configuración empresarial, JWT, DIRCETUR y WhatsApp
    ├── models.py               # Modelos ORM (User, TourPackage, Booking, Payment, ContactMessage)
    ├── security.py             # Hash criptográfico, JWT HS256, generador OTP y rate limiting
    ├── test_api.py             # Suite automatizada de pruebas unitarias (100% pasando)
    ├── buganvilla.db           # Base de datos persistente SQLite
    ├── services/               # Lógica de Negocio por Servicios
    │   ├── auth_service.py     # Registro, validación OTP de 6 dígitos y login JWT
    │   ├── currency_service.py # Tasas de cambio en vivo y formateadores PEN/USD/EUR
    │   ├── tour_service.py     # Catálogo con imágenes reales de Ica y cálculo multimoneda
    │   ├── booking_service.py  # Generador de códigos BGN-XXXXX y cálculo de reservas
    │   ├── payment_service.py  # Pasarela para Yape, Plin, Tarjeta, PayPal y Transferencia BCP
    │   └── contact_service.py  # Registro de mensajes y enlaces directos a WhatsApp
    └── routes/                 # Controladores REST API
        ├── auth_routes.py      # /api/auth (register, verify-code, resend-code, login, profile)
        ├── tour_routes.py      # /api/tours, /api/tours/<id>, /api/tours/destinations
        ├── booking_routes.py   # /api/bookings, /api/bookings/<ref>, /api/bookings/my-bookings
        ├── payment_routes.py   # /api/payments/process, /api/payments/voucher/<ref>
        ├── contact_routes.py   # /api/contact, /api/contact/whatsapp-link
        └── info_routes.py      # /api/info, /api/info/currencies (Misión, Visión, tasas de cambio)
```

---

## 💱 2. Motor Multimoneda (3 Monedas Oficiales)

El sistema permite cambiar dinámicamente entre 3 monedas desde el selector en la barra superior:
- 🇵🇪 **Soles Peruanos (`PEN - S/.`)**: Moneda base de contratación directa.
- 🇺🇸 **Dólares Americanos (`USD - $`)**: Para turistas internacionales.
- 🇪🇺 **Euros (`EUR - €`)**: Para visitantes europeos.

Al cambiar de moneda, los precios del catálogo, el paso a paso del wizard y los vouchers se actualizan de forma reactiva sin recargar la página.

---

## 💳 3. Pasarela de Pagos Multimétodo (Simulación Realista)

1. **Yape (Móvil)**:
   - Código QR de alta visibilidad y número oficial **`956 623 396`**.
   - Validación de número de operación o código de aprobación de 6 dígitos.
   - Si se cotiza en moneda extranjera, muestra la equivalencia exacta en Soles.
2. **Plin (Interbank, BBVA, Scotiabank)**:
   - Transferencia inmediata al número **`956 623 396`**.
3. **Tarjetas de Crédito / Débito (Visa, Mastercard, Amex)**:
   - Formulario completo con número de tarjeta, vencimiento, CVV y titular con cifrado simulado y verificación 3D Secure.
4. **PayPal Checkout**:
   - Ideal para turistas internacionales con cobro directo en Dólares (USD) o Euros (EUR).
5. **Transferencia Bancaria BCP**:
   - Cuentas corrientes oficiales en Soles y Dólares con Códigos de Cuenta Interbancaria (CCI).

---

## 🔐 4. Capas de Seguridad y Verificación de Cuentas

- **Código de Verificación OTP por Correo (6 dígitos)**:
  - Al registrarse, el sistema genera un código criptográfico de 6 dígitos con expiración de 15 minutos.
  - El usuario ingresa el código en un modal interactivo con auto-foco por dígito.
  - Opción de reenvío con temporizador de seguridad de 60 segundos.
- **Autenticación con JWT**:
  - Tokens firmados con algoritmo HS256 y expiración configurable.
- **Protección Rate Limiting**:
  - Decorador `@rate_limit` por dirección IP contra ataques de fuerza bruta y spam.
- **Sanitización y Cifrado**:
  - Contraseñas protegidas mediante `PBKDF2-HMAC-SHA256`.

---

## 🏜️ 5. Imágenes Reales y Verificadas de Ica (Sin IA / Sin Machu Picchu)

Todas las imágenes provienen de CDN en alta resolución y muestran exclusivamente atractivos de la Región Ica:
- **Huacachina**: Oasis natural, laguna y dunas doradas para tubulares y sandboarding.
- **Paracas & Islas Ballestas**: Candelabro, fauna marina y lobos marinos.
- **Líneas de Nasca**: Geoglifos milenarios y sobrevuelos en avioneta.
- **Ruta del Pisco**: Bodegas tradicionales, viñedos y botijas centenarias en la campiña.
- **Cachiche**: Palmera de las 7 Cabezas y monumento a las brujas de Cachiche.
- **Cañón de los Perdidos**: Grietas y fósiles en el desierto de Ocucaje.

---

## 📱 6. Conectores Directos a WhatsApp (+51 956 623 396)

- **Botón Flotante Permanente**: Con soporte 24/7.
- **Voucher de Confirmación**: Genera automáticamente un mensaje estructurado con código de reserva, nombre del tour, fecha, pasajeros, monto y método de pago para coordinar la recogida en el hotel.
- **Formulario de Contacto**: Permite continuar la asesoría en WhatsApp con un solo clic.

---

## 🚀 7. Cómo Iniciar y Probar el Sistema

### Paso 1: Iniciar el servidor
```bash
cd ~/Documents/Buganvilla-Tours
./run_server.sh
```

El servidor estará en línea en:
👉 **`http://127.0.0.1:5000`**

*(También puedes abrir directamente `index.html` o `frontend/index.html` en tu navegador, ya que el frontend se conecta dinámicamente a la API).*

### Credenciales de prueba:
- **Usuario demo**: `diego@ejemplo.com`
- **Contraseña**: `diego123`
*(O puedes registrarte con cualquier correo nuevo y verificarlo con el código OTP que se muestra en la consola del servidor).*

### Ejecutar la suite de pruebas unitarias:
```bash
source venv/bin/activate
python3 -m unittest backend/test_api.py
```
*(Resultado: **6 tests en 0.4s - OK**).*
# buganvillatours
