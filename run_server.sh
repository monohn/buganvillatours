#!/bin/bash
# Script de inicio del servidor backend Buganvilla Tours
cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "📦 Creando entorno virtual..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

echo "============================================================"
echo "🌴 BUGANVILLA TOURS E.I.R.L. - MOTOR DE RESERVAS Y PAGOS 🇵🇪"
echo "============================================================"
echo "📍 Servidor iniciado en: http://127.0.0.1:5000"
echo "📖 Health check:        http://127.0.0.1:5000/api/health"
echo "🏜️ Catálogo de tours:   http://127.0.0.1:5000/api/tours"
echo "💬 Soporte WhatsApp:    +51 956 623 396"
echo "============================================================"
echo "Presiona Ctrl+C para detener el servidor."
echo ""

python3 -m backend.app
