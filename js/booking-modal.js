document.addEventListener('DOMContentLoaded', () => {
    // 1. Data Structure for Services (Sample Prices)
    const servicesData = [
        { id: 's1', name: 'Corte Clássico / Tesoura', price: 50 },
        { id: 's2', name: 'Skin Fade / Degradê', price: 60 },
        { id: 's3', name: 'Corte + Aparagem de Barba', price: 80 },
        { id: 's4', name: 'Corte + Barba com Degradê', price: 90 },
        { id: 's5', name: 'Limpeza de Sobrancelha', price: 20 },
        { id: 's6', name: 'Wolf Cut / Corte Repicado', price: 70 },
    ];

    // State
    let state = {
        selectedServices: [],
        date: null,
        time: null,
        customerName: null,
        customerPhone: null,
        customerEmail: null,
        payment: null
    };

    // Modal elements (will be injected into DOM)
    createModalDOM();
    
    const overlay = document.getElementById('booking-modal-overlay');
    const closeBtn = document.getElementById('booking-modal-close');
    const phase1 = document.getElementById('phase-1');
    const phase2 = document.getElementById('phase-2');
    const phase2b = document.getElementById('phase-2b');
    const phase3 = document.getElementById('phase-3');
    const phase4 = document.getElementById('phase-4'); // Success phase

    // Buttons
    const btnContinue1 = document.getElementById('btn-continue-1');
    const btnContinue2 = document.getElementById('btn-continue-2');
    const btnContinue2b = document.getElementById('btn-continue-2b');
    const btnConfirm = document.getElementById('btn-confirm');
    const btnBack2 = document.getElementById('btn-back-2');
    const btnBack2b = document.getElementById('btn-back-2b');
    const btnBack3 = document.getElementById('btn-back-3');

    // Lists
    const servicesList = document.getElementById('services-list');
    const timeSlotsList = document.getElementById('time-slots');
    
    // 2. Intercept "Agendar Agora" clicks
    const scheduleButtons = document.querySelectorAll('a[href="agendamento/"], a[href*="squareup.com"], .lomax-action, .elementor-button-text');
    
    scheduleButtons.forEach(btn => {
        // If it's inside a link, target the link instead, or if it's the link itself
        let targetElement = btn;
        if(btn.tagName === 'SPAN') {
             const parentLink = btn.closest('a');
             if(parentLink) targetElement = parentLink;
             else if (btn.textContent.includes('Agendar Agora')) targetElement = btn;
        }

        if (targetElement.textContent.includes('Agendar Agora') || targetElement.href) {
            targetElement.addEventListener('click', (e) => {
                e.preventDefault();
                openModal();
            });
        }
    });

    // 3. Functions
    function openModal() {
        // Reset state
        state = { selectedServices: [], date: null, time: null, customerName: null, customerPhone: null, customerEmail: null, payment: null };
        renderServices();
        goToPhase(1);
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeModal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    function goToPhase(phaseNum) {
        phase1.classList.remove('active');
        phase2.classList.remove('active');
        phase2b.classList.remove('active');
        phase3.classList.remove('active');
        phase4.classList.remove('active');

        if (phaseNum === 1) phase1.classList.add('active');
        if (phaseNum === 2) {
            renderCalendar();
            phase2.classList.add('active');
        }
        if (phaseNum === '2b') {
            phase2b.classList.add('active');
        }
        if (phaseNum === 3) {
            renderSummary();
            phase3.classList.add('active');
        }
        if (phaseNum === 4) phase4.classList.add('active');
    }

    // --- Phase 1: Services ---
    function renderServices() {
        servicesList.innerHTML = '';
        servicesData.forEach(service => {
            const li = document.createElement('li');
            li.className = 'booking-option';
            li.innerHTML = `
                <span class="option-name">${service.name}</span>
                <span class="option-price">R$ ${service.price.toFixed(2)}</span>
            `;
            li.addEventListener('click', () => {
                li.classList.toggle('selected');
                const idx = state.selectedServices.findIndex(s => s.id === service.id);
                if (idx > -1) {
                    state.selectedServices.splice(idx, 1);
                } else {
                    state.selectedServices.push(service);
                }
                btnContinue1.disabled = state.selectedServices.length === 0;
            });
            servicesList.appendChild(li);
        });
        btnContinue1.disabled = true;
    }

    btnContinue1.addEventListener('click', () => goToPhase(2));

    // --- Phase 2: Date & Time ---
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    function renderCalendar() {
        const monthYear = document.getElementById('calendar-month');
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';
        timeSlotsList.innerHTML = '';
        btnContinue2.disabled = true;

        const date = new Date(currentYear, currentMonth, 1);
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;

        const firstDayIndex = date.getDay();
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        const today = new Date();
        today.setHours(0,0,0,0);

        // Blank days
        for (let i = 0; i < firstDayIndex; i++) {
            const div = document.createElement('div');
            grid.appendChild(div);
        }

        // Days
        for (let i = 1; i <= lastDay; i++) {
            const div = document.createElement('div');
            div.className = 'calendar-day';
            div.textContent = i;
            
            const cellDate = new Date(currentYear, currentMonth, i);
            
            if (cellDate < today) {
                div.classList.add('disabled');
            } else {
                div.addEventListener('click', () => {
                    document.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
                    div.classList.add('selected');
                    state.date = `${i} de ${monthNames[currentMonth]}`;
                    renderTimeSlots();
                });
            }
            grid.appendChild(div);
        }
    }

    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar();
    });
    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar();
    });

    function renderTimeSlots() {
        timeSlotsList.innerHTML = '';
        const times = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        state.time = null;
        btnContinue2.disabled = true;

        times.forEach(t => {
            const div = document.createElement('div');
            div.className = 'time-slot';
            div.textContent = t;
            div.addEventListener('click', () => {
                document.querySelectorAll('.time-slot.selected').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                state.time = t;
                btnContinue2.disabled = false;
            });
            timeSlotsList.appendChild(div);
        });
    }

    btnContinue2.addEventListener('click', () => goToPhase('2b'));
    btnBack2.addEventListener('click', () => goToPhase(1));

    // --- Phase 2b: Customer Info ---
    function validateCustomerForm() {
        const name = document.getElementById('customer-name').value.trim();
        const phone = document.getElementById('customer-phone').value.trim();
        const email = document.getElementById('customer-email').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        btnContinue2b.disabled = !(name.length > 0 && phone.length >= 8 && emailRegex.test(email));
    }

    document.addEventListener('input', (e) => {
        if (['customer-name', 'customer-phone', 'customer-email'].includes(e.target.id)) {
            validateCustomerForm();
        }
    });

    btnContinue2b.addEventListener('click', () => {
        state.customerName = document.getElementById('customer-name').value.trim();
        state.customerPhone = document.getElementById('customer-phone').value.trim();
        state.customerEmail = document.getElementById('customer-email').value.trim();
        goToPhase(3);
    });
    btnBack2b.addEventListener('click', () => goToPhase(2));

    // --- Phase 3: Payment ---
    const paymentOptions = document.getElementById('payment-options');

    function renderSummary() {
        const total = state.selectedServices.reduce((sum, s) => sum + s.price, 0);
        document.getElementById('summary-services').innerHTML = state.selectedServices.map(s => 
            `<div class="summary-row"><span>${s.name}</span><span>R$ ${s.price.toFixed(2)}</span></div>`
        ).join('');
        document.getElementById('summary-datetime').innerHTML = `
            <div class="summary-row"><span>Data &amp; Hora</span><span>${state.date} às ${state.time}</span></div>
        `;
        document.getElementById('summary-customer').innerHTML = `
            <div class="summary-row"><span>Nome</span><span>${state.customerName}</span></div>
            <div class="summary-row"><span>Telefone</span><span>${state.customerPhone}</span></div>
            <div class="summary-row"><span>E-mail</span><span>${state.customerEmail}</span></div>
        `;
        document.getElementById('summary-total').innerHTML = `
            <div class="summary-row total"><span>Total</span><span>R$ ${total.toFixed(2)}</span></div>
        `;

        // Payment setup
        paymentOptions.innerHTML = `
            <li class="booking-option" data-pay="pix">
                <span class="option-name">PIX</span>
            </li>
            <li class="booking-option" data-pay="local">
                <span class="option-name">Pagamento no Local</span>
            </li>
        `;

        state.payment = null;
        btnConfirm.disabled = true;

        Array.from(paymentOptions.children).forEach(li => {
            li.addEventListener('click', () => {
                Array.from(paymentOptions.children).forEach(el => el.classList.remove('selected'));
                li.classList.add('selected');
                state.payment = li.getAttribute('data-pay');
                btnConfirm.disabled = false;
            });
        });
    }

    btnBack3.addEventListener('click', () => goToPhase(2));
    
    btnConfirm.addEventListener('click', () => {
        // Here you would normally send data to a backend.
        goToPhase(4);
    });

    document.getElementById('btn-close-final').addEventListener('click', closeModal);

    // --- Create Modal DOM ---
    function createModalDOM() {
        const overlayDiv = document.createElement('div');
        overlayDiv.id = 'booking-modal-overlay';
        overlayDiv.className = 'booking-modal-overlay';
        
        overlayDiv.innerHTML = `
            <div class="booking-modal">
                <button id="booking-modal-close" class="booking-modal-close">×</button>
                <div class="booking-modal-content">
                    
                    <!-- Phase 1 -->
                    <div id="phase-1" class="booking-phase active">
                        <h2>Escolha o Serviço</h2>
                        <p class="subtitle">Selecione um ou mais serviços</p>
                        <ul id="services-list" class="booking-options"></ul>
                        <div class="booking-footer">
                            <button id="btn-continue-1" class="btn-booking btn-black" disabled>Continuar</button>
                        </div>
                    </div>

                    <!-- Phase 2 -->
                    <div id="phase-2" class="booking-phase">
                        <h2>Data e Hora</h2>
                        <p class="subtitle">Quando você gostaria de agendar?</p>
                        
                        <div class="calendar-container">
                            <div class="calendar-header">
                                <button id="prev-month">&lt;</button>
                                <span id="calendar-month" style="font-weight: 600;"></span>
                                <button id="next-month">&gt;</button>
                            </div>
                            <div class="calendar-grid">
                                <div class="calendar-day-header">D</div>
                                <div class="calendar-day-header">S</div>
                                <div class="calendar-day-header">T</div>
                                <div class="calendar-day-header">Q</div>
                                <div class="calendar-day-header">Q</div>
                                <div class="calendar-day-header">S</div>
                                <div class="calendar-day-header">S</div>
                            </div>
                            <div id="calendar-grid" class="calendar-grid"></div>
                        </div>

                        <div id="time-slots" class="time-slots"></div>

                        <div class="booking-footer">
                            <button id="btn-back-2" class="btn-booking btn-outline">Voltar</button>
                            <button id="btn-continue-2" class="btn-booking btn-black" disabled>Continuar</button>
                        </div>
                    </div>

                    <!-- Phase 2b: Customer Info -->
                    <div id="phase-2b" class="booking-phase">
                        <h2>Seus Dados</h2>
                        <p class="subtitle">Preencha suas informações de contato</p>

                        <div class="customer-form">
                            <div class="form-group">
                                <label for="customer-name">Nome completo</label>
                                <div class="input-wrapper">
                                    <span class="input-icon">👤</span>
                                    <input type="text" id="customer-name" placeholder="Seu nome" autocomplete="name" />
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="customer-phone">Número de telefone</label>
                                <div class="input-wrapper">
                                    <span class="input-icon">📱</span>
                                    <input type="tel" id="customer-phone" placeholder="(11) 99999-9999" autocomplete="tel" />
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="customer-email">E-mail</label>
                                <div class="input-wrapper">
                                    <span class="input-icon">✉️</span>
                                    <input type="email" id="customer-email" placeholder="seu@email.com" autocomplete="email" />
                                </div>
                            </div>
                        </div>

                        <div class="booking-footer">
                            <button id="btn-back-2b" class="btn-booking btn-outline">Voltar</button>
                            <button id="btn-continue-2b" class="btn-booking btn-black" disabled>Continuar</button>
                        </div>
                    </div>

                    <!-- Phase 3 -->
                    <div id="phase-3" class="booking-phase">
                        <h2>Pagamento</h2>
                        <p class="subtitle">Confirme seu agendamento</p>
                        
                        <div class="booking-summary">
                            <div id="summary-services"></div>
                            <div id="summary-datetime" style="margin-top: 8px;"></div>
                            <div id="summary-customer" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #eaeaea;"></div>
                            <div id="summary-total"></div>
                        </div>

                        <h3 style="font-size: 1rem; margin-bottom: 12px;">Forma de Pagamento</h3>
                        <ul id="payment-options" class="booking-options"></ul>

                        <div class="booking-footer">
                            <button id="btn-back-3" class="btn-booking btn-outline">Voltar</button>
                            <button id="btn-confirm" class="btn-booking btn-black" disabled>Confirmar</button>
                        </div>
                    </div>

                    <!-- Phase 4 (Success) -->
                    <div id="phase-4" class="booking-phase" style="text-align: center; padding-top: 20px;">
                        <div class="success-checkmark">✓</div>
                        <h2>Agendamento Confirmado!</h2>
                        <p class="subtitle">Te esperamos na barbearia no dia e horário escolhidos. Em breve entraremos em contato!</p>
                        <div class="booking-footer" style="margin-top: 40px;">
                            <button id="btn-close-final" class="btn-booking btn-black">Concluir</button>
                        </div>
                    </div>

                </div>
            </div>
        `;
        document.body.appendChild(overlayDiv);
    }
});
