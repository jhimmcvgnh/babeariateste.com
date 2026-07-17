// --- DATA ---
const SERVICES = [
    {
        id: 'haircut',
        name: 'Corte de cabelo',
        description: 'Qualquer tipo de degradê/afunilamento, corte em tesoura e alinhamento.',
        base_prices: { tony: 45, alex: 60, kong: 90 },
        duration: 40
    },
    {
        id: 'eyebrow',
        name: 'Corte de cabelo + sobrancelhas',
        description: 'Corte de cabelo e sobrancelhas com navalha (sobrancelha única/monocelha podem ser aparadas com pinça para um melhor crescimento).',
        base_prices: { tony: 50, alex: 65, kong: 95 },
        duration: 45
    },
    {
        id: 'beard',
        name: 'Corte de cabelo + barba',
        description: 'Qualquer corte de cabelo + aparar de barba, incluindo contorno/modelagem + limpeza de sobrancelhas (opcional).',
        base_prices: { tony: 60, alex: 75, kong: 105 },
        duration: 50
    },
    {
        id: 'afterhours',
        name: 'Antes/Depois do horário de expediente',
        description: 'Ligue para a barbearia e diga que deseja o serviço de corte "Antes/Depois do Horário Comercial". Cobramos o dobro.',
        base_prices: { tony: 90, alex: 120, kong: 180 },
        duration: 40
    }
];

const STAFF = [
    { id: 'tony', name: 'Tony Ngo', role: 'Barbeiro Sênior', img: 'https://appointments-production-f.squarecdn.com/files/db51fd462dd6c0bb996237af890dda54/original.png' },
    { id: 'alex', name: 'Alex La', role: 'Barbeiro Sênior', img: 'https://appointments-production-f.squarecdn.com/files/ca72fa4ade643e8d49ecca2d5b4d8f12/original.png' },
    { id: 'kong', name: 'Kong Eart', role: 'Barbeiro Master', img: 'https://appointments-production-f.squarecdn.com/files/97f9cb2f4d7fc807814997bc6e8aace9/original.png' }
];

// --- STATE ---
let currentStep = 1;
let selectedServices = [];
let selectedStaff = null;
let selectedDate = null;
let selectedTimeSlot = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    renderServices();
    renderStaff();
    generateCalendarTape();
    updateSummary();
}

// --- RENDERING ---
function renderServices() {
    const list = document.getElementById('serviceList');
    list.innerHTML = SERVICES.map(s => `
        <div class="service-item" onclick="toggleService('${s.id}')">
            <div class="service-main">
                <p class="service-name">${s.name}</p>
                <p class="service-desc">${s.description}</p>
                <p class="service-meta">Preço variável • ${s.duration} min+</p>
            </div>
            <div class="service-status-area">
                ${selectedServices.includes(s.id) ? '<span class="added-label"><i class="fas fa-check"></i> Added</span>' : '<span style="color:#000; font-weight:600; font-size:14px;">Adicionar</span>'}
            </div>
        </div>
    `).join('');
}

function renderStaff() {
    const grid = document.getElementById('staffList');
    grid.innerHTML = STAFF.map(s => `
        <div class="staff-card ${selectedStaff === s.id ? 'selected' : ''}" onclick="selectStaff('${s.id}')">
            <img src="${s.img}" class="staff-img">
            <p class="staff-name">${s.name}</p>
            <p class="staff-role">${s.role}</p>
        </div>
    `).join('');
}

function generateCalendarTape() {
    const tape = document.getElementById('calendarTape');
    const dows = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const today = new Date();
    
    let html = '';
    for(let i = 0; i < 21; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
        const isDisabled = d.getDay() === 1; // Closed Monday
        
        html += `
            <div class="tape-day ${isSelected ? 'active' : ''} ${isDisabled ? 'disabled' : ''}" 
                 onclick="${!isDisabled ? `selectDate(${d.getTime()})` : ''}">
                <span class="tape-dow">${dows[d.getDay()]}</span>
                <span class="tape-dom">${d.getDate()}</span>
            </div>
        `;
    }
    tape.innerHTML = html;
}

function renderTimeSlots() {
    const afternoon = ['14:40', '15:20', '16:00', '16:45'];
    const container = document.getElementById('afternoonSlots');
    container.innerHTML = afternoon.map(t => `
        <button class="slot-pill ${selectedTimeSlot === t ? 'active' : ''}" onclick="selectTime('${t}')">${t}</button>
    `).join('');
}

// --- ACTIONS ---
function toggleService(id) {
    const index = selectedServices.indexOf(id);
    if (index > -1) {
        selectedServices.splice(index, 1);
    } else {
        selectedServices.push(id);
    }
    renderServices();
    updateSummary();
}

function selectStaff(id) {
    selectedStaff = id;
    renderStaff();
    document.getElementById('mainActionBtn').disabled = false;
    updateSummary();
}

function selectDate(ts) {
    selectedDate = new Date(ts);
    generateCalendarTape();
    renderTimeSlots();
    updateSummary();
}

function selectTime(t) {
    selectedTimeSlot = t;
    renderTimeSlots();
    document.getElementById('mainActionBtn').disabled = false;
    updateSummary();
}

// --- SUMMARY LOGIC ---
function updateSummary() {
    const tree = document.getElementById('summaryTree');
    const countText = document.getElementById('serviceCountText');
    const totalText = document.getElementById('totalAndDurationText');
    const avatarStack = document.getElementById('avatarStack');
    
    // Services Count/Total
    countText.innerText = `${selectedServices.length} serviço(s)`;
    
    let total = 0;
    let duration = 0;
    
    tree.innerHTML = selectedServices.map(id => {
        const s = SERVICES.find(sv => sv.id === id);
        const price = selectedStaff ? s.base_prices[selectedStaff] : Math.min(...Object.values(s.base_prices));
        total += price;
        duration += s.duration;
        
        return `
            <div class="tree-node">
                <div class="node-content">
                    <div class="node-main">
                        <span class="node-service">${s.name}</span>
                        <span class="node-staff">${selectedStaff ? 'com ' + STAFF.find(st=>st.id===selectedStaff).name : 'Escolha o profissional'}</span>
                    </div>
                    <span class="node-price">R$ ${price.toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
        `;
    }).join('');

    totalText.innerText = `R$ ${total.toFixed(2).replace('.', ',')} • ${duration} min`;

    // Avatars
    if (selectedStaff) {
        const sObj = STAFF.find(s=>s.id===selectedStaff);
        avatarStack.innerHTML = `<img src="${sObj.img}" class="staff-img" style="width:40px; height:40px; margin:0">`;
    } else {
        avatarStack.innerHTML = `<img src="../images/LoMax-Barbers.png" style="width:40px; height:40px; opacity:0.2;">`;
    }

    // Date/Time Display
    if (selectedDate && selectedTimeSlot) {
        document.getElementById('summaryFooterDate').style.display = 'flex';
        document.getElementById('finalDateStr').innerText = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
        document.getElementById('finalTimeRange').innerText = `${selectedTimeSlot} - ${calculateEndTime(selectedTimeSlot)}`;
    }

    // Button states
    const btn = document.getElementById('mainActionBtn');
    if (currentStep === 1) btn.disabled = selectedServices.length === 0;
    if (currentStep === 2) btn.disabled = !selectedStaff;
    if (currentStep === 3) btn.disabled = !selectedTimeSlot;
}

function calculateEndTime(start) {
    let [h, m] = start.split(':').map(Number);
    let dur = selectedServices.reduce((acc, id) => acc + SERVICES.find(s=>s.id===id).duration, 0);
    m += dur;
    h += Math.floor(m / 60);
    m = m % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// --- NAVIGATION ---
function nextStep() {
    if (currentStep >= 4) {
        finish();
        return;
    }
    
    document.getElementById(`step${currentStep}`).classList.remove('active');
    currentStep++;
    document.getElementById(`step${currentStep}`).classList.add('active');
    
    // Change Button Text if needed
    const btn = document.getElementById('mainActionBtn');
    if(currentStep === 4) btn.innerText = 'Agende uma consulta';
    
    updateSummary();
}

function finish() {
    alert('Agendamento simulado com sucesso!');
    location.href = '../index.html';
}
