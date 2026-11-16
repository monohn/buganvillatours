/**
 * ============================================================================
 * BUGANVILLA TOURS E.I.R.L. - FRONTEND CONFIGURATION & ASSETS REGISTRY
 * Layer: Presentation / Configuration & Global Helpers
 * ============================================================================
 */

const CONFIG = {
  // Dynamically resolve API base: whether loaded over http(s) or file://
  API_BASE: (window.location.protocol === 'file:' || window.location.port !== '5000')
    ? 'http://127.0.0.1:5000/api'
    : '/api',

  COMPANY: {
    name: 'Buganvilla Tours E.I.R.L.',
    shortName: 'Buganvilla Tours',
    legalName: 'Buganvilla Tours Empresa Individual de Responsabilidad Limitada',
    ruc: '20534892019',
    dircetur: 'DIRCETUR Nº 042-2018-GR-ICA',
    address: 'Calle Bolívar 234, Of. 102 - Plaza de Armas, Ica, Perú',
    phone: '(056) 211-197',
    phone2: '(056) 234-890',
    mobile: '+51 956 623 396',
    whatsappRaw: '51956623396',
    email: 'reservas@buganvillatours.com.pe',
    contactEmail: 'informes@buganvillatours.com.pe',
    website: 'https://www.buganvillatours.com.pe',
    hours: 'Lunes a Domingo: 07:00 - 21:00 (Atención 24/7 en WhatsApp)'
  },

  // Supported Currencies
  CURRENCIES: {
    PEN: { code: 'PEN', symbol: 'S/.', name: 'Soles Peruanos', flag: 'S/.', rate: 1.0 },
    USD: { code: 'USD', symbol: '$', name: 'Dólares (USD)', flag: '$', rate: 0.2667 },
    EUR: { code: 'EUR', symbol: '€', name: 'Euros (EUR)', flag: '€', rate: 0.2469 }
  },

  DEFAULT_CURRENCY: 'PEN',

  // Official Verified Real Imagery of Ica Region (Unsplash & Wikimedia Cloud CDN)
  // Strictly authentic: No Machu Picchu, no generic AI imagery
  DESTINATION_IMAGES: {
    huacachina: {
      title: 'Oasis de Huacachina & Dunas de Ica',
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Oasis_de_Huacachina%2C_Ica%2C_Per%C3%BA%2C_2015-07-29%2C_DD_23.JPG/960px-Oasis_de_Huacachina%2C_Ica%2C_Per%C3%BA%2C_2015-07-29%2C_DD_23.JPG',
      description: 'El único oasis natural de América rodeado de imponentes dunas doradas.'
    },
    paracas: {
      title: 'Islas Ballestas y Reserva Nacional de Paracas',
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Islas_Ballestas_2.JPG/960px-Islas_Ballestas_2.JPG',
      description: 'Santuario de lobos marinos, pingüinos de Humboldt y el enigmático Candelabro.'
    },
    nasca: {
      title: 'Sobrevuelo a las Líneas de Nasca',
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/Nazca_Lines_Hummingbird_%28cropped%29.jpg/960px-Nazca_Lines_Hummingbird_%28cropped%29.jpg',
      description: 'Geoglifos milenarios de la cultura Nasca observados desde avionetas Cessna.'
    },
    pisco_wine: {
      title: 'Ruta del Pisco & Bodegas Tradicionales de Ica',
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Bodega_El_Catador_%287521862384%29.jpg/960px-Bodega_El_Catador_%287521862384%29.jpg',
      description: 'Degustación y cata de piscos puros y quebrantas en haciendas coloniales centenarias.'
    },
    cachiche: {
      title: 'Pueblo de Cachiche & Palmera de las 7 Cabezas',
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/PALMERA_DE_SIETE_CABEZAS.jpg/960px-PALMERA_DE_SIETE_CABEZAS.jpg',
      description: 'Tierra mística de brujas benévolas y leyendas ancestrales iqueñas.'
    },
    canyon: {
      title: 'Cañón de los Perdidos - Desierto de Ocucaje',
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Ca%C3%B1%C3%B3n_de_los_Perdidos.jpg/960px-Ca%C3%B1%C3%B3n_de_los_Perdidos.jpg',
      description: 'Maravilla geológica de 600 metros de profundidad con fósiles marinos milenarios.'
    }
  }
};

/**
 * Global Toast Notification Helper
 */
function showNotification(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 85px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 360px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgColors = {
    success: 'linear-gradient(135deg, #10B981, #059669)',
    error: 'linear-gradient(135deg, #EF4444, #DC2626)',
    warning: 'linear-gradient(135deg, #F59E0B, #D97706)',
    info: 'linear-gradient(135deg, #3A1054, #4B1A73)'
  };

  toast.style.cssText = `
    background: ${bgColors[type] || bgColors.info};
    color: #FFFFFF;
    padding: 12px 18px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.25);
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 10px;
    pointer-events: auto;
    animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  `;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
  toast.innerHTML = `<span style="font-weight:700;font-size:1.1rem">${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Generate official WhatsApp Direct chat link with prefilled message
 */
function buildWhatsAppLink(customText = '') {
  const defaultText = `Hola Buganvilla Tours, deseo información y asesoría sobre los paquetes turísticos en Ica.`;
  const text = encodeURIComponent(customText || defaultText);
  return `https://wa.me/${CONFIG.COMPANY.whatsappRaw}?text=${text}`;
}

window.CONFIG = CONFIG;
window.showNotification = showNotification;
window.buildWhatsAppLink = buildWhatsAppLink;
