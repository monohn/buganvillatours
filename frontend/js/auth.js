/**
 * ============================================================================
 * AUTHENTICATION & SECURITY ENGINE - BUGANVILLA TOURS E.I.R.L.
 * Includes: JWT Token Session, Registration with 6-digit OTP verification,
 * Profile management and UI Synchronization.
 * ============================================================================
 */

const AuthManager = {
  tokenKey: 'buganvilla_token',
  userKey: 'buganvilla_user',
  pendingEmailForVerification: null,
  resendCountdownTimer: null,

  init() {
    this.bindEvents();
    this.syncNavbarState();
    this.checkSessionValidity();
  },

  getToken() {
    return localStorage.getItem(this.tokenKey);
  },

  getUser() {
    const raw = localStorage.getItem(this.userKey);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  },

  setSession(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.syncNavbarState();
  },

  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.syncNavbarState();
  },

  async checkSessionValidity() {
    const token = this.getToken();
    if (!token) return;

    try {
      const res = await fetch(`${CONFIG.API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        const user = json.data || json.user;
        if (user) {
          localStorage.setItem(this.userKey, JSON.stringify(user));
          this.syncNavbarState();
        }
      } else if (res.status === 401) {
        this.clearSession();
      }
    } catch (e) {
      console.warn('Verificación de sesión omitida:', e.message);
    }
  },

  syncNavbarState() {
    const isAuth = this.isAuthenticated();
    const user = this.getUser();

    const authBtns = document.querySelectorAll('.auth-logged-out-btn');
    const userPills = document.querySelectorAll('.auth-logged-in-pill');
    const userNameEls = document.querySelectorAll('.auth-user-name');
    const myBookingsLinks = document.querySelectorAll('.nav-my-bookings-link');

    if (isAuth && user) {
      authBtns.forEach(btn => btn.style.display = 'none');
      userPills.forEach(pill => pill.style.display = 'flex');
      userNameEls.forEach(el => el.textContent = user.name ? user.name.split(' ')[0] : 'Viajero');
      myBookingsLinks.forEach(link => link.style.display = 'block');
    } else {
      authBtns.forEach(btn => btn.style.display = 'inline-flex');
      userPills.forEach(pill => pill.style.display = 'none');
      myBookingsLinks.forEach(link => link.style.display = 'none');
    }
  },

  // --------------------------------------------------------------------------
  // AUTH API CALLS
  // --------------------------------------------------------------------------
  async register(formData) {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      this.pendingEmailForVerification = formData.email;
      this.openVerificationModal(formData.email);
      showNotification('Código de verificación de 6 dígitos enviado a su correo', 'info');
      return data;
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    }
  },

  async verifyCode(email, code) {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Código incorrecto o expirado');
      }

      const payload = data.data || data;
      this.setSession(payload.token, payload.user);
      this.closeVerificationModal();
      this.closeAuthModal();
      showNotification(`¡Cuenta verificada! Bienvenido(a) ${payload.user.name}`, 'success');
      
      if (window.BookingWizard && window.BookingWizard.pendingBookingAction) {
        window.BookingWizard.pendingBookingAction();
        window.BookingWizard.pendingBookingAction = null;
      }
      return data;
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    }
  },

  async resendCode(email) {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo reenviar el código');
      }

      showNotification('Nuevo código de verificación enviado a su correo', 'success');
      this.startResendCountdown();
      return data;
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    }
  },

  async login(email, password) {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.requires_verification) {
          this.pendingEmailForVerification = email;
          this.openVerificationModal(email);
          throw new Error('Debe verificar su correo para activar su cuenta');
        }
        throw new Error(data.error || 'Credenciales inválidas');
      }

      const payload = data.data || data;
      this.setSession(payload.token, payload.user);
      this.closeAuthModal();
      showNotification(`¡Bienvenido(a) de nuevo, ${payload.user.name}!`, 'success');

      if (window.BookingWizard && window.BookingWizard.pendingBookingAction) {
        window.BookingWizard.pendingBookingAction();
        window.BookingWizard.pendingBookingAction = null;
      }
      return data;
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    }
  },

  logout() {
    this.clearSession();
    showNotification('Sesión finalizada correctamente', 'info');
    if (window.location.hash.includes('dashboard')) {
      window.location.hash = '#home';
    }
  },

  // --------------------------------------------------------------------------
  // MODALS & EVENT HANDLERS
  // --------------------------------------------------------------------------
  openAuthModal(defaultTab = 'login') {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.classList.add('active');
    this.switchAuthTab(defaultTab);
  },

  closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('active');
  },

  switchAuthTab(tab) {
    const loginForm = document.getElementById('loginFormContainer');
    const registerForm = document.getElementById('registerFormContainer');
    const tabLogin = document.getElementById('tabLoginBtn');
    const tabRegister = document.getElementById('tabRegisterBtn');

    if (tab === 'login') {
      if (loginForm) loginForm.style.display = 'block';
      if (registerForm) registerForm.style.display = 'none';
      if (tabLogin) tabLogin.classList.add('active');
      if (tabRegister) tabRegister.classList.remove('active');
    } else {
      if (loginForm) loginForm.style.display = 'none';
      if (registerForm) registerForm.style.display = 'block';
      if (tabLogin) tabLogin.classList.remove('active');
      if (tabRegister) tabRegister.classList.add('active');
    }
  },

  openVerificationModal(email) {
    this.pendingEmailForVerification = email;
    const modal = document.getElementById('verificationModal');
    const emailDisplay = document.getElementById('verifyEmailDisplay');
    if (emailDisplay) emailDisplay.textContent = email;

    const inputs = document.querySelectorAll('.otp-digit-input');
    inputs.forEach(inp => {
      inp.value = '';
    });

    if (modal) modal.classList.add('active');
    if (inputs[0]) inputs[0].focus();
    this.startResendCountdown();
  },

  closeVerificationModal() {
    const modal = document.getElementById('verificationModal');
    if (modal) modal.classList.remove('active');
    if (this.resendCountdownTimer) clearInterval(this.resendCountdownTimer);
  },

  startResendCountdown() {
    let secondsLeft = 60;
    const resendBtn = document.getElementById('resendOtpBtn');
    if (!resendBtn) return;

    resendBtn.disabled = true;
    resendBtn.style.opacity = '0.6';
    resendBtn.style.cursor = 'not-allowed';

    if (this.resendCountdownTimer) clearInterval(this.resendCountdownTimer);

    this.resendCountdownTimer = setInterval(() => {
      secondsLeft--;
      resendBtn.textContent = `Reenviar código (${secondsLeft}s)`;
      if (secondsLeft <= 0) {
        clearInterval(this.resendCountdownTimer);
        resendBtn.disabled = false;
        resendBtn.style.opacity = '1';
        resendBtn.style.cursor = 'pointer';
        resendBtn.textContent = 'Reenviar código';
      }
    }, 1000);
  },

  bindEvents() {
    // Auth Tab switching
    const tabLogin = document.getElementById('tabLoginBtn');
    const tabRegister = document.getElementById('tabRegisterBtn');
    if (tabLogin) tabLogin.addEventListener('click', () => this.switchAuthTab('login'));
    if (tabRegister) tabRegister.addEventListener('click', () => this.switchAuthTab('register'));

    // Modal Close buttons
    document.querySelectorAll('.modal-close-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAuthModal();
        this.closeVerificationModal();
      });
    });

    // Close on backdrop click
    ['authModal', 'verificationModal'].forEach(id => {
      const modal = document.getElementById(id);
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('active');
          }
        });
      }
    });

    // Login Form Submit
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Iniciando sesión...';
        try {
          await this.login(email, password);
        } catch (_) {}
        finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Ingresar a mi Cuenta';
        }
      });
    }

    // Register Form Submit
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Generando cuenta...';
        try {
          await this.register({ name, email, phone, password });
        } catch (_) {}
        finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Crear Cuenta y Verificar';
        }
      });
    }

    // OTP Input Navigation & Submit
    const otpInputs = document.querySelectorAll('.otp-digit-input');
    otpInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = val ? val[val.length - 1] : '';

        if (e.target.value && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }

        const fullCode = Array.from(otpInputs).map(i => i.value).join('');
        if (fullCode.length === 6) {
          this.submitOtp(fullCode);
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
          otpInputs[index - 1].focus();
        }
      });
    });

    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    if (verifyOtpBtn) {
      verifyOtpBtn.addEventListener('click', () => {
        const code = Array.from(otpInputs).map(i => i.value).join('');
        if (code.length !== 6) {
          showNotification('Ingrese el código completo de 6 dígitos', 'warning');
          return;
        }
        this.submitOtp(code);
      });
    }

    const resendBtn = document.getElementById('resendOtpBtn');
    if (resendBtn) {
      resendBtn.addEventListener('click', () => {
        if (this.pendingEmailForVerification) {
          this.resendCode(this.pendingEmailForVerification);
        }
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('navLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // Login Triggers in Nav
    document.querySelectorAll('.open-login-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openAuthModal('login');
      });
    });
  },

  async submitOtp(code) {
    const btn = document.getElementById('verifyOtpBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Verificando...';
    }
    try {
      await this.verifyCode(this.pendingEmailForVerification, code);
    } catch (_) {}
    finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Validar Código';
      }
    }
  }
};

window.AuthManager = AuthManager;
