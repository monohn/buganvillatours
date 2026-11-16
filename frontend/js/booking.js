/**
 * ============================================================================
 * BOOKING WIZARD & MULTI-CURRENCY PAYMENT ENGINE - BUGANVILLA TOURS E.I.R.L.
 * Steps:
 * 1. Fecha y Participantes
 * 2. Datos del Viajero
 * 3. Resumen y Confirmación
 * 4. Pasarela de Pagos Multimoneda (Yape, Plin, Tarjeta, PayPal, Transferencia BCP)
 * 5. Voucher Oficial y Enlace Directo a WhatsApp (+51 956 623 396)
 * ============================================================================
 */

const BookingWizard = {
  currentStep: 1,
  selectedTour: null,
  activeBooking: null,
  paymentMethod: 'yape',
  pendingBookingAction: null,

  init() {
    this.bindStepNavigation();
    this.bindPaymentSelectors();
    this.bindFormHandlers();
    this.listenCurrencyChanges();
    this.setDefaultDates();
  },

  setDefaultDates() {
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      dateInput.min = `${yyyy}-${mm}-${dd}`;
      dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
  },

  listenCurrencyChanges() {
    window.addEventListener('currencyChanged', () => {
      this.updateStepPricing();
    });
  },

  async startBooking(tourId) {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/tours/${tourId}`);
      if (!res.ok) throw new Error('No se pudo cargar el paquete seleccionado');
      const json = await res.json();
      const tour = json.data || json;
      this.selectedTour = tour;

      // Update UI with tour details
      this.renderTourSelection();
      this.goToStep(1);

      // Pre-fill user data if authenticated
      if (AuthManager.isAuthenticated()) {
        const user = AuthManager.getUser();
        if (user) {
          const nameInput = document.getElementById('travLeadName');
          const emailInput = document.getElementById('travEmail');
          const phoneInput = document.getElementById('travPhone');
          if (nameInput && !nameInput.value) nameInput.value = user.name;
          if (emailInput && !emailInput.value) emailInput.value = user.email;
          if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
        }
      }

      // Scroll to wizard
      window.location.hash = '#booking';
      const wizardEl = document.getElementById('bookingWizardSection');
      if (wizardEl) {
        wizardEl.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  },

  renderTourSelection() {
    if (!this.selectedTour) return;
    const tour = this.selectedTour;

    const titleEl = document.getElementById('wizardTourTitle');
    const descEl = document.getElementById('wizardTourDesc');
    const badgeEl = document.getElementById('wizardTourBadge');
    const imgEl = document.getElementById('wizardTourImg');

    if (titleEl) titleEl.textContent = tour.name;
    if (descEl) descEl.textContent = tour.short_description || tour.description;
    if (badgeEl) badgeEl.textContent = tour.duration || `${tour.duration_hours || 3} horas`;
    if (imgEl && tour.image_url) {
      imgEl.src = tour.image_url;
      imgEl.alt = tour.name;
    }

    this.updateStepPricing();
  },

  updateStepPricing() {
    if (!this.selectedTour) return;
    const tour = this.selectedTour;
    const paxCount = parseInt(document.getElementById('bookingPax')?.value || '1', 10);
    const curr = CurrencyManager.getCurrent();

    // Use price_pen base
    const basePen = tour.price_pen || tour.price || 85.0;
    const unitPrice = CurrencyManager.convertFromPEN(basePen, curr.code);
    const totalPrice = unitPrice * paxCount;

    // Update labels in step 1, 3, and 4
    const unitPriceEl = document.getElementById('wizardUnitPrice');
    const totalPriceEl = document.getElementById('wizardTotalPrice');
    const summaryTourEl = document.getElementById('summaryTourName');
    const summaryPaxEl = document.getElementById('summaryPaxCount');
    const summaryDateEl = document.getElementById('summaryTourDate');
    const summaryTotalEl = document.getElementById('summaryTotalAmount');
    const payAmountBadge = document.getElementById('payAmountBadge');

    if (unitPriceEl) unitPriceEl.textContent = CurrencyManager.format(unitPrice, curr.code);
    if (totalPriceEl) totalPriceEl.textContent = CurrencyManager.format(totalPrice, curr.code);
    if (summaryTourEl) summaryTourEl.textContent = tour.name;
    if (summaryPaxEl) summaryPaxEl.textContent = `${paxCount} pasajero(s)`;
    if (summaryDateEl) summaryDateEl.textContent = document.getElementById('bookingDate')?.value || '-';
    if (summaryTotalEl) summaryTotalEl.textContent = CurrencyManager.format(totalPrice, curr.code);
    if (payAmountBadge) payAmountBadge.textContent = CurrencyManager.format(totalPrice, curr.code);

    // Update Yape / Plin equivalent note if foreign currency
    const yapeNote = document.getElementById('yapeCurrencyNote');
    if (yapeNote) {
      if (curr.code !== 'PEN') {
        const penEq = (basePen * paxCount).toFixed(2);
        yapeNote.textContent = `Equivalente en Soles: S/. ${penEq} (Tipo de cambio referencial)`;
        yapeNote.style.display = 'block';
      } else {
        yapeNote.style.display = 'none';
      }
    }
  },

  goToStep(step) {
    if (step > this.currentStep) {
      if (!this.validateStep(this.currentStep)) return;
    }

    this.currentStep = step;

    // Update Step Track indicators
    document.querySelectorAll('.wizard-steps-track .step-node').forEach((node, idx) => {
      const stepIdx = idx + 1;
      node.classList.remove('active', 'completed');
      if (stepIdx === step) {
        node.classList.add('active');
      } else if (stepIdx < step) {
        node.classList.add('completed');
      }
    });

    // Toggle Step Panels
    document.querySelectorAll('.wizard-step-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    const activePanel = document.getElementById(`wizardStep${step}`);
    if (activePanel) {
      activePanel.classList.add('active');
    }

    if (step === 3 || step === 4) {
      this.updateStepPricing();
    }

    const wizardEl = document.getElementById('bookingWizardSection');
    if (wizardEl) {
      wizardEl.scrollIntoView({ behavior: 'smooth' });
    }
  },

  validateStep(step) {
    if (!this.selectedTour) {
      showNotification('Seleccione un paquete turístico del catálogo antes de continuar', 'warning');
      return false;
    }

    if (step === 1) {
      const date = document.getElementById('bookingDate')?.value;
      const pax = parseInt(document.getElementById('bookingPax')?.value || '0', 10);
      if (!date) {
        showNotification('Seleccione la fecha de su viaje', 'warning');
        return false;
      }
      if (pax < 1 || pax > 25) {
        showNotification('El número de personas debe ser entre 1 y 25', 'warning');
        return false;
      }
      return true;
    }

    if (step === 2) {
      const name = document.getElementById('travLeadName')?.value.trim();
      const email = document.getElementById('travEmail')?.value.trim();
      const phone = document.getElementById('travPhone')?.value.trim();
      const docNum = document.getElementById('travDocNum')?.value.trim();

      if (!name || !email || !phone || !docNum) {
        showNotification('Por favor complete todos los datos obligatorios del viajero', 'warning');
        return false;
      }
      return true;
    }

    if (step === 3) {
      const termsAccepted = document.getElementById('acceptTermsCheckbox')?.checked;
      if (!termsAccepted) {
        showNotification('Debe aceptar las políticas de reserva y términos de servicio', 'warning');
        return false;
      }
      return true;
    }

    return true;
  },

  async submitBookingCreation() {
    if (!AuthManager.isAuthenticated()) {
      showNotification('Por favor inicie sesión o regístrese para continuar con su reserva', 'info');
      this.pendingBookingAction = () => this.submitBookingCreation();
      AuthManager.openAuthModal('login');
      return;
    }

    const paxCount = parseInt(document.getElementById('bookingPax').value, 10);
    const curr = CurrencyManager.getCurrent();
    const tourDate = document.getElementById('bookingDate').value;
    const hotelPickup = document.getElementById('travPickupAddress')?.value.trim() || 'A coordinar con Buganvilla Tours';
    const notes = document.getElementById('travNotes')?.value.trim() || '';

    const payload = {
      package_id: this.selectedTour.id,
      booking_date: tourDate,
      travelers: paxCount,
      titular_name: document.getElementById('travLeadName')?.value.trim(),
      titular_doc: `${document.getElementById('travDocType')?.value || 'DNI'}: ${document.getElementById('travDocNum')?.value.trim()}`,
      titular_phone: document.getElementById('travPhone')?.value.trim(),
      titular_email: document.getElementById('travEmail')?.value.trim(),
      hotel_pickup: hotelPickup,
      notes: notes,
      currency: curr.code
    };

    const submitBtn = document.getElementById('step3ConfirmBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creando reserva...';
    }

    try {
      const res = await fetch(`${CONFIG.API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AuthManager.getToken()}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la reserva');
      }

      this.activeBooking = data.data || data.booking || data;
      showNotification('Reserva pre-confirmada. Seleccione su medio de pago preferido.', 'success');
      this.goToStep(4);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Proceder al Pago Seguro →';
      }
    }
  },

  bindPaymentSelectors() {
    const methodTabs = document.querySelectorAll('.payment-method-tab');
    methodTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        methodTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const method = tab.getAttribute('data-method');
        this.paymentMethod = method;

        // Switch panels
        document.querySelectorAll('.payment-tab-content').forEach(c => c.style.display = 'none');
        const activeContent = document.getElementById(`payContent_${method}`);
        if (activeContent) {
          activeContent.style.display = 'block';
        }
      });
    });
  },

  async processPayment() {
    if (!this.activeBooking) {
      showNotification('No se encontró una reserva activa para procesar el pago', 'error');
      return;
    }

    const curr = CurrencyManager.getCurrent();
    const refCode = this.activeBooking.reference_code || this.activeBooking.code;
    let paymentDetails = {
      reference_code: refCode,
      method: this.paymentMethod,
      currency: curr.code
    };

    // Validate per method
    if (this.paymentMethod === 'yape' || this.paymentMethod === 'plin') {
      const opCode = document.getElementById(`${this.paymentMethod}OpCode`)?.value.trim();
      if (!opCode) {
        showNotification(`Ingrese el código o número de operación de su ${this.paymentMethod.toUpperCase()}`, 'warning');
        return;
      }
      paymentDetails.operation_code = opCode;
    } else if (this.paymentMethod === 'tarjeta') {
      const cardNum = document.getElementById('cardNum')?.value.replace(/\s+/g, '');
      const cardExp = document.getElementById('cardExp')?.value.trim();
      const cardCvv = document.getElementById('cardCvv')?.value.trim();
      const cardHolder = document.getElementById('cardHolder')?.value.trim();

      if (!cardNum || cardNum.length < 15 || !cardExp || !cardCvv || !cardHolder) {
        showNotification('Complete todos los datos requeridos de su tarjeta', 'warning');
        return;
      }
      paymentDetails.card_holder = cardHolder;
      paymentDetails.card_last4 = cardNum.slice(-4);
      paymentDetails.card_brand = cardNum.startsWith('4') ? 'Visa' : 'Mastercard';
    } else if (this.paymentMethod === 'paypal') {
      const paypalEmail = document.getElementById('paypalAccountEmail')?.value.trim();
      if (!paypalEmail) {
        showNotification('Ingrese la cuenta de correo asociada a su PayPal', 'warning');
        return;
      }
      paymentDetails.paypal_email = paypalEmail;
    } else if (this.paymentMethod === 'transferencia') {
      const bcpOp = document.getElementById('bcpOpCode')?.value.trim();
      if (!bcpOp) {
        showNotification('Ingrese el número de constancia o comprobante BCP', 'warning');
        return;
      }
      paymentDetails.bcp_operation = bcpOp;
    }

    const submitBtn = document.getElementById('confirmPaymentBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Procesando pago seguro...';
    }

    try {
      const res = await fetch(`${CONFIG.API_BASE}/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AuthManager.getToken()}`
        },
        body: JSON.stringify(paymentDetails)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error durante la pasarela de pago');
      }

      showNotification('¡Pago procesado exitosamente! Reserva 100% confirmada.', 'success');
      this.renderVoucher(data.voucher || data);
      this.goToStep(5);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirmar y Pagar';
      }
    }
  },

  renderVoucher(voucher) {
    const vCodeEl = document.getElementById('vCode');
    const vTourNameEl = document.getElementById('vTourName');
    const vDateEl = document.getElementById('vDate');
    const vPaxEl = document.getElementById('vPax');
    const vPickupEl = document.getElementById('vPickup');
    const vLeadEl = document.getElementById('vLeadName');
    const vTotalEl = document.getElementById('vTotal');
    const vStatusEl = document.getElementById('vStatus');
    const vMethodEl = document.getElementById('vMethod');
    const vWhatsBtn = document.getElementById('vWhatsAppShareBtn');

    const ref = voucher.reference_code || voucher.code || this.activeBooking?.reference_code || 'BGN-CONFIRMED';
    const tourName = voucher.tour?.name || this.selectedTour?.name || 'Tour en Ica';
    const tourDate = voucher.booking_details?.tour_date || document.getElementById('bookingDate')?.value || '-';
    const pax = voucher.booking_details?.travelers || document.getElementById('bookingPax')?.value || '1';
    const pickup = voucher.traveler?.hotel_pickup || this.activeBooking?.hotel_pickup || 'Plaza de Armas / Hotel en Ica';
    const lead = voucher.traveler?.titular_name || AuthManager.getUser()?.name || 'Viajero';
    const total = voucher.payment_details?.amount_paid || voucher.booking_details?.total_amount || document.getElementById('summaryTotalAmount')?.textContent || '-';
    const method = (voucher.payment_details?.method || this.paymentMethod).toUpperCase();

    if (vCodeEl) vCodeEl.textContent = ref;
    if (vTourNameEl) vTourNameEl.textContent = tourName;
    if (vDateEl) vDateEl.textContent = tourDate;
    if (vPaxEl) vPaxEl.textContent = `${pax} persona(s)`;
    if (vPickupEl) vPickupEl.textContent = pickup;
    if (vLeadEl) vLeadEl.textContent = lead;
    if (vTotalEl) vTotalEl.textContent = total;
    if (vStatusEl) {
      vStatusEl.textContent = 'CONFIRMADO';
      vStatusEl.className = 'badge badge-teal';
    }
    if (vMethodEl) vMethodEl.textContent = method;

    // Direct WhatsApp share button
    if (vWhatsBtn) {
      if (voucher.company?.whatsapp_url) {
        vWhatsBtn.href = voucher.company.whatsapp_url;
      } else {
        const msg = `¡Hola Buganvilla Tours!\n` +
                    `Acabo de confirmar mi reserva directa en su página web:\n` +
                    `*Código de Reserva:* ${ref}\n` +
                    `*Tour:* ${tourName}\n` +
                    `*Fecha:* ${tourDate}\n` +
                    `*Pasajeros:* ${pax}\n` +
                    `*Monto:* ${total}\n` +
                    `*Método de Pago:* ${method}\n\n` +
                    `Por favor confirmarme los detalles de recojo. Muchas gracias.`;
        vWhatsBtn.href = buildWhatsAppLink(msg);
      }
      vWhatsBtn.target = '_blank';
    }
  },

  bindFormHandlers() {
    const paxInput = document.getElementById('bookingPax');
    if (paxInput) {
      paxInput.addEventListener('input', () => this.updateStepPricing());
    }

    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
      dateInput.addEventListener('change', () => this.updateStepPricing());
    }

    // Step 1 Next
    const step1Next = document.getElementById('step1NextBtn');
    if (step1Next) {
      step1Next.addEventListener('click', () => this.goToStep(2));
    }

    // Step 2 Prev & Next
    const step2Prev = document.getElementById('step2PrevBtn');
    if (step2Prev) {
      step2Prev.addEventListener('click', () => this.goToStep(1));
    }
    const step2Next = document.getElementById('step2NextBtn');
    if (step2Next) {
      step2Next.addEventListener('click', () => this.goToStep(3));
    }

    // Step 3 Prev & Submit (Crear Reserva)
    const step3Prev = document.getElementById('step3PrevBtn');
    if (step3Prev) {
      step3Prev.addEventListener('click', () => this.goToStep(2));
    }
    const step3Submit = document.getElementById('step3ConfirmBtn');
    if (step3Submit) {
      step3Submit.addEventListener('click', () => this.submitBookingCreation());
    }

    // Step 4 Prev & Confirm Payment
    const step4Prev = document.getElementById('step4PrevBtn');
    if (step4Prev) {
      step4Prev.addEventListener('click', () => this.goToStep(3));
    }
    const step4Pay = document.getElementById('confirmPaymentBtn');
    if (step4Pay) {
      step4Pay.addEventListener('click', () => this.processPayment());
    }

    // Step 5 Print Voucher
    const printBtn = document.getElementById('printVoucherBtn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }
};

window.BookingWizard = BookingWizard;
