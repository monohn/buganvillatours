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
  PEN: { code: 'PEN', symbol: 'S/.', name: 'Soles (S/.)', flag: 'S/.', rate: 1.0 },
  USD: { code: 'USD', symbol: '$', name: 'Dólares ($)', flag: '$', rate: 0.2667 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euros (€)', flag: '€', rate: 0.2469 }
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
  renderPlanDrawer();
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
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9d/Dune_Buggy_at_Huacachina_%287136152157%29.jpg/960px-Dune_Buggy_at_Huacachina_%287136152157%29.jpg",
    highlights: ["Tubulares con chofer certificado DIRCETUR", "Tablas profesionales para sandboarding", "Parada panorámica para fotos del sunset"]
  },
  {
    id: 2,
    name: "Islas Ballestas & Reserva Nacional de Paracas",
    category: "naturaleza",
    description: "Excursión marina en deslizador a las islas para ver lobos de mar, pingüinos y el geoglifo El Candelabro, más playas rojas.",
    price: 135,
    duration: "Full Day",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Islas_Ballestas_2.JPG/960px-Islas_Ballestas_2.JPG",
    highlights: ["Deslizador moderno con chalecos salvavidas", "Avistamiento de lobos marinos y aves guaneras", "Recorrido por la Reserva de Paracas"]
  },
  {
    id: 3,
    name: "Sobrevuelo Clásico a las Enigmáticas Líneas de Nasca",
    category: "cultura",
    description: "Vista aérea de los misteriosos geoglifos milenarios (El Colibrí, El Mono, El Astronauta) en avionetas Cessna con ventana individual.",
    price: 390,
    duration: "Full Day",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/Nazca_Lines_Hummingbird_%28cropped%29.jpg/960px-Nazca_Lines_Hummingbird_%28cropped%29.jpg",
    highlights: ["Avionetas Cessna con ventana individual", "Pilotos bilingües con amplia experiencia", "Certificado oficial de sobrevuelo"]
  },
  {
    id: 4,
    name: "Glamping Exclusivo en Dunas de Huacachina",
    category: "aventura",
    description: "Campamento de lujo bajo el cielo estrellado del desierto iqueño con domo privado, fogata y cena parrillera gourmet.",
    price: 580,
    duration: "2 Días / 1 Noche",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/View_from_Honeymoon_Desert_Tent_..._%2850950160223%29.jpg/960px-View_from_Honeymoon_Desert_Tent_..._%2850950160223%29.jpg",
    highlights: ["Domo de lujo con cama confortable y luz", "Cena parrillera con maridaje de vino iqueño", "Desayuno buffet al amanecer en las dunas"]
  },
  {
    id: 5,
    name: "Ruta del Pisco & Bodegas Tradicionales Iqueñas",
    category: "cultura",
    description: "Recorrido vitivinícola tradicional en Ica con cata guiada de piscos de uvas quebranta, italia y visita a falcas de cobre.",
    price: 110,
    duration: "1 Día",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Bodega_El_Catador_%287521862384%29.jpg/960px-Bodega_El_Catador_%287521862384%29.jpg",
    highlights: ["Degustación guiada de piscos y vinos premiados", "Historia de la destilación tradicional en Ica", "Almuerzo típico campestre criollo"]
  },
  {
    id: 6,
    name: "Expedición 4x4 al Cañón de los Perdidos",
    category: "naturaleza",
    description: "Aventura todoterreno hacia el cañón milenario en el desierto de Ocucaje. Paisajes paleontológicos y fósiles únicos.",
    price: 190,
    duration: "Full Day",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Ca%C3%B1%C3%B3n_de_los_Perdidos.jpg/960px-Ca%C3%B1%C3%B3n_de_los_Perdidos.jpg",
    highlights: ["Camionetas 4x4 acondicionadas para desierto", "Trekking moderado por el fondo del cañón", "Guía paleontológico certificado"]
  },
  {
    id: 7,
    name: "Místico Cachiche: Brujas, Palmera de 7 Cabezas & Luren",
    category: "cultura",
    description: "Recorrido de leyendas por el místico pueblo de las brujas, la Palmera de las Siete Cabezas y el Santuario del Señor de Luren.",
    price: 75,
    duration: "Medio Día",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/ESTATUA_DE_LA_BRUJA_DE_CACHICHE.jpg/960px-ESTATUA_DE_LA_BRUJA_DE_CACHICHE.jpg",
    highlights: ["Monumento a la Bruja Julia Hernández Pecho", "Visita al enigmático tronco de 7 cabezas", "Guía conocedor del folklore iqueño"]
  },
  {
    id: 8,
    name: "Combo Completo Paracas + Huacachina en 1 Día",
    category: "aventura",
    description: "El tour más solicitado: Islas Ballestas por la mañana en Paracas y tubulares con sandboarding al atardecer en Huacachina.",
    price: 195,
    duration: "Full Day",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/Playa_Roja_-_Paracas_National_Reserve%2C_Ica.jpg/960px-Playa_Roja_-_Paracas_National_Reserve%2C_Ica.jpg",
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

function selectDestinationAndFilter(destKey) {
  filterHomePackages(destKey);
  scrollToSection('paquetes');
}

function paxStep(delta) {
  const input = document.getElementById('wPaxInput');
  if (!input) return;
  let val = (parseInt(input.value, 10) || 2) + delta;
  if (val < 1) val = 1;
  if (val > 25) val = 25;
  input.value = val;
  recalculateTotal();
}

function filterHomePackages(filterKey, btn) {
  if (btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  } else {
    document.querySelectorAll('.filter-btn').forEach(b => {
      const attr = b.getAttribute('onclick') || '';
      if (filterKey === 'all') {
        b.classList.toggle('active', attr.includes("'all'"));
      } else if (filterKey === 'huacachina') {
        b.classList.toggle('active', attr.includes("'aventura'"));
      } else if (filterKey === 'paracas') {
        b.classList.toggle('active', attr.includes("'naturaleza'"));
      } else if (filterKey === 'nasca' || filterKey === 'ica') {
        b.classList.toggle('active', attr.includes("'cultura'"));
      } else {
        b.classList.toggle('active', attr.includes("'" + filterKey + "'"));
      }
    });
  }
  renderHomePackages(filterKey);
}

function renderHomePackages(filterKey = 'all') {
  const container = document.getElementById('homePackagesContainer');
  if (!container) return;

  const pkgs = getStoredPackages();
  let filtered = pkgs;

  if (filterKey && filterKey !== 'all') {
    const key = filterKey.toLowerCase();
    filtered = pkgs.filter(p => {
      if (p.category === key) return true;
      const text = `${p.name} ${p.description}`.toLowerCase();
      if (key === 'huacachina') return text.includes('huacachina');
      if (key === 'paracas') return text.includes('paracas') || text.includes('ballestas');
      if (key === 'nasca' || key === 'nazca') return text.includes('nasca') || text.includes('nazca');
      if (key === 'ica') return text.includes('ica') || text.includes('pisco') || text.includes('cachiche') || text.includes('cañón') || text.includes('canon');
      return text.includes(key);
    });
  }

  const wishlist = getWishlist();

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: var(--text-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 14px;">No encontramos paquetes para este filtro en Ica.</p>
        <button class="btn btn-outline btn-sm" onclick="filterHomePackages('all')">Ver todos los paquetes</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(pkg => {
    const formattedPrice = formatMoney(pkg.price);
    const curCode = currentCurrency;
    const isSaved = wishlist.includes(pkg.id);

    return `
      <div class="pkg-card reveal-up">
        <div class="pkg-img-wrap">
          <img src="${pkg.image}" alt="${pkg.name}" class="pkg-img" loading="lazy" referrerpolicy="no-referrer">
          <div class="pkg-badge-float">${pkg.category.toUpperCase()}</div>
          <button class="pkg-bookmark-btn ${isSaved ? 'active' : ''}" onclick="toggleWishlist(${pkg.id}, event)" title="${isSaved ? 'Quitar de Mi Viaje' : 'Guardar en Mi Viaje'}" aria-label="Guardar en Mi Viaje">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isSaved ? '#E2C275' : 'none'}" stroke="${isSaved ? '#E2C275' : 'currentColor'}" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
        <div class="pkg-body">
          <div class="pkg-meta-row">
            <span>${pkg.duration}</span>
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
            <button class="btn btn-primary btn-sm btn-glow" onclick="startBookingFlow(${pkg.id})">
              Reservar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.71 12l-8.86-7.85-1.42 1.42L16.86 11H5v2z"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  initScrollReveal();
}

/* ==========================================================================
   MI VIAJE / WISHLIST SYSTEM (GABO 65% + BUGANVILLA)
   ========================================================================== */
function getWishlist() {
  try {
    const raw = localStorage.getItem('bgv_wishlist');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveWishlist(list) {
  try {
    localStorage.setItem('bgv_wishlist', JSON.stringify(list));
  } catch (e) {}
}

function updateWishlistBadge() {
  const list = getWishlist();
  const badges = document.querySelectorAll('#planCount, .count-badge');
  badges.forEach(b => {
    b.textContent = list.length;
    b.classList.remove('bump');
    void b.offsetWidth;
    b.classList.add('bump');
  });
}

function toggleWishlist(pkgId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  let list = getWishlist();
  const idx = list.indexOf(pkgId);
  if (idx > -1) {
    list.splice(idx, 1);
  } else {
    list.push(pkgId);
  }
  saveWishlist(list);
  updateWishlistBadge();
  renderHomePackages();
  renderPlanDrawer();
}

function togglePlanDrawer() {
  const drawer = document.getElementById('planDrawer');
  const overlay = document.getElementById('planOverlay');
  if (!drawer || !overlay) return;
  const isOpen = drawer.classList.contains('open');
  if (isOpen) {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  } else {
    renderPlanDrawer();
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function clearWishlist() {
  saveWishlist([]);
  updateWishlistBadge();
  renderHomePackages();
  renderPlanDrawer();
}

function renderPlanDrawer() {
  const container = document.getElementById('planDrawerContent');
  const totalEl = document.getElementById('planTotalAmount');
  const countEl = document.getElementById('planDrawerCount');
  const waBtn = document.getElementById('planWhatsAppBtn');
  if (!container) return;

  const list = getWishlist();
  const allPkgs = getStoredPackages();
  const savedPkgs = allPkgs.filter(p => list.includes(p.id));

  if (countEl) countEl.textContent = `(${savedPkgs.length})`;

  if (savedPkgs.length === 0) {
    container.innerHTML = `
      <div class="plan-empty">
        <svg class="plan-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        <h4 style="font-family: var(--font-display); font-size: 1.15rem; color: var(--text-main); margin-bottom: 6px;">Tu viaje está vacío</h4>
        <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.45;">Haz clic en el icono de guardar en los paquetes turísticos que más te interesen para armar tu recorrido ideal por Ica.</p>
      </div>
    `;
    if (totalEl) totalEl.textContent = `${formatMoney(0)} ${currentCurrency}`;
    if (waBtn) {
      waBtn.style.opacity = '0.5';
      waBtn.style.pointerEvents = 'none';
      waBtn.href = '#';
    }
    return;
  }

  let totalPen = 0;
  container.innerHTML = savedPkgs.map(pkg => {
    totalPen += pkg.price;
    const formatted = formatMoney(pkg.price);
    return `
      <div class="plan-item">
        <img src="${pkg.image}" alt="${pkg.name}" class="plan-item-img" loading="lazy">
        <div class="plan-item-info">
          <div class="plan-item-title">${pkg.name}</div>
          <div class="plan-item-meta">${pkg.duration} · Salida Diaria</div>
          <div class="plan-item-price">${formatted} <small>${currentCurrency}</small></div>
        </div>
        <div class="plan-item-actions">
          <button class="btn btn-primary btn-sm" onclick="togglePlanDrawer(); startBookingFlow(${pkg.id});" style="padding: 6px 12px; font-size: 0.78rem;">
            Reservar
          </button>
          <button class="plan-item-del" onclick="toggleWishlist(${pkg.id})" title="Quitar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            Quitar
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (totalEl) totalEl.textContent = `${formatMoney(totalPen)} ${currentCurrency}`;

  if (waBtn) {
    waBtn.style.opacity = '1';
    waBtn.style.pointerEvents = 'auto';
    const names = savedPkgs.map(p => `• ${p.name} (${formatMoney(p.price)} ${currentCurrency})`).join('\n');
    const msg = `¡Hola Buganvilla Tours! Deseo cotizar mi itinerario para ${savedPkgs.length} experiencia(s) en Ica:\n${names}\nTotal estimado: ${formatMoney(totalPen)} ${currentCurrency}. ¿Tienen disponibilidad de fechas?`;
    waBtn.href = `https://wa.me/${COMPANY.whatsappRaw}?text=${encodeURIComponent(msg)}`;
  }
}

/* ==========================================================================
   02 · HERO BOOKING BAR / PLANIFICADOR (GABO FUSION)
   ========================================================================== */
function filterFromBookBar(event) {
  if (event) event.preventDefault();
  const destSelect = document.getElementById('bookBarDest');
  const dateInput = document.getElementById('bookBarDate');
  const paxSelect = document.getElementById('bookBarPax');

  const destVal = destSelect ? destSelect.value : 'all';
  const paxVal = paxSelect ? parseInt(paxSelect.value, 10) : 2;

  bookingState.travelers = paxVal;
  filterHomePackages(destVal);
  scrollToSection('paquetes');
}

/* ==========================================================================
   LIVE CLOCK & STAT COUNTER ANIMATION
   ========================================================================== */
function updateHeroClock() {
  const clockEl = document.getElementById('heroLimaClock');
  if (!clockEl) return;
  try {
    const now = new Date();
    const options = { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false };
    const timeStr = new Intl.DateTimeFormat([], options).format(now);
    clockEl.textContent = timeStr;
  } catch (e) {
    const d = new Date();
    clockEl.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}
setInterval(updateHeroClock, 1000);
updateHeroClock();

function initStatCounters() {
  const stats = document.querySelectorAll('.stat-num[data-target]');
  if (!stats.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target'), 10);
        const from = parseInt(el.getAttribute('data-from') || '0', 10);
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1400;
        const startTime = performance.now();

        function animate(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(from + (target - from) * ease);
          el.textContent = current + suffix;
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            el.textContent = target + suffix;
          }
        }
        requestAnimationFrame(animate);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.25 });

  stats.forEach(s => observer.observe(s));
}

/* ==========================================================================
   07 · SCROLL PROGRESS LINE (GABO +10% FUSION)
   ========================================================================== */
function initScrollProgress() {
  const bar = document.querySelector('.scroll-progress-bar');
  if (!bar) return;

  function update() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
    bar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ==========================================================================
   08 · LIGHTWEIGHT SCROLL REVEAL (GPU ACCELERATED - NO JANK)
   ========================================================================== */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-up:not(.is-visible)');
  if (!elements.length) return;

  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

  elements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   09 · HERO TERRITORY SELECTOR (GABO +10% FUSION)
   ========================================================================== */
function selectHeroTerritory(destKey) {
  document.querySelectorAll('.hero-dest-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-dest') === destKey);
  });

  const destSelect = document.getElementById('bookBarDest');
  if (destSelect) {
    destSelect.value = destKey;
  }
}

/* ==========================================================================
   10 · TESTIMONIAL QUOTES CAROUSEL (GABO +10% FUSION)
   ========================================================================== */
const TESTIMONIAL_QUOTES = [
  {
    quote: "El atardecer sobre las dunas de <i>Huacachina</i> y el recorrido en tubulares fue la experiencia más emocionante de nuestro viaje por el Perú. La puntualidad y calidez de Buganvilla Tours superaron todas nuestras expectativas.",
    author: "Familia Valdivia Morales",
    tag: "Viajeros desde Lima · Tour Huacachina & Sandboard"
  },
  {
    quote: "Ver los lobos marinos y pingüinos en las <i>Islas Ballestas</i> con una embarcación impecable y chalecos certificados nos dio total tranquilidad. Sus 24 años de experiencia se notan en cada detalle del servicio.",
    author: "Claire & Thomas Dubois",
    tag: "Turistas de Francia · Tour Paracas & Reserva Nacional"
  },
  {
    quote: "El sobrevuelo a las <i>Líneas de Nasca</i> fue sencillamente impresionante. Todo el trámite en el aeródromo fue coordinado por Buganvilla de forma ágil, profesional y transparente.",
    author: "Carlos E. Benavides",
    tag: "Viajero Corporativo · Sobrevuelo Nasca & Ruta del Pisco"
  }
];

let activeQuoteIndex = 0;
let quoteAutoTimer = null;

function renderQuote(index) {
  const quoteTextEl = document.getElementById('quoteText');
  const quoteAuthorEl = document.getElementById('quoteAuthor');
  const quoteTagEl = document.getElementById('quoteTag');
  const dotsContainer = document.getElementById('quoteDots');
  if (!quoteTextEl || !quoteAuthorEl || !quoteTagEl) return;

  activeQuoteIndex = (index + TESTIMONIAL_QUOTES.length) % TESTIMONIAL_QUOTES.length;
  const item = TESTIMONIAL_QUOTES[activeQuoteIndex];

  quoteTextEl.style.opacity = '0';
  setTimeout(() => {
    quoteTextEl.innerHTML = `"${item.quote}"`;
    quoteAuthorEl.textContent = item.author;
    quoteTagEl.textContent = item.tag;
    quoteTextEl.style.opacity = '1';
  }, 200);

  if (dotsContainer) {
    dotsContainer.innerHTML = TESTIMONIAL_QUOTES.map((_, i) => `
      <span class="quote-dot ${i === activeQuoteIndex ? 'active' : ''}" onclick="selectQuote(${i})"></span>
    `).join('');
  }
}

function nextQuote() {
  renderQuote(activeQuoteIndex + 1);
  resetQuoteTimer();
}

function prevQuote() {
  renderQuote(activeQuoteIndex - 1);
  resetQuoteTimer();
}

function selectQuote(i) {
  renderQuote(i);
  resetQuoteTimer();
}

function resetQuoteTimer() {
  if (quoteAutoTimer) clearInterval(quoteAutoTimer);
  quoteAutoTimer = setInterval(() => {
    renderQuote(activeQuoteIndex + 1);
  }, 7500);
}

function initQuotesCarousel() {
  renderQuote(0);
  resetQuoteTimer();
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
  const p = pkgs.find(item => item.id === Number(pkgId)) || pkgs[0];

  bookingWizard.package = p;
  bookingWizard.pax = 2;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  bookingWizard.date = dateStr;

  const dateInput = document.getElementById('wDateInput');
  if (dateInput) {
    dateInput.value = dateStr;
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  const paxInput = document.getElementById('wPaxInput');
  if (paxInput) paxInput.value = 2;

  const titleEl = document.getElementById('wPkgTitle');
  if (titleEl) titleEl.innerText = p.name;

  const descEl = document.getElementById('wPkgDesc');
  if (descEl) descEl.innerText = p.description;

  const breadcrumbEl = document.getElementById('wBreadcrumbTitle');
  if (breadcrumbEl) breadcrumbEl.innerText = p.name;

  const heroImg = document.getElementById('wPkgHeroImg');
  if (heroImg) {
    heroImg.src = p.image;
    heroImg.onerror = function() {
      this.src = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Oasis_de_Huacachina%2C_Ica%2C_Per%C3%BA%2C_2015-07-29%2C_DD_23.JPG/960px-Oasis_de_Huacachina%2C_Ica%2C_Per%C3%BA%2C_2015-07-29%2C_DD_23.JPG';
    };
  }

  const badgeEl = document.getElementById('wPkgBadge');
  if (badgeEl) badgeEl.innerText = (p.category || 'TOUR').toUpperCase();

  const durationEl = document.getElementById('wPkgDuration');
  if (durationEl) durationEl.innerText = p.duration || 'Medio Día';

  const user = getCurrentUser();
  if (user) {
    const nameInput = document.getElementById('wTitularName');
    const emailInput = document.getElementById('wTitularEmail');
    const phoneInput = document.getElementById('wTitularPhone');
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
  }

  recalculateTotal();
  goToStep(1);
  navigate('booking');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function recalculateTotal() {
  if (!bookingWizard.package) return;
  const pax = parseInt(document.getElementById('wPaxInput')?.value || '2', 10) || 1;
  bookingWizard.pax = pax;
  bookingWizard.totalPen = bookingWizard.package.price * pax;

  const formattedTotal = formatMoney(bookingWizard.totalPen);
  const formattedUnit = formatMoney(bookingWizard.package.price);

  const subtotalLive = document.getElementById('wSubtotalLive');
  if (subtotalLive) {
    subtotalLive.innerText = `${pax} ${pax === 1 ? 'persona' : 'personas'} · ${formattedTotal}`;
  }

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
    pkgPriceDisplay.innerText = `${formattedUnit} por persona`;
  }
}

function goToStep(stepNum) {
  if (stepNum === 2) {
    const dateInput = document.getElementById('wDateInput');
    if (dateInput && !dateInput.value) {
      alert('Por favor selecciona la fecha programada para tu salida.');
      dateInput.focus();
      return;
    }
    bookingWizard.date = dateInput.value;
    bookingWizard.notes = document.getElementById('wNotesInput')?.value.trim() || '';
  }

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
  const container = document.querySelector('.wizard-container');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function handleStep2Submit(e) {
  e.preventDefault();
  bookingWizard.titular.name = document.getElementById('wTitularName').value.trim();
  bookingWizard.titular.doc = document.getElementById('wTitularDoc').value.trim();
  bookingWizard.titular.phone = document.getElementById('wTitularPhone').value.trim();
  bookingWizard.titular.email = document.getElementById('wTitularEmail').value.trim();
  bookingWizard.notes = document.getElementById('wNotesInput')?.value.trim() || '';

  goToStep(3);
}

function renderSummaryStep() {
  recalculateTotal();
  const p = bookingWizard.package;
  const t = bookingWizard.titular;
  const box = document.getElementById('wSummaryBox');
  if (!box || !p) return;

  const formattedUnit = formatMoney(p.price);
  const formattedTotal = formatMoney(bookingWizard.totalPen);

  box.innerHTML = `
    <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-light);">
      <img src="${p.image}" alt="${p.name}" style="width: 72px; height: 54px; object-fit: cover; border-radius: var(--radius-sm);" onerror="this.src='https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Oasis_de_Huacachina%2C_Ica%2C_Per%C3%BA%2C_2015-07-29%2C_DD_23.JPG/960px-Oasis_de_Huacachina%2C_Ica%2C_Per%C3%BA%2C_2015-07-29%2C_DD_23.JPG'">
      <div>
        <h4 style="font-size: 1.15rem; color: var(--primary); margin-bottom: 2px;">${p.name}</h4>
        <p style="font-size: 0.85rem; color: var(--text-dim); margin: 0;">Duración: ${p.duration} · Operado por Buganvilla Tours EIRL</p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <div><span style="font-size: 0.82rem; color: var(--text-dim);">Fecha Seleccionada:</span><br><strong>${bookingWizard.date}</strong></div>
      <div><span style="font-size: 0.82rem; color: var(--text-dim);">Cantidad de Viajeros:</span><br><strong>${bookingWizard.pax} ${bookingWizard.pax === 1 ? 'Persona' : 'Personas'}</strong></div>
      <div><span style="font-size: 0.82rem; color: var(--text-dim);">Titular de Reserva:</span><br><strong>${t.name} (Doc: ${t.doc})</strong></div>
      <div><span style="font-size: 0.82rem; color: var(--text-dim);">WhatsApp / Email:</span><br><strong>${t.phone}</strong></div>
    </div>

    <div style="background: var(--sand-50); padding: 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>Tarifa oficial (${bookingWizard.pax} x ${formattedUnit}):</span>
        <strong>${formattedTotal}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.88rem;">
        <span>Impuestos y tasas turísticas DIRCETUR:</span>
        <span style="color: var(--accent-teal); font-weight: 600;">Incluidos</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.88rem;">
        <span>Seguro de accidentes SOAT turístico:</span>
        <span style="color: var(--accent-teal); font-weight: 600;">100% Cobertura</span>
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
    const b = document.getElementById('payBoxYape');
    if (b) b.style.display = 'grid';
  } else if (method === 'card') {
    document.getElementById('tabPayCard')?.classList.add('active');
    const b = document.getElementById('payBoxCard');
    if (b) b.style.display = 'block';
  } else if (method === 'bank') {
    document.getElementById('tabPayBank')?.classList.add('active');
    const b = document.getElementById('payBoxBank');
    if (b) b.style.display = 'block';
  } else if (method === 'plin') {
    document.getElementById('tabPayPlin')?.classList.add('active');
    const b = document.getElementById('payBoxPlin');
    if (b) b.style.display = 'block';
  } else if (method === 'paypal') {
    document.getElementById('tabPayPaypal')?.classList.add('active');
    const b = document.getElementById('payBoxPaypal');
    if (b) b.style.display = 'block';
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
  const procBox = document.getElementById('payProcessingBox');
  if (procBox) procBox.style.display = 'block';

  let bookingRef = 'BGN-' + Math.floor(10000 + Math.random() * 90000);
  let finalTotalFormatted = formatMoney(bookingWizard.totalPen);

  try {
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
    if (procBox) procBox.style.display = 'none';

    document.getElementById('vCode').innerText = bookingRef;
    document.getElementById('vName').innerText = bookingWizard.titular.name;
    document.getElementById('vPackage').innerText = bookingWizard.package.name;
    document.getElementById('vDate').innerText = bookingWizard.date;
    document.getElementById('vMethod').innerText = `${methodTitle} (${currentCurrency})`;
    document.getElementById('vTotal').innerText = finalTotalFormatted;

    goToStep(5);
  }, 900);
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
  updateWishlistBadge();
  updateHeroClock();
  initStatCounters();
  initScrollProgress();
  initScrollReveal();
  initQuotesCarousel();

  await loadLivePackages();

  const hash = window.location.hash.replace('#', '') || 'home';
  navigate(hash);
});
