/**
 * ============================================================================
 * MULTI-CURRENCY ENGINE - BUGANVILLA TOURS E.I.R.L.
 * Supports: Soles (PEN S/.), Dólares Americanos (USD $), Euros (EUR €)
 * ============================================================================
 */

const CurrencyManager = {
  activeCurrency: localStorage.getItem('buganvilla_currency') || 'PEN',
  rates: {
    PEN: 1.0,
    USD: 0.2667,
    EUR: 0.2469
  },

  async init() {
    this.bindDropdown();
    await this.fetchLiveRates();
    this.updateSelectorUI();
  },

  async fetchLiveRates() {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/info/currencies`);
      if (res.ok) {
        const data = await res.json();
        if (data.rates) {
          this.rates.PEN = data.rates.PEN?.rate || 1.0;
          this.rates.USD = data.rates.USD?.rate || 0.2667;
          this.rates.EUR = data.rates.EUR?.rate || 0.2469;
        }
      }
    } catch (e) {
      console.warn('Usando tasas de cambio locales de contingencia:', e.message);
    }
  },

  getCurrent() {
    const meta = CONFIG.CURRENCIES[this.activeCurrency] || CONFIG.CURRENCIES.PEN;
    return {
      ...meta,
      rate: this.rates[this.activeCurrency] || meta.rate
    };
  },

  setCurrency(code) {
    if (!CONFIG.CURRENCIES[code]) return;
    this.activeCurrency = code;
    localStorage.setItem('buganvilla_currency', code);
    this.updateSelectorUI();

    // Notify all app listeners
    window.dispatchEvent(new CustomEvent('currencyChanged', {
      detail: {
        currency: code,
        symbol: CONFIG.CURRENCIES[code].symbol,
        rate: this.rates[code]
      }
    }));

    showNotification(`Moneda actualizada a ${CONFIG.CURRENCIES[code].name} (${CONFIG.CURRENCIES[code].symbol})`, 'info');
  },

  format(amount, code = null) {
    const currCode = code || this.activeCurrency;
    const curr = CONFIG.CURRENCIES[currCode] || CONFIG.CURRENCIES.PEN;
    const num = Number(amount) || 0;
    return `${curr.symbol} ${num.toFixed(2)}`;
  },

  convertFromPEN(penAmount, targetCode = null) {
    const code = targetCode || this.activeCurrency;
    if (code === 'PEN') return Number(penAmount);
    const rate = this.rates[code] || CONFIG.CURRENCIES[code]?.rate || 1.0;
    return Math.round(Number(penAmount) * rate * 100) / 100;
  },

  bindDropdown() {
    const btn = document.getElementById('currencySelectBtn');
    const menu = document.getElementById('currencyDropdown');
    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      menu.classList.remove('active');
    });

    // Options inside dropdown
    menu.querySelectorAll('.currency-opt-btn').forEach(opt => {
      opt.addEventListener('click', (e) => {
        const code = opt.getAttribute('data-currency');
        this.setCurrency(code);
        menu.classList.remove('active');
      });
    });
  },

  updateSelectorUI() {
    const cur = this.getCurrent();
    const flagEl = document.getElementById('curFlag');
    const codeEl = document.getElementById('curCode');
    const symbolEl = document.getElementById('curSymbol');

    if (flagEl) flagEl.textContent = cur.flag;
    if (codeEl) codeEl.textContent = cur.code;
    if (symbolEl) symbolEl.textContent = cur.symbol;

    // Highlight active option in menu
    document.querySelectorAll('.currency-opt-btn').forEach(opt => {
      if (opt.getAttribute('data-currency') === this.activeCurrency) {
        opt.classList.add('selected');
      } else {
        opt.classList.remove('selected');
      }
    });
  }
};

window.CurrencyManager = CurrencyManager;
