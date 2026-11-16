/**
 * ============================================================================
 * BUGANVILLA TOURS E.I.R.L. - JAVASCRIPT APPLICATION CONTROLLER
 * Architecture: SPA Router, Multi-Currency Engine, OTP Security & Backend API
 * ============================================================================
 */

const API_BASE = (window.location.protocol === 'file:' || window.location.port !== '5000')
  ? 'http://127.0.0.1:5000/api'
  : '/api';

const COMPANY = {
  name: 'Buganvilla Tours E.I.R.L.',
  phone: '+51 956 623 396',
  whatsappRaw: '51956623396',
  email: 'reservas@buganvillatours.com.pe',
  ruc: '20534892019',
  dircetur: 'DIRCETUR Nº 042-2018-GR-ICA'
};

/* ==========================================================================
   MULTI-CURRENCY ENGINE (SOLES S/., DÓLARES $, EUROS €)
   ========================================================================== */
const CURRENCIES = {
  PEN: { code: 'PEN', symbol: 'S/.', name: 'Soles (S/.)', flag: '🇵🇪', rate: 1.0 },
  USD: { code: 'USD', symbol: '$', name: 'Dólares ($)', flag: '🇺🇸', rate: 0.2667 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euros (€)', flag: '🇪🇺', rate: 0.2469 }
};

let currentCurrency = localStorage.getItem('buganvilla_currency') || 'PEN';

function formatMoney(amountInPen, code = null) {
  const cur = CURRENCIES[code || currentCurrency] || CURRENCIES.PEN;
  const converted = Math.round(Number(amountInPen) * cur.rate * 100) / 100;
  return `${cur.symbol} ${converted.toFixed(2)}`;
}

function convertToCurrency(amountInPen, code = null) {
  const cur = CURRENCIES[code || currentCurrency] || CURRENCIES.PEN;
  return Math.round(Number(amountInPen) * cur.rate * 100) / 100;
}

function toggleCurrencyDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('currencyDropdown');
  if (dropdown) dropdown.classList.toggle('show');
}

function setCurrency(code, e) {
  if (e) e.stopPropagation();
  if (!CURRENCIES[code]) return;
  currentCurrency = code;
  localStorage.setItem('buganvilla_currency', code);

  // Update header pill
  const cur = CURRENCIES[code];
  const flagEl = document.getElementById('curFlag');
  const labelEl = document.getElementById('curLabel');
  if (flagEl) flagEl.textContent = cur.flag;
  if (labelEl) labelEl.textContent = cur.name;

  // Update active state in dropdown
  document.querySelectorAll('.currency-dropdown-opt').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-cur') === code);
  });

  const dropdown = document.getElementById('currencyDropdown');
  if (dropdown) dropdown.classList.remove('show');

  // Re-render package cards and wizard pricing if open
  renderHomePackages();
  if (bookingWizard.package) {
    recalculateTotal();
    if (document.getElementById('step-3')?.style.display !== 'none') {
      renderSummaryStep();
    }
  }
}

window.addEventListener('click', () => {
  const dropdown = document.getElementById('currencyDropdown');
  if (dropdown) dropdown.classList.remove('show');
});

/* ==========================================================================
   OFFICIAL TOUR PACKAGES (AUTHENTIC ICA DESTINATIONS - NO MACHU PICCHU)
   ========================================================================== */
const DEFAULT_PACKAGES = [
  {
    id: 1,
    name: "Aventura en Huacachina: Tubulares & Sandboarding",
    category: "aventura",
    description: "Adrenalina pura en carros tubulares por las dunas gigantes y práctica de sandboarding guiado al atardecer en el oasis.",
    price: 85,
    duration: "Medio Día",
    image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&q=80",
    highlights: ["Tubulares con chofer certificado DIRCETUR", "Tablas profesionales para sandboarding", "Parada panorámica para fotos del sunset"]
  },
  {
    id: 2,
    name: "Islas Ballestas & Reserva Nacional de Paracas",
    category: "naturaleza",
    description: "Excursión marina en deslizador a las islas para ver lobos de mar, pingüinos y el geoglifo El Candelabro, más playas rojas.",
    price: 135,
    duration: "Full Day",
    image: "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=800&q=80",
    highlights: ["Deslizador moderno con chalecos salvavidas", "Avistamiento de lobos marinos y aves guaneras", "Recorrido por la Reserva de Paracas"]
  },
  {
    id: 3,
    name: "Sobrevuelo Clásico a las Enigmáticas Líneas de Nasca",
    category: "cultura",
    description: "Vista aérea de los misteriosos geoglifos milenarios (El Colibrí, El Mono, El Astronauta) en avionetas Cessna con ventana individual.",
    price: 390,
    duration: "Full Day",
    image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80",
    highlights: ["Avionetas Cessna con ventana individual", "Pilotos bilingües con amplia experiencia", "Certificado oficial de sobrevuelo"]
  },
  {
    id: 4,
    name: "Glamping Exclusivo en Dunas de Huacachina",
    category: "aventura",
    description: "Campamento de lujo bajo el cielo estrellado del desierto iqueño con domo privado, fogata y cena parrillera gourmet.",
    price: 580,
    duration: "2 Días / 1 Noche",
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
    highlights: ["Domo de lujo con cama confortable y luz", "Cena parrillera con maridaje de vino iqueño", "Desayuno buffet al amanecer en las dunas"]
  },
  {
    id: 5,
    name: "Ruta del Pisco & Bodegas Tradicionales Iqueñas",
    category: "cultura",
    description: "Recorrido vitivinícola tradicional en Ica con cata guiada de piscos de uvas quebranta, italia y visita a falcas de cobre.",
    price: 110,
    duration: "1 Día",
    image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80",
    highlights: ["Degustación guiada de piscos y vinos premiados", "Historia de la destilación tradicional en Ica", "Almuerzo típico campestre criollo"]
  },
  {
    id: 6,
    name: "Expedición 4x4 al Cañón de los Perdidos",
    category: "naturaleza",
    description: "Aventura todoterreno hacia el cañón milenario en el desierto de Ocucaje. Paisajes paleontológicos y fósiles únicos.",
    price: 190,
    duration: "Full Day",
    image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80",
    highlights: ["Camionetas 4x4 acondicionadas para desierto", "Trekking moderado por el fondo del cañón", "Guía paleontológico certificado"]
  },
  {
    id: 7,
    name: "Místico Cachiche: Brujas, Palmera de 7 Cabezas & Luren",
    category: "cultura",
    description: "Recorrido de leyendas por el místico pueblo de las brujas, la Palmera de las Siete Cabezas y el Santuario del Señor de Luren.",
    price: 75,
    duration: "Medio Día",
    image: "https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?w=800&q=80",
    highlights: ["Monumento a la Bruja Julia Hernández Pecho", "Visita al enigmático tronco de 7 cabezas", "Guía conocedor del folklore iqueño"]
  },
  {
    id: 8,
    name: "Combo Completo Paracas + Huacachina en 1 Día",
    category: "aventura",
    description: "El tour más solicitado: Islas Ballestas por la mañana en Paracas y tubulares con sandboarding al atardecer en Huacachina.",
    price: 195,
    duration: "Full Day",
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80",
    highlights: ["Traslados privados Paracas - Ica incluidos", "Todas las tasas turísticas y chalecos cubiertos", "Sunset asegurado en las dunas doradas"]
  }
];

let livePackages = [...DEFAULT_PACKAGES];

function getStoredPackages() {
  return livePackages;
}

function getCurrentUser() {
  const u = localStorage.getItem('buganvilla_user');
  try {
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

function getAuthToken() {
  return localStorage.getItem('buganvilla_token') || '';
}

function setCurrentUser(u, token = null) {
  if (u) {
    localStorage.setItem('buganvilla_user', JSON.stringify(u));
    if (token) localStorage.setItem('buganvilla_token', token);
  } else {
    localStorage.removeItem('buganvilla_user');
    localStorage.removeItem('buganvilla_token');
  }
  updateNavAuthUI();
}

/* ==========================================================================
   ROUTING SYSTEM (SPA)
   ========================================================================== */
function navigate(viewName) {
  const views = document.querySelectorAll('.app-view');
  views.forEach(v => v.classList.remove('active'));

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.add('active');
    window.location.hash = `#${viewName}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update active state in nav menu
  document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const homeLink = document.querySelector('.nav-menu a[href="#home"]');
  if (viewName === 'home' && homeLink) homeLink.classList.add('active');

  if (viewName === 'home') {
    renderHomePackages('all');
  } else if (viewName === 'client-dashboard') {
    initClientDashboard();
  }
}

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '') || 'home';
  navigate(hash);
});

function scrollToSection(sectionId) {
  navigate('home');
  setTimeout(() => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

/* ==========================================================================
   AUTH & USER MANAGEMENT
   ========================================================================== */
let pendingRegisterEmail = null;

function updateNavAuthUI() {
  const user = getCurrentUser();
  const guestBox = document.getElementById('navGuestBox');
  const userBox = document.getElementById('navUserBox');

  if (user) {
    if (guestBox) guestBox.style.display = 'none';
    if (userBox) userBox.style.display = 'block';

    const nameEl = document.getElementById('navUserName');
    const avatarEl = document.getElementById('navAvatarLetter');
    if (nameEl) nameEl.innerText = user.name ? user.name.split(' ')[0] : 'Viajero';
    if (avatarEl) avatarEl.innerText = user.name ? user.name.charAt(0).toUpperCase() : 'U';
  } else {
    if (guestBox) guestBox.style.display = 'block';
    if (userBox) userBox.style.display = 'none';
  }
}

function toggleUserDropdown() {
  const d = document.getElementById('userDropdown');
  if (d) d.classList.toggle('show');
}

function switchAuthTab(type) {
  const tabLogin = document.getElementById('tabBtnLogin');
  const tabReg = document.getElementById('tabBtnRegister');
  const formLogin = document.getElementById('formLogin');
  const formReg = document.getElementById('formRegister');

  if (tabLogin) tabLogin.classList.toggle('active', type === 'login');
  if (tabReg) tabReg.classList.toggle('active', type === 'register');
  if (formLogin) formLogin.style.display = type === 'login' ? 'block' : 'none';
  if (formReg) formReg.style.display = type === 'register' ? 'block' : 'none';
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass')?.value || 'diego123';
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Iniciando sesión...';
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.requires_verification) {
        pendingRegisterEmail = email;
        openOtpModal(email);
        throw new Error('Debe verificar su correo para activar su cuenta');
      }
      throw new Error(data.error || 'Credenciales inválidas');
    }

    const payload = data.data || data;
    setCurrentUser(payload.user, payload.token);
    alert(`¡Bienvenido de nuevo, ${payload.user.name}!`);
    navigate('client-dashboard');
  } catch (err) {
    alert(err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Iniciar Sesión en Soles';
    }
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPass')?.value || 'viajero123';
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Registrando...';
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al crear la cuenta');
    }

    pendingRegisterEmail = email;
    openOtpModal(email);
  } catch (err) {
    alert(err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Crear Cuenta Segura';
    }
  }
}

function openOtpModal(email) {
  pendingRegisterEmail = email;
  const modal = document.getElementById('otpModal');
  const targetEl = document.getElementById('otpEmailTarget');
  if (targetEl) targetEl.innerText = email;

  document.querySelectorAll('.otp-digit').forEach(inp => inp.value = '');
  if (modal) modal.classList.add('show');
  const firstInp = document.querySelector('.otp-digit');
  if (firstInp) firstInp.focus();
}

function closeOtpModal() {
  const modal = document.getElementById('otpModal');
  if (modal) modal.classList.remove('show');
}

function handleOtpInput(input, index) {
  const val = input.value.replace(/[^0-9]/g, '');
  input.value = val ? val[val.length - 1] : '';

  const inputs = document.querySelectorAll('.otp-digit');
  if (input.value && index < inputs.length - 1) {
    inputs[index + 1].focus();
  }

  const fullCode = Array.from(inputs).map(i => i.value).join('');
  if (fullCode.length === 6) {
    submitOtpCode();
  }
}

function handleOtpKey(e, index) {
  const inputs = document.querySelectorAll('.otp-digit');
  if (e.key === 'Backspace' && !inputs[index].value && index > 0) {
    inputs[index - 1].focus();
  }
}

async function submitOtpCode() {
  const inputs = document.querySelectorAll('.otp-digit');
  const code = Array.from(inputs).map(i => i.value).join('');
  if (code.length !== 6) {
    alert('Ingresa el código completo de 6 dígitos.');
    return;
  }

  const btn = document.getElementById('btnConfirmOtp');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Validando...';
  }

  try {
    const res = await fetch(`${API_BASE}/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pendingRegisterEmail, code: code })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Código incorrecto o expirado');
    }

    const payload = data.data || data;
    setCurrentUser(payload.user, payload.token);
    closeOtpModal();
    alert(`¡Cuenta verificada con éxito! Bienvenido(a) ${payload.user.name}.`);
    navigate('client-dashboard');
  } catch (err) {
    alert(err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'Verificar y Activar Cuenta';
    }
  }
}

async function resendOtpCode() {
  if (!pendingRegisterEmail) return;
  try {
    const res = await fetch(`${API_BASE}/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pendingRegisterEmail })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo reenviar el código');
    alert('Nuevo código de verificación enviado a tu correo.');
  } catch (err) {
    alert(err.message);
  }
}

function logout() {
  setCurrentUser(null);
  navigate('home');
}

function toggleMobileNav() {
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobileOverlay');
  if (drawer) drawer.classList.toggle('active');
  if (overlay) overlay.classList.toggle('active');
}

/* ==========================================================================
   HOME PACKAGES RENDER (WITH LIVE API & MULTI-CURRENCY)
   ========================================================================== */
async function loadLivePackages() {
  try {
    const res = await fetch(`${API_BASE}/tours?currency=${currentCurrency}`);
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        livePackages = data.data.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          price: p.price_pen || p.price,
          duration: p.duration || 'Medio Día',
          image: p.image_url,
          highlights: p.highlights || ['Transporte turístico seguro', 'Guía oficial DIRCETUR', 'Tickets de ingreso']
        }));
      }
    }
  } catch (e) {
    console.warn('Conectando con paquetes locales de contingencia:', e.message);
  }
}

function filterHomePackages(category, btn) {
  if (btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderHomePackages(category);
}

function renderHomePackages(category = 'all') {
  const container = document.getElementById('homePackagesContainer');
  if (!container) return;

  const pkgs = getStoredPackages();
  const filtered = category === 'all' ? pkgs : pkgs.filter(p => p.category === category);

  container.innerHTML = filtered.map(pkg => {
    const formattedPrice = formatMoney(pkg.price);
    const curCode = currentCurrency;

    return `
      <div class="pkg-card">
        <div class="pkg-img-wrap">
          <img src="${pkg.image}" alt="${pkg.name}" class="pkg-img" loading="lazy">
          <div class="pkg-badge-float">${pkg.category.toUpperCase()}</div>
        </div>
        <div class="pkg-body">
          <div class="pkg-meta-row">
            <span>⏱ ${pkg.duration}</span>
            <span>•</span>
            <span style="color: var(--accent-teal); font-weight: 600;">Salidas Diarias</span>
          </div>
          <h3 class="pkg-title">${pkg.name}</h3>
          <p class="pkg-desc">${pkg.description}</p>
          
          <ul class="pkg-features">
            ${pkg.highlights.map(h => `
              <li class="pkg-feature-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
                <span>${h}</span>
              </li>
            `).join('')}
          </ul>

          <div class="pkg-footer-row">
            <div class="pkg-price-box">
              <span class="pkg-price-label">Tarifa por persona</span>
              <div class="pkg-price-soles">
                ${formattedPrice} <span>${curCode}</span>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="startBookingFlow(${pkg.id})">
              Reservar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.71 12l-8.86-7.85-1.42 1.42L16.86 11H5v2z"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  if (item) item.classList.toggle('open');
}

async function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('cName')?.value.trim();
  const email = document.getElementById('cEmail')?.value.trim();
  const phone = document.getElementById('cPhone')?.value.trim() || '';
  const message = document.getElementById('cMessage')?.value.trim();

  try {
    await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, message })
    });
  } catch (_) {}

  alert(`¡Gracias ${name}! Tu solicitud ha sido enviada a reservas@buganvillatours.com.pe. Un coordinador se comunicará contigo vía WhatsApp en breve.`);
  e.target.reset();
}

/* ==========================================================================
   WIZARD DE RESERVA Y PASARELA DE PAGO (DEDICADA EN PESTAÑA VIEW-BOOKING)
   ========================================================================== */
let bookingWizard = {
  package: null,
  date: '',
  pax: 2,
  notes: '',
  titular: { name: '', doc: '', phone: '', email: '' },
  method: 'yape',
  totalPen: 0
};

function startBookingFlow(pkgId) {
  const pkgs = getStoredPackages();
  const p = pkgs.find(item => item.id === pkgId) || pkgs[0];

  bookingWizard.package = p;
  bookingWizard.pax = 2;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  bookingWizard.date = dateStr;

  document.getElementById('wPkgTitle').innerText = p.name;
  document.getElementById('wPkgDesc').innerText = p.description;
  document.getElementById('wPkgPrice').innerText = `${formatMoney(p.price)} por persona`;
  document.getElementById('wDateInput').value = dateStr;
  document.getElementById('wPaxInput').value = 2;

  const user = getCurrentUser();
  if (user) {
    document.getElementById('wTitularName').value = user.name || '';
    document.getElementById('wTitularEmail').value = user.email || '';
    document.getElementById('wTitularPhone').value = user.phone || '';
  }

  recalculateTotal();
  goToStep(1);
  navigate('booking');
}

function recalculateTotal() {
  if (!bookingWizard.package) return;
  const pax = parseInt(document.getElementById('wPaxInput')?.value || '2', 10) || 1;
  bookingWizard.pax = pax;
  bookingWizard.totalPen = bookingWizard.package.price * pax;

  const formattedTotal = formatMoney(bookingWizard.totalPen);
  const yapeDisplay = document.getElementById('wYapeAmountDisplay');
  if (yapeDisplay) {
    if (currentCurrency === 'PEN') {
      yapeDisplay.innerText = formattedTotal;
    } else {
      yapeDisplay.innerText = `${formattedTotal} (Equiv: S/. ${bookingWizard.totalPen}.00)`;
    }
  }

  const pkgPriceDisplay = document.getElementById('wPkgPrice');
  if (pkgPriceDisplay) {
    pkgPriceDisplay.innerText = `${formatMoney(bookingWizard.package.price)} por persona`;
  }
}

function goToStep(stepNum) {
  for (let i = 1; i <= 5; i++) {
    const box = document.getElementById(`step-${i}`);
    const node = document.getElementById(`wnode-${i}`);
    if (box) box.style.display = (i === stepNum) ? 'block' : 'none';
    if (node) {
      node.classList.toggle('active', i === stepNum);
      node.classList.toggle('completed', i < stepNum);
    }
  }

  if (stepNum === 3) {
    renderSummaryStep();
  }
  window.scrollTo({ top: 120, behavior: 'smooth' });
}

function handleStep2Submit(e) {
  e.preventDefault();
  bookingWizard.titular.name = document.getElementById('wTitularName').value.trim();
  bookingWizard.titular.doc = document.getElementById('wTitularDoc').value.trim();
  bookingWizard.titular.phone = document.getElementById('wTitularPhone').value.trim();
  bookingWizard.titular.email = document.getElementById('wTitularEmail').value.trim();
  bookingWizard.notes = document.getElementById('wNotesInput').value.trim();
  bookingWizard.date = document.getElementById('wDateInput').value;

  goToStep(3);
}

function renderSummaryStep() {
  recalculateTotal();
  const p = bookingWizard.package;
  const t = bookingWizard.titular;
  const box = document.getElementById('wSummaryBox');
  if (!box) return;

  const formattedUnit = formatMoney(p.price);
  const formattedTotal = formatMoney(bookingWizard.totalPen);

  box.innerHTML = `
    <h4 style="font-size: 1.25rem; color: var(--primary); margin-bottom: 6px;">${p.name}</h4>
    <p style="font-size: 0.88rem; color: var(--text-dim); margin-bottom: 20px;">Duración: ${p.duration} · Operado por Buganvilla Tours EIRL</p>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <div><span style="font-size: 0.82rem; color: var(--text-dim);">Fecha Seleccionada:</span><br><strong>${bookingWizard.date}</strong></div>
      <div><span style="font-size: 0.82rem; color: var(--text-dim);">Cantidad de Viajeros:</span><br><strong>${bookingWizard.pax} Personas</strong></div>
      <div><span style="font-size: 0.82rem; color: var(--text-dim);">Titular de Reserva:</span><br><strong>${t.name} (Doc: ${t.doc})</strong></div>
      <div><span style="font-size: 0.82rem; color: var(--text-dim);">WhatsApp / Email:</span><br><strong>${t.phone}</strong></div>
    </div>

    <div style="background: var(--bg-subtle); padding: 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>Tarifa (${bookingWizard.pax} x ${formattedUnit}):</span>
        <strong>${formattedTotal}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
        <span>Impuestos y tasas turísticas DIRCETUR:</span>
        <span style="color: var(--accent-teal); font-weight: 600;">Incluidos</span>
      </div>
      <hr style="border: 0; border-top: 1px solid var(--border-light); margin: 10px 0;">
      <div style="display: flex; justify-content: space-between; font-size: 1.35rem; font-weight: 800; color: var(--primary);">
        <span>Total a Pagar (${currentCurrency}):</span>
        <span>${formattedTotal}</span>
      </div>
    </div>
  `;
}

function selectPayMethod(method) {
  bookingWizard.method = method;
  document.querySelectorAll('.pay-method-tab').forEach(t => t.classList.remove('active'));

  ['payBoxYape', 'payBoxCard', 'payBoxBank', 'payBoxPlin', 'payBoxPaypal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  if (method === 'yape') {
    document.getElementById('tabPayYape')?.classList.add('active');
    document.getElementById('payBoxYape').style.display = 'block';
  } else if (method === 'card') {
    document.getElementById('tabPayCard')?.classList.add('active');
    document.getElementById('payBoxCard').style.display = 'block';
  } else if (method === 'bank') {
    document.getElementById('tabPayBank')?.classList.add('active');
    document.getElementById('payBoxBank').style.display = 'block';
  } else if (method === 'plin') {
    document.getElementById('tabPayPlin')?.classList.add('active');
    document.getElementById('payBoxPlin').style.display = 'block';
  } else if (method === 'paypal') {
    document.getElementById('tabPayPaypal')?.classList.add('active');
    document.getElementById('payBoxPaypal').style.display = 'block';
  }
}

async function processPayment(methodTitle) {
  if (methodTitle === 'Yape') {
    const token = document.getElementById('yapeTokenInput')?.value.trim();
    if (!token || token.length < 4) {
      alert('Por favor ingresa el código o número de aprobación de Yape para validar.');
      return;
    }
  } else if (methodTitle === 'Plin') {
    const token = document.getElementById('plinTokenInput')?.value.trim();
    if (!token) {
      alert('Por favor ingresa el número de constancia o comprobante Plin.');
      return;
    }
  }

  ['payBoxYape', 'payBoxCard', 'payBoxBank', 'payBoxPlin', 'payBoxPaypal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.getElementById('payProcessingBox').style.display = 'block';

  let bookingRef = 'BGN-' + Math.floor(10000 + Math.random() * 90000);
  let finalTotalFormatted = formatMoney(bookingWizard.totalPen);

  try {
    // 1. Submit Booking to Backend
    const bookingPayload = {
      package_id: bookingWizard.package.id,
      booking_date: bookingWizard.date,
      travelers: bookingWizard.pax,
      titular_name: bookingWizard.titular.name,
      titular_doc: bookingWizard.titular.doc,
      titular_phone: bookingWizard.titular.phone,
      titular_email: bookingWizard.titular.email,
      hotel_pickup: bookingWizard.notes || 'Plaza de Armas / Hotel en Ica',
      notes: bookingWizard.notes,
      currency: currentCurrency
    };

    const headers = { 'Content-Type': 'application/json' };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const bRes = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(bookingPayload)
    });

    if (bRes.ok) {
      const bData = await bRes.json();
      const bObj = bData.data || bData;
      bookingRef = bObj.reference_code || bookingRef;
      if (bObj.total_formatted) finalTotalFormatted = bObj.total_formatted;

      // 2. Submit Payment
      await fetch(`${API_BASE}/payments/process`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          reference_code: bookingRef,
          method: methodTitle.toLowerCase().replace(/\s+/g, '_'),
          currency: currentCurrency,
          operation_code: document.getElementById('yapeTokenInput')?.value || document.getElementById('plinTokenInput')?.value || 'SIM-849201'
        })
      });
    }
  } catch (err) {
    console.warn('Backend payment sync fallback to local storage:', err.message);
  }

  setTimeout(() => {
    document.getElementById('payProcessingBox').style.display = 'none';

    // Populate Voucher in Step 5
    document.getElementById('vCode').innerText = bookingRef;
    document.getElementById('vName').innerText = bookingWizard.titular.name;
    document.getElementById('vPackage').innerText = bookingWizard.package.name;
    document.getElementById('vDate').innerText = bookingWizard.date;
    document.getElementById('vMethod').innerText = `${methodTitle} (${currentCurrency})`;
    document.getElementById('vTotal').innerText = finalTotalFormatted;

    goToStep(5);
  }, 1000);
}

function downloadVoucher() {
  window.print();
}

/* ==========================================================================
   CLIENT DASHBOARD ("MIS RESERVAS")
   ========================================================================== */
async function initClientDashboard() {
  const user = getCurrentUser();
  if (!user) {
    navigate('login');
    return;
  }

  const welcomeEl = document.getElementById('clientWelcomeName');
  if (welcomeEl) welcomeEl.innerText = user.name;

  const container = document.getElementById('clientBookingsTableBody');
  if (!container) return;

  container.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px;">Cargando tus reservas...</td></tr>`;

  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/bookings/my-bookings?email=${encodeURIComponent(user.email)}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const data = await res.json();
    const list = data.data || [];

    if (list.length === 0) {
      container.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 32px; color: var(--text-dim);">No tienes reservas registradas aún. <a href="#home" onclick="navigate('home')" style="color: var(--primary); font-weight: 700;">Explorar Paquetes</a></td></tr>`;
      return;
    }

    container.innerHTML = list.map(b => {
      const isConfirmed = b.status === 'confirmada' || b.status === 'completada';
      const badgeCls = isConfirmed ? 'badge-teal' : 'badge-gold';
      const badgeText = isConfirmed ? 'Confirmada' : (b.status === 'pendiente' ? 'Pendiente' : b.status);
      const pkgTitle = b.package_name || b.package?.name || 'Tour en Ica';
      const totalAmount = b.total_formatted || formatMoney(b.total_amount_pen || b.total_amount || 0, b.currency);

      const waMsg = encodeURIComponent(`Hola Buganvilla Tours, consulto sobre mi reserva ${b.reference_code} (${pkgTitle}).`);
      const waUrl = `https://wa.me/${COMPANY.whatsappRaw}?text=${waMsg}`;

      return `
        <tr>
          <td><strong style="color: var(--primary);">${b.reference_code}</strong></td>
          <td>${pkgTitle}</td>
          <td>${b.booking_date}</td>
          <td>${b.travelers || 1} Personas</td>
          <td><strong>${totalAmount}</strong></td>
          <td><span class="badge ${badgeCls}">${badgeText}</span></td>
          <td>
            <a href="${waUrl}" target="_blank" class="btn btn-sm btn-outline-dark" style="padding: 4px 10px; font-size: 0.78rem;">
              WhatsApp
            </a>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--accent-red);">Error al cargar las reservas.</td></tr>`;
  }
}

/* ==========================================================================
   INITIALIZATION ON DOM READY
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  // Sync currency UI
  const cur = CURRENCIES[currentCurrency] || CURRENCIES.PEN;
  const flagEl = document.getElementById('curFlag');
  const labelEl = document.getElementById('curLabel');
  if (flagEl) flagEl.textContent = cur.flag;
  if (labelEl) labelEl.textContent = cur.name;

  updateNavAuthUI();
  await loadLivePackages();

  const hash = window.location.hash.replace('#', '') || 'home';
  navigate(hash);
});
