// Data Manager
const DataManager = {
    save: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    load: (key) => JSON.parse(localStorage.getItem(key)),

    // User Management
    setCurrentUser: (user) => localStorage.setItem('currentUser', user),
    getCurrentUser: () => localStorage.getItem('currentUser') || 'kyungmin', // Default to KM

    // Cycle Data (Shared or KM specific)
    getCycleData: () => {
        const data = DataManager.load('cycleData');
        return data || { lastPeriod: '2025-12-01', cycleLength: 28 };
    },
    saveCycleData: (data) => DataManager.save('cycleData', data),

    // Daily Logs (User Specific)
    saveLog: (dateStr, logData) => {
        const user = DataManager.getCurrentUser();
        const logs = DataManager.load(`dailyLogs_${user}`) || {};
        logs[dateStr] = logData;
        DataManager.save(`dailyLogs_${user}`, logs);
    },
    getLog: (user, dateStr) => {
        const logs = DataManager.load(`dailyLogs_${user}`) || {};
        return logs[dateStr];
    },

    // Memories (Shared)
    saveMemory: (memory) => {
        const memories = DataManager.load('memories') || [];
        memories.unshift(memory); // Add to top
        DataManager.save('memories', memories);
    },
    getMemories: () => DataManager.load('memories') || [],

    // Stylist (Shared)
    getCloset: () => DataManager.load('closet') || [],
    addToCloset: (item) => {
        const closet = DataManager.getCloset();
        closet.push(item);
        DataManager.save('closet', closet);
    },
    getWishlist: () => DataManager.load('wishlist') || [],
    addToWishlist: (item) => {
        const list = DataManager.getWishlist();
        list.push(item);
        DataManager.save('wishlist', list);
    },
    updateWishlistStatus: (index, status) => {
        const list = DataManager.getWishlist();
        if (list[index]) list[index].status = status;
        DataManager.save('wishlist', list);
    }
};

// Global State
let currentDate = new Date();
const D_DAY_START = new Date('2025-10-03');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in, if so, skip landing (optional, but for now we show landing)
    // renderCalendar(); // Render on load? No, wait for navigation

    // Initialize Snow & Lights (CSS handles animation, JS just ensures existence)

    // Setup Inputs
    const todayStr = formatDate(new Date());
    document.getElementById('modal-date').innerText = todayStr;

    // Load Settings
    const cycleData = DataManager.getCycleData();
    document.getElementById('setting-last-period').value = cycleData.lastPeriod;
    document.getElementById('setting-cycle-length').value = cycleData.cycleLength;
});

// Navigation
function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.classList.add('hidden');
    });

    const target = document.getElementById(pageId);
    target.classList.remove('hidden');
    target.classList.add('active');

    // Update Bottom Nav
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(pageId)) {
            btn.classList.add('active');
        }
    });

    // Page Specific Init
    if (pageId === 'dashboard') initDashboard();
    if (pageId === 'calendar') renderCalendar();
    if (pageId === 'stylist') loadStylist();
    if (pageId === 'memory') loadMemories();
}

// Login Logic
function login(user) {
    DataManager.setCurrentUser(user);
    navigateTo('dashboard');
}

// Dashboard Logic
function initDashboard() {
    const user = DataManager.getCurrentUser();
    const partner = user === 'kyungmin' ? 'jungwoo' : 'kyungmin';

    // Title
    const userName = user === 'kyungmin' ? '경민요정' : '정우집사';
    document.getElementById('user-name-title').innerText = userName;

    // D-Day
    const diff = Math.floor((new Date() - D_DAY_START) / (1000 * 60 * 60 * 24));
    document.getElementById('d-day-display').innerText = `♥ +${diff}일`;

    // Cycle Calculation
    const cycleData = DataManager.getCycleData();
    const cycleStats = calculateCycle(cycleData.lastPeriod, cycleData.cycleLength);

    // Update Phase Card
    document.getElementById('phase-desc').innerText = cycleStats.message;
    document.getElementById('cycle-day-label').innerText = `${cycleStats.dayOfCycle}일차`;

    // Update Slider
    const sliderWidth = document.querySelector('.cycle-track').offsetWidth || 300; // Fallback
    const position = Math.min(100, (cycleStats.dayOfCycle / cycleData.cycleLength) * 100);
    document.getElementById('cycle-thumb').style.left = `${position}%`;

    // Pregnancy Graph
    drawGaussianGraph(cycleStats.dayOfCycle, cycleData.cycleLength);
    document.getElementById('pregnancy-value').innerText = cycleStats.pregnancyChance;

    // Partner Stats
    const todayStr = formatDate(new Date());
    const partnerLog = DataManager.getLog(partner, todayStr);

    const partnerName = user === 'kyungmin' ? '정우' : '경민';
    document.getElementById('partner-stat-title-1').innerText = `${partnerName} 성욕`;
    document.getElementById('partner-stat-title-2').innerText = `${partnerName} 기분`;

    if (partnerLog) {
        document.getElementById('partner-libido').innerText = getLibidoLabel(partnerLog.libido);
        document.getElementById('partner-mood').innerText = getMoodEmoji(partnerLog.mood);
    } else {
        document.getElementById('partner-libido').innerText = "기록 없음";
        document.getElementById('partner-mood').innerText = "기록 없음";
    }
}

function calculateCycle(lastPeriodStr, cycleLength) {
    const lastPeriod = new Date(lastPeriodStr);
    const today = new Date();
    const diffTime = Math.abs(today - lastPeriod);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const dayOfCycle = (diffDays % cycleLength) || cycleLength;

    let status = 'normal';
    let message = '평온한 일상입니다. 서로의 하루를 공유해보세요.';
    let pregnancyChance = '낮음';

    // Simple Logic
    if (dayOfCycle <= 5) {
        status = 'period';
        message = '그날입니다. 따뜻한 차와 함께 휴식이 필요해요. 🍫';
        pregnancyChance = '매우 낮음';
    } else if (dayOfCycle >= 12 && dayOfCycle <= 16) {
        status = 'fertile';
        message = '가임기입니다. 사랑이 깊어질 수 있는 시간이에요. ❤️';
        pregnancyChance = '높음';
        if (dayOfCycle === 14) {
            status = 'ovulation';
            message = '배란일입니다! 임신 가능성이 가장 높은 날이에요. ✨';
            pregnancyChance = '매우 높음';
        }
    }

    return { dayOfCycle, status, message, pregnancyChance };
}

function drawGaussianGraph(day, length) {
    // Simulate a bell curve peaking at day 14
    const svg = document.getElementById('pregnancy-graph-svg');
    const width = 100;
    const height = 50;

    // Gaussian function: f(x) = a * e^(-(x-b)^2 / 2c^2)
    // Peak at 14 (normalized to 0.5 of width if length is 28)
    const peakX = (14 / length) * width;
    const sigma = 10; // Width of the bell

    let pathD = `M 0 ${height}`;

    for (let x = 0; x <= width; x++) {
        const y = height - (height * 0.9 * Math.exp(-Math.pow(x - peakX, 2) / (2 * Math.pow(sigma, 2))));
        pathD += ` L ${x} ${y}`;
    }

    pathD += ` L ${width} ${height} Z`;

    document.getElementById('graph-path-fill').setAttribute('d', pathD);

    // Line only
    let lineD = "";
    for (let x = 0; x <= width; x++) {
        const y = height - (height * 0.9 * Math.exp(-Math.pow(x - peakX, 2) / (2 * Math.pow(sigma, 2))));
        if (x === 0) lineD += `M ${x} ${y}`;
        else lineD += ` L ${x} ${y}`;
    }
    document.getElementById('graph-path-line').setAttribute('d', lineD);

    // Indicator
    const currentX = (day / length) * width;
    document.getElementById('wave-indicator').style.left = `${currentX}%`;
}

// Daily Log
function openDailyLog(date) {
    document.getElementById('log-modal').classList.remove('hidden');
    document.getElementById('modal-date').innerText = formatDate(date);

    // Reset or Load existing
    const user = DataManager.getCurrentUser();
    const log = DataManager.getLog(user, formatDate(date));

    if (log) {
        document.getElementById('log-libido').value = log.libido;
        document.getElementById('log-note').value = log.note;
        // Set mood
        document.querySelectorAll('#log-mood span').forEach(s => s.classList.remove('selected'));
        const moodSpan = document.querySelector(`#log-mood span[data-value="${log.mood}"]`);
        if (moodSpan) moodSpan.classList.add('selected');
    } else {
        document.getElementById('log-libido').value = 3;
        document.getElementById('log-note').value = '';
        document.querySelectorAll('#log-mood span').forEach(s => s.classList.remove('selected'));
    }
}

function closeModal() {
    document.getElementById('log-modal').classList.add('hidden');
}

// Mood Selector
document.querySelectorAll('#log-mood span').forEach(span => {
    span.addEventListener('click', function () {
        document.querySelectorAll('#log-mood span').forEach(s => s.classList.remove('selected'));
        this.classList.add('selected');
    });
});

function saveDailyLog() {
    const dateStr = document.getElementById('modal-date').innerText;
    const moodEl = document.querySelector('#log-mood span.selected');
    const mood = moodEl ? moodEl.getAttribute('data-value') : 'calm';
    const libido = document.getElementById('log-libido').value;
    const note = document.getElementById('log-note').value;
    // Photo handling would go here (simplified for now)

    const data = { mood, libido, note };
    DataManager.saveLog(dateStr, data);

    closeModal();
    initDashboard(); // Refresh stats
    alert('오늘의 기록이 저장되었습니다! 💖');
}

function getLibidoLabel(val) {
    if (val <= 1) return "낮음 ☁️";
    if (val <= 2) return "보통 🙂";
    if (val <= 3) return "좋음 🔥";
    if (val <= 4) return "높음 🌋";
    return "폭발 💥";
}

function getMoodEmoji(val) {
    const map = { 'happy': '🥰', 'calm': '🙂', 'sad': '😢', 'angry': '😡', 'tired': '🫠' };
    return map[val] || '❓';
}

// Calendar Logic
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    const now = currentDate;
    const year = now.getFullYear();
    const month = now.getMonth();

    document.getElementById('current-month-display').innerText = `${now.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty slots
    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        grid.appendChild(div);
    }

    const cycleData = DataManager.getCycleData();

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.innerText = i;

        // Cycle Highlights
        const cycleStats = calculateCycle(cycleData.lastPeriod, cycleData.cycleLength);
        // Note: This calculates cycle based on TODAY, need to calculate for specific date
        // Simplified: Just highlight based on offset from last period
        const dayDiff = Math.floor((new Date(dateStr) - new Date(cycleData.lastPeriod)) / (1000 * 60 * 60 * 24));
        const dayOfCycle = (dayDiff % cycleData.cycleLength) + 1; // 1-based

        if (dayOfCycle >= 1 && dayOfCycle <= 5) div.classList.add('period');
        if (dayOfCycle >= 12 && dayOfCycle <= 16) div.classList.add('fertile');
        if (dayOfCycle === 14) div.classList.add('ovulation');

        if (i === new Date().getDate() && month === new Date().getMonth()) div.classList.add('today');

        // Check for Memory
        const memories = DataManager.getMemories();
        const memory = memories.find(m => m.date === dateStr);
        if (memory && memory.photo) {
            const img = document.createElement('img');
            img.src = memory.photo;
            img.className = 'calendar-day-img';
            div.appendChild(img);
            div.style.color = 'transparent'; // Hide number if photo exists
        }

        div.onclick = () => openDailyLog(new Date(year, month, i));
        grid.appendChild(div);
    }
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

// Memory Feed Logic
function loadMemories() {
    const feed = document.getElementById('memory-feed');
    feed.innerHTML = '';
    const memories = DataManager.getMemories();

    memories.forEach(mem => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.innerHTML = `
            <div class="memory-header">
                <div class="memory-date">${mem.date}</div>
                <div class="memory-location"><i class="fas fa-map-marker-alt"></i> ${mem.location}</div>
            </div>
            <img src="${mem.photo}" class="memory-img">
            <div class="memory-footer">
                <p class="memory-desc">${mem.desc}</p>
            </div>
        `;
        feed.appendChild(card);
    });
}

function openMemoryModal() {
    document.getElementById('memory-modal').classList.remove('hidden');
    document.getElementById('memory-date').value = formatDate(new Date());
}

function closeMemoryModal() {
    document.getElementById('memory-modal').classList.add('hidden');
}

function saveMemory() {
    const photoInput = document.getElementById('memory-photo');
    const date = document.getElementById('memory-date').value;
    const location = document.getElementById('memory-location').value;
    const desc = document.getElementById('memory-desc').value;

    if (photoInput.files && photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const memory = {
                id: Date.now(),
                photo: e.target.result,
                date: date,
                location: location,
                desc: desc
            };
            DataManager.saveMemory(memory);
            closeMemoryModal();
            loadMemories(); // Refresh feed
        };
        reader.readAsDataURL(photoInput.files[0]);
    } else {
        alert('사진을 선택해주세요!');
    }
}

// Stylist Logic (Simplified)
function loadStylist() {
    const closetGrid = document.getElementById('closet-grid');
    closetGrid.innerHTML = '';
    const closet = DataManager.getCloset();
    closet.forEach(item => {
        const div = document.createElement('div');
        div.className = 'closet-item';
        div.innerHTML = `<img src="${item.img}">`;
        if (item.special) div.innerHTML += `<span class="special-badge">Special</span>`;
        closetGrid.appendChild(div);
    });

    const wishlistContainer = document.getElementById('wishlist-container');
    wishlistContainer.innerHTML = '';
    const wishlist = DataManager.getWishlist();
    wishlist.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'wishlist-item';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <strong>${item.name}</strong>
                <span>${item.status || 'Pending'}</span>
            </div>
            <div class="wishlist-actions">
                <button class="btn-small btn-approve" onclick="updateWishStatus(${index}, 'Approved')">승인</button>
                <button class="btn-small btn-reject" onclick="updateWishStatus(${index}, 'Rejected')">거절</button>
                <button class="btn-small btn-hold" onclick="updateWishStatus(${index}, 'Hold')">보류</button>
            </div>
        `;
        wishlistContainer.appendChild(div);
    });
}

function addToCloset(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            DataManager.addToCloset({ img: e.target.result, special: false }); // Mock special
            loadStylist();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function addToWishlist() {
    const name = document.getElementById('wishlist-input').value;
    if (name) {
        DataManager.addToWishlist({ name, status: 'Pending' });
        document.getElementById('wishlist-input').value = '';
        loadStylist();
    }
}

function updateWishStatus(index, status) {
    DataManager.updateWishlistStatus(index, status);
    loadStylist();
}

function generateOOTD() {
    const tpo = document.querySelector('#tpo-select .active').getAttribute('data-value');
    const resultDiv = document.getElementById('ootd-result');
    const text = document.getElementById('ootd-text');

    resultDiv.classList.remove('hidden');

    const suggestions = {
        'work': '깔끔한 블레이저에 슬랙스, 그리고 포인트로 스카프 어때요?',
        'date': '로맨틱한 원피스에 코트, 그리고 반짝이는 귀걸이!',
        'casual': '편안한 니트에 청바지, 귀여운 비니로 포인트!'
    };

    text.innerText = suggestions[tpo] || '따뜻하게 입고 나가세요!';
}

// Sommelier Logic
function recommendDate() {
    const resultCard = document.getElementById('recommendation-result');
    resultCard.classList.remove('hidden');
    document.getElementById('result-title').innerText = "🎄 크리스마스 마켓 투어";
    document.getElementById('result-desc').innerText = "잠실 롯데월드몰 크리스마스 마켓에서 따뜻한 뱅쇼 한 잔 어때요?";
}

// Utils
function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function saveSettings() {
    const lastPeriod = document.getElementById('setting-last-period').value;
    const cycleLength = document.getElementById('setting-cycle-length').value;
    if (lastPeriod && cycleLength) {
        DataManager.saveCycleData({ lastPeriod, cycleLength });
        alert('설정이 저장되었습니다.');
        initDashboard();
    }
}

// Event Listeners for Select Options
document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        this.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});
