/**
 * СТРОЙКОНТРОЛЬ: Главный модуль клиентской логики (SPA)
 */

let currentUser = null;
let selectedUrgency = null;
let stagedPhotos = []; // массив сжатых файлов { file: File, previewUrl: string, originalSize: number, compressedSize: number }

// Состояние фильтров дашборда руководителя
let allApartments = [];
let onlyUrgentActive = false;
let currentApartmentId = null;

// Состояние ленты дефектов
let allFeedDefects = [];
let currentFeedFilter = 'ALL';
let currentSearchQuery = '';

// Состояние календаря
let calendarCurrentYear = new Date().getFullYear();
let calendarCurrentMonth = new Date().getMonth() + 1; // 1-12

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    try {
        const resp = await fetch('/api/auth/me');
        if (!resp.ok) {
            window.location.href = '/login.html';
            return;
        }

        currentUser = await resp.json();
        renderUserInfo();

        if (currentUser.role === 'MANAGER') {
            document.getElementById('managerNav').style.display = 'flex';
            document.getElementById('workerNav').style.display = 'none';
            safeSetDisplay('mNavApartments', 'flex');
            safeSetDisplay('mNavKpi', 'flex');
            switchAppTab('create');
        } else {
            document.getElementById('managerNav').style.display = 'none';
            document.getElementById('workerNav').style.display = 'flex';
            safeSetDisplay('mNavApartments', 'none');
            safeSetDisplay('mNavKpi', 'none');
            const mDefectsLabel = document.querySelector('#mNavDefects span:last-child');
            if (mDefectsLabel) mDefectsLabel.innerText = 'Мои дефекты';
            switchAppTab('create');
        }
    } catch (e) {
        window.location.href = '/login.html';
    }
}

function renderUserInfo() {
    safeSetText('currentUserName', currentUser.fullName);
    safeSetText('currentUserRole', currentUser.role === 'MANAGER' ? 'НАЧАЛЬНИК УЧАСТКА' : 'ПРИЕМЩИК');
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
        window.location.href = '/login.html';
    }
}

/* ==========================================================================
   ЕДИНАЯ НАВИГАЦИЯ И ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК (MOBILE-FIRST)
   ========================================================================== */

function switchAppTab(tab) {
    // 1. Снимаем активный класс со всех кнопок десктопа и мобильной панели
    document.querySelectorAll('.nav-bar .nav-item').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.mobile-bottom-nav .mobile-nav-btn').forEach(btn => btn.classList.remove('active'));

    // 2. Скрываем все разделы
    const views = [
        'defectCreateView',
        'defectsFeedView',
        'managerDashboardView',
        'managerKpiView',
        'managerCalendarView',
        'managerArchiveView',
        'workerMyDefectsView'
    ];
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.style.display = 'none';
    });

    if (tab === 'create') {
        const topBtn = currentUser && currentUser.role === 'MANAGER' ? document.getElementById('tabBtnNewDefect') : document.getElementById('tabWorkerBtnCreate');
        if (topBtn) topBtn.classList.add('active');
        safeAddClass('mNavCreate', 'active');

        safeSetDisplay('defectCreateView', 'block');
        resetDefectForm();
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } else if (tab === 'defects') {
        const topBtn = currentUser && currentUser.role === 'MANAGER' ? document.getElementById('tabBtnDefects') : document.getElementById('tabWorkerBtnDefects');
        if (topBtn) topBtn.classList.add('active');
        safeAddClass('mNavDefects', 'active');

        safeSetDisplay('defectsFeedView', 'block');
        loadDefectsFeed();
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } else if (tab === 'apartments') {
        safeAddClass('tabBtnApartments', 'active');
        safeAddClass('mNavApartments', 'active');

        safeSetDisplay('managerDashboardView', 'block');
        loadDashboardMetrics();
        loadEntrancesFilter();
        loadApartmentsRegistry();
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } else if (tab === 'kpi') {
        safeAddClass('tabBtnKpi', 'active');
        safeAddClass('mNavKpi', 'active');

        safeSetDisplay('managerKpiView', 'block');
        loadEfficiencyMetrics();
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } else if (tab === 'calendar') {
        safeAddClass('tabBtnCalendar', 'active');

        safeSetDisplay('managerCalendarView', 'block');
        loadCalendar();
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } else if (tab === 'archive') {
        safeAddClass('tabBtnArchive', 'active');

        safeSetDisplay('managerArchiveView', 'block');
        loadArchiveRegistry();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Функции для обратной совместимости вызовов из старых обработчиков:
function switchManagerTab(tab) {
    if (tab === 'dashboard') switchAppTab('apartments');
    else if (tab === 'new-defect') switchAppTab('create');
    else switchAppTab(tab);
}

function switchWorkerTab(tab) {
    if (tab === 'my-defects') switchAppTab('defects');
    else switchAppTab(tab);
}

/* ==========================================================================
   ДАШБОРД РУКОВОДИТЕЛЯ
   ========================================================================== */

async function loadDashboardMetrics() {
    try {
        const resp = await fetch('/api/dashboard/metrics');
        if (resp.ok) {
            const m = await resp.json();
            safeSetText('kpiApartmentsInWork', m.apartmentsInWork);
            safeSetText('kpiOpenDefects', m.totalOpenDefects);
            safeSetText('kpiUrgentDefects', m.urgentOpenDefects);
            safeSetText('kpiClosedMonth', m.closedThisMonth);
        }
    } catch (e) {
        console.error('Ошибка загрузки метрик:', e);
    }
}

async function loadEntrancesFilter() {
    try {
        const resp = await fetch('/api/apartments/entrances');
        if (resp.ok) {
            const entrances = await resp.json();
            const sel = document.getElementById('filterEntrance');
            sel.innerHTML = '<option value="">Все подъезды</option>';
            entrances.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e;
                opt.innerText = `Подъезд ${e}`;
                sel.appendChild(opt);
            });
        }
    } catch (e) {
        console.error('Ошибка загрузки подъездов:', e);
    }
}

async function loadApartmentsRegistry() {
    try {
        const resp = await fetch('/api/apartments?archived=false');
        if (resp.ok) {
            allApartments = await resp.json();
            renderApartmentsTable(allApartments);
        }
    } catch (e) {
        console.error('Ошибка загрузки реестра:', e);
    }
}

function applyFilters() {
    const aptNumberStr = document.getElementById('filterAptNumber').value.trim();
    const entranceStr = document.getElementById('filterEntrance').value;
    const statusVal = document.getElementById('filterStatus').value;

    let filtered = allApartments.filter(a => {
        if (aptNumberStr && !a.apartmentNumber.toString().includes(aptNumberStr)) {
            return false;
        }
        if (entranceStr && a.entranceNumber.toString() !== entranceStr) {
            return false;
        }
        if (onlyUrgentActive && a.urgentDefects === 0) {
            return false;
        }
        return true;
    });

    renderApartmentsTable(filtered);
}

function toggleOnlyUrgent() {
    onlyUrgentActive = !onlyUrgentActive;
    const btn = document.getElementById('btnOnlyUrgent');
    if (onlyUrgentActive) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
    applyFilters();
}

function resetFilters() {
    document.getElementById('filterAptNumber').value = '';
    document.getElementById('filterEntrance').value = '';
    document.getElementById('filterStatus').value = '';
    onlyUrgentActive = false;
    document.getElementById('btnOnlyUrgent').classList.remove('active');
    renderApartmentsTable(allApartments);
}

function renderApartmentsTable(apartments) {
    const tbody = document.getElementById('apartmentsTableBody');
    if (!apartments || apartments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    Квартиры по заданным критериям не найдены
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = apartments.map(a => {
        const urgentBadge = a.urgentDefects > 0
            ? `<span class="badge badge-urgent">${a.urgentDefects} СРОЧНО</span>`
            : `<span style="color: var(--text-muted);">-</span>`;

        const openBadge = a.openDefects > 0
            ? `<span class="badge badge-status-progress">${a.openDefects} открыто</span>`
            : `<span class="badge badge-status-accepted">0 замечаний</span>`;

        const readyToArchive = a.canArchive;
        const statusText = readyToArchive
            ? `<span class="badge badge-status-accepted">ГОТОВА К АРХИВАЦИИ</span>`
            : `<span class="badge badge-status-progress">В РАБОТЕ</span>`;

        const formattedDate = formatDate(a.lastUpdated);

        return `
            <tr onclick="openApartmentModal(${a.id})">
                <td style="font-weight: 700; font-family: var(--font-mono);">Подъезд ${a.entranceNumber}</td>
                <td style="font-weight: 700; font-size: 16px;">Кв. ${a.apartmentNumber}</td>
                <td><strong>${a.totalDefects}</strong></td>
                <td>${openBadge}</td>
                <td>${urgentBadge}</td>
                <td style="color: var(--text-muted); font-size: 12px; font-family: var(--font-mono);">${formattedDate}</td>
                <td>${statusText}</td>
                <td style="text-align: right;">
                    <button class="btn-filter-reset" style="padding: 4px 10px; font-size: 11px;">ОТКРЫТЬ КАРТОЧКУ &rarr;</button>
                </td>
            </tr>
        `;
    }).join('');
}

/* ==========================================================================
   КАРТОЧКА КВАРТИРЫ (МОДАЛЬНОЕ ОКНО)
   ========================================================================== */

async function openApartmentModal(aptId) {
    currentApartmentId = aptId;
    const modal = document.getElementById('apartmentModal');
    modal.style.display = 'flex';

    try {
        const resp = await fetch(`/api/apartments/${aptId}`);
        if (!resp.ok) throw new Error('Квартира не найдена');
        const apt = await resp.json();

        safeSetText('aptModalTitle', `ПОДЪЕЗД ${apt.entranceNumber}, КВАРТИРА ${apt.apartmentNumber}`);

        const isArch = apt.isArchived;
        safeSetHtml('aptModalSubtitle', isArch
            ? '<span class="badge badge-low">В АРХИВЕ</span>'
            : (apt.canArchive
                ? '<span class="badge badge-status-accepted">ВСЕ ДЕФЕКТЫ ПРИНЯТЫ &bull; ГОТОВА К АРХИВУ</span>'
                : '<span class="badge badge-status-progress">В РАБОТЕ СТРОИТЕЛЕЙ</span>'));

        safeSetHtml('aptModalSummaryText',
            `Активных замечаний: <strong style="color: ${apt.activeDefects.length > 0 ? '#ff6b6b' : '#66bb6a'}">${apt.activeDefects.length}</strong> | Принятых: <strong style="color: #66bb6a">${apt.acceptedDefects.length}</strong>`);

        const archiveBtn = document.getElementById('btnArchiveApartment');
        if (archiveBtn) {
            if (isArch) {
                archiveBtn.style.display = 'none';
            } else {
                archiveBtn.style.display = 'inline-flex';
                archiveBtn.disabled = !apt.canArchive;
                archiveBtn.title = apt.canArchive ? 'Отправить квартиру в архив' : 'Доступно только когда все дефекты приняты';
            }
        }

        renderApartmentDefectsList('aptActiveDefectsContainer', apt.activeDefects, false);
        renderApartmentDefectsList('aptAcceptedDefectsContainer', apt.acceptedDefects, true);

        safeSetText('activeDefectsCount', apt.activeDefects.length);
        safeSetText('acceptedDefectsCount', apt.acceptedDefects.length);

    } catch (e) {
        showToast('Ошибка загрузки карточки: ' + e.message, 'error');
        closeApartmentModal();
    }
}

function closeApartmentModal() {
    document.getElementById('apartmentModal').style.display = 'none';
    currentApartmentId = null;
}

function renderApartmentDefectsList(containerId, defects, isHistory) {
    const container = document.getElementById(containerId);
    if (!defects || defects.length === 0) {
        container.innerHTML = `<div style="color: var(--text-muted); padding: 14px 0; font-size: 13px;">${isHistory ? 'Принятых замечаний в архиве квартиры пока нет' : 'Все текущие замечания устранены'}</div>`;
        return;
    }

    container.innerHTML = defects.map(d => {
        const isUrgent = d.urgency === 'URGENT';
        const isAccepted = d.status === 'ACCEPTED';
        const cardClass = isUrgent ? 'urgent-border' : (isAccepted ? 'accepted-border' : '');

        const photosHtml = d.photos && d.photos.length > 0
            ? `<div class="defect-photos-grid">
                ${d.photos.map(p => `
                    <img src="${p.url}" class="defect-photo-thumb" alt="Фото дефекта" onclick="openLightbox('${p.url}')" title="Кликните для полноразмерного просмотра">
                `).join('')}
               </div>`
            : '';

        // Элементы управления для руководителя
        const isManager = currentUser && currentUser.role === 'MANAGER';
        const controlsHtml = isManager ? `
            <div class="defect-actions">
                <div class="control-inline">
                    <span class="control-label">Срочность:</span>
                    <select class="select-field" style="padding: 4px 8px; min-height: 32px; font-size: 12px;" onchange="changeDefectUrgency(${d.id}, this.value)">
                        <option value="LOW" ${d.urgency === 'LOW' ? 'selected' : ''}>НИЗКАЯ</option>
                        <option value="MEDIUM" ${d.urgency === 'MEDIUM' ? 'selected' : ''}>СРЕДНЯЯ</option>
                        <option value="URGENT" ${d.urgency === 'URGENT' ? 'selected' : ''}>! СРОЧНО !</option>
                    </select>
                </div>

                <div class="control-inline">
                    <span class="control-label">Статус:</span>
                    <select class="select-field" style="padding: 4px 8px; min-height: 32px; font-size: 12px; font-weight: 700;" onchange="changeDefectStatus(${d.id}, this.value)">
                        <option value="NEW" ${d.status === 'NEW' ? 'selected' : ''}>НОВЫЙ</option>
                        <option value="IN_PROGRESS" ${d.status === 'IN_PROGRESS' ? 'selected' : ''}>В РАБОТЕ</option>
                        <option value="FIXED" ${d.status === 'FIXED' ? 'selected' : ''}>ИСПРАВЛЕН</option>
                        <option value="ACCEPTED" ${d.status === 'ACCEPTED' ? 'selected' : ''}>ПРИНЯТ &#10003;</option>
                    </select>
                </div>
            </div>
        ` : '';

        return `
            <div class="defect-item-card ${cardClass}">
                <div class="defect-header">
                    <div class="defect-meta">
                        <span class="badge ${getUrgencyBadgeClass(d.urgency)}">${d.urgencyDisplayName}</span>
                        <span class="badge ${getStatusBadgeClass(d.status)}">${d.statusDisplayName}</span>
                        <span class="defect-time">&#128337; ${formatDate(d.createdAt)}</span>
                    </div>
                    <div class="defect-author">Приемщик: <strong>${d.workerName}</strong></div>
                </div>

                <div class="defect-body">${escapeHtml(d.description)}</div>

                ${photosHtml}
                ${controlsHtml}
                ${renderDefectCommentsHtml(d)}
            </div>
        `;
    }).join('');
}

async function changeDefectStatus(defectId, newStatus) {
    try {
        const resp = await fetch(`/api/defects/${defectId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (resp.ok) {
            showToast('Статус дефекта обновлен', 'success');
            // Обновляем карточку квартиры и дашборд
            if (currentApartmentId) {
                await openApartmentModal(currentApartmentId);
            }
            loadDashboardMetrics();
            loadApartmentsRegistry();
        } else {
            showToast('Не удалось изменить статус', 'error');
        }
    } catch (e) {
        showToast('Ошибка сети: ' + e.message, 'error');
    }
}

async function changeDefectUrgency(defectId, newUrgency) {
    try {
        const resp = await fetch(`/api/defects/${defectId}/urgency`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urgency: newUrgency })
        });

        if (resp.ok) {
            showToast('Срочность дефекта обновлена', 'success');
            if (currentApartmentId) {
                await openApartmentModal(currentApartmentId);
            }
            loadDashboardMetrics();
            loadApartmentsRegistry();
        } else {
            showToast('Не удалось изменить срочность', 'error');
        }
    } catch (e) {
        showToast('Ошибка сети: ' + e.message, 'error');
    }
}

async function archiveCurrentApartment() {
    if (!currentApartmentId) return;

    if (!confirm('Подтверждаете отправку квартиры в архив? Все замечания будут зафиксированы как принятые.')) {
        return;
    }

    try {
        const resp = await fetch(`/api/apartments/${currentApartmentId}/archive`, {
            method: 'POST'
        });

        if (resp.ok) {
            showToast('Квартира успешно переведена в архив', 'success');
            closeApartmentModal();
            loadDashboardMetrics();
            loadApartmentsRegistry();
        } else {
            const err = await resp.text();
            showToast('Ошибка архивации: ' + err, 'error');
        }
    } catch (e) {
        showToast('Ошибка сети: ' + e.message, 'error');
    }
}

/* ==========================================================================
   АРХИВ КВАРТИР
   ========================================================================== */

async function loadArchiveRegistry() {
    try {
        const resp = await fetch('/api/apartments?archived=true');
        if (resp.ok) {
            const archived = await resp.json();
            const tbody = document.getElementById('archiveTableBody');

            if (!archived || archived.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
                            Архив пуст. Нет переведенных квартир.
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = archived.map(a => `
                <tr onclick="openApartmentModal(${a.id})">
                    <td style="font-weight: 700; font-family: var(--font-mono);">Подъезд ${a.entranceNumber}</td>
                    <td style="font-weight: 700; font-size: 16px;">Кв. ${a.apartmentNumber}</td>
                    <td><strong>${a.totalDefects}</strong> (все устранены)</td>
                    <td><span class="badge badge-status-accepted">&#10003; 100% ПРИНЯТО</span></td>
                    <td style="color: var(--text-muted); font-size: 12px; font-family: var(--font-mono);">${formatDate(a.lastUpdated)}</td>
                    <td style="text-align: right;">
                        <button class="btn-filter-reset" style="padding: 4px 10px; font-size: 11px;">ПРОСМОТР &rarr;</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) {
        console.error('Ошибка загрузки архива:', e);
    }
}

/* ==========================================================================
   КАЛЕНДАРЬ ФИКСАЦИИ ДЕФЕКТОВ
   ========================================================================== */

const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

async function loadCalendar() {
    safeSetText('calendarMonthTitle', `${monthNames[calendarCurrentMonth - 1]} ${calendarCurrentYear}`);

    try {
        const resp = await fetch(`/api/dashboard/calendar?year=${calendarCurrentYear}&month=${calendarCurrentMonth}`);
        if (resp.ok) {
            const daysData = await resp.json();
            renderCalendarGrid(daysData);
        }
    } catch (e) {
        console.error('Ошибка календаря:', e);
    }
}

function changeCalendarMonth(delta) {
    calendarCurrentMonth += delta;
    if (calendarCurrentMonth > 12) {
        calendarCurrentMonth = 1;
        calendarCurrentYear++;
    } else if (calendarCurrentMonth < 1) {
        calendarCurrentMonth = 12;
        calendarCurrentYear--;
    }
    document.getElementById('calendarDayDefectsSection').style.display = 'none';
    loadCalendar();
}

function renderCalendarGrid(daysData) {
    const grid = document.getElementById('calendarDaysGrid');
    grid.innerHTML = '';

    // Определяем день недели 1-го числа месяца (0 = Вс, 1 = Пн...)
    const firstDay = new Date(calendarCurrentYear, calendarCurrentMonth - 1, 1).getDay();
    // Корректируем для русской недели (Пн = 0 .. Вс = 6)
    const shift = (firstDay === 0) ? 6 : firstDay - 1;

    // Пустые ячейки смещения
    for (let i = 0; i < shift; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.style.backgroundColor = 'transparent';
        emptyCell.style.border = '1px solid transparent';
        grid.appendChild(emptyCell);
    }

    daysData.forEach(d => {
        const dateObj = new Date(d.date);
        const dayNumber = dateObj.getDate();
        const hasDefects = d.count > 0;

        const cell = document.createElement('div');
        cell.className = `calendar-day-cell ${hasDefects ? 'has-defects' : ''}`;
        cell.id = `cal-day-${d.date}`;

        cell.innerHTML = `
            <div class="calendar-day-number">${dayNumber}</div>
            ${hasDefects ? `<div class="calendar-defects-count">${d.count} деф.</div>` : ''}
        `;

        cell.onclick = () => selectCalendarDate(d.date);
        grid.appendChild(cell);
    });
}

async function selectCalendarDate(dateStr) {
    document.querySelectorAll('.calendar-day-cell').forEach(c => c.classList.remove('selected'));
    const selectedCell = document.getElementById(`cal-day-${dateStr}`);
    if (selectedCell) selectedCell.classList.add('selected');

    const section = document.getElementById('calendarDayDefectsSection');
    const label = document.getElementById('calendarSelectedDateLabel');
    const list = document.getElementById('calendarDefectsList');

    label.innerText = formatDate(dateStr).split(' ')[0];
    section.style.display = 'block';
    list.innerHTML = '<div style="color: var(--text-muted); padding: 10px;">Загрузка замечаний...</div>';

    try {
        const resp = await fetch(`/api/defects/by-date?date=${dateStr}`);
        if (resp.ok) {
            const defects = await resp.json();
            if (defects.length === 0) {
                list.innerHTML = '<div style="color: var(--text-muted); padding: 14px 0;">За этот день дефектов не зафиксировано</div>';
            } else {
                renderApartmentDefectsList('calendarDefectsList', defects, false);
            }
        }
    } catch (e) {
        list.innerHTML = '<div style="color: #ff8a80;">Ошибка загрузки списка: ' + e.message + '</div>';
    }
}

/* ==========================================================================
   ФОРМА СОЗДАНИЯ ДЕФЕКТА (КЛИЕНТСКОЕ СЖАТИЕ И ОТПРАВКА)
   ========================================================================== */

function selectUrgency(urgency) {
    selectedUrgency = urgency;
    document.getElementById('urgencyBtnLow').className = 'urgency-toggle-btn' + (urgency === 'LOW' ? ' selected-low' : '');
    document.getElementById('urgencyBtnMedium').className = 'urgency-toggle-btn' + (urgency === 'MEDIUM' ? ' selected-medium' : '');
    document.getElementById('urgencyBtnUrgent').className = 'urgency-toggle-btn' + (urgency === 'URGENT' ? ' selected-urgent' : '');

    const radio = document.querySelector(`input[name="urgency"][value="${urgency}"]`);
    if (radio) radio.checked = true;
}

async function handlePhotoSelection(input) {
    const files = Array.from(input.files || []);
    if (files.length === 0) return;

    for (const f of files) {
        try {
            // Клиентское сжатие через HTML5 canvas
            const compressed = await ImageCompressor.compress(f, 1400, 0.82);
            stagedPhotos.push(compressed);
        } catch (e) {
            console.error('Ошибка сжатия изображения:', e);
            // Если сжатие не удалось, добавляем исходный файл
            stagedPhotos.push({
                file: f,
                previewUrl: URL.createObjectURL(f),
                originalSize: f.size,
                compressedSize: f.size
            });
        }
    }

    renderPhotoPreviews();
    input.value = ''; // сброс инпута для повторного выбора
}

function renderPhotoPreviews() {
    const container = document.getElementById('uploadPreviewsContainer');
    container.innerHTML = '';

    stagedPhotos.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'upload-preview-card';

        const ratio = Math.round((1 - item.compressedSize / item.originalSize) * 100);
        const ratioText = ratio > 0 ? `-${ratio}%` : '';

        card.innerHTML = `
            <img src="${item.previewUrl}" alt="Превью фото">
            <button type="button" class="upload-preview-remove" onclick="removeStagedPhoto(${idx})" title="Удалить фото">&times;</button>
            <div class="upload-preview-size">${ImageCompressor.formatBytes(item.compressedSize)} ${ratioText}</div>
        `;
        container.appendChild(card);
    });
}

function removeStagedPhoto(idx) {
    if (stagedPhotos[idx] && stagedPhotos[idx].previewUrl) {
        URL.revokeObjectURL(stagedPhotos[idx].previewUrl);
    }
    stagedPhotos.splice(idx, 1);
    renderPhotoPreviews();
}

function resetDefectForm() {
    document.getElementById('createDefectForm').reset();
    selectedUrgency = null;
    document.getElementById('urgencyBtnLow').className = 'urgency-toggle-btn';
    document.getElementById('urgencyBtnMedium').className = 'urgency-toggle-btn';
    document.getElementById('urgencyBtnUrgent').className = 'urgency-toggle-btn';
    stagedPhotos = [];
    renderPhotoPreviews();
}

async function submitDefect(e) {
    e.preventDefault();

    const entrance = document.getElementById('formEntrance').value.trim();
    const apt = document.getElementById('formApartment').value.trim();
    const desc = document.getElementById('formDescription').value.trim();
    const btn = document.getElementById('btnSubmitDefect');

    if (!entrance || !apt) {
        showToast('Укажите номер подъезда и квартиры', 'error');
        return;
    }

    if (!selectedUrgency) {
        showToast('Рабочий обязан выбрать уровень срочности замечания', 'error');
        return;
    }

    if (!desc) {
        showToast('Укажите суть замечания / что исправить', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerText = 'СОХРАНЕНИЕ ДЕФЕКТА...';

    const formData = new FormData();
    formData.append('entranceNumber', entrance);
    formData.append('apartmentNumber', apt);
    formData.append('description', desc);
    formData.append('urgency', selectedUrgency);

    stagedPhotos.forEach(p => {
        formData.append('photos', p.file);
    });

    try {
        const resp = await fetch('/api/defects', {
            method: 'POST',
            body: formData
        });

        if (resp.ok) {
            const defect = await resp.json();
            showToast(`Дефект успешно зафиксирован! (Подъезд ${defect.entranceNumber}, Кв. ${defect.apartmentNumber})`, 'success');
            resetDefectForm();

            if (currentUser.role === 'WORKER') {
                switchWorkerTab('my-defects');
            } else {
                switchManagerTab('dashboard');
            }
        } else {
            const err = await resp.text();
            showToast('Ошибка при сохранении: ' + err, 'error');
        }
    } catch (err) {
        showToast('Сбой сети при отправке дефекта: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = 'ЗАРЕГИСТРИРОВАТЬ ДЕФЕКТ';
    }
}

/* ==========================================================================
   ЖУРНАЛ РАБОЧЕГО: МОИ ЗАМЕЧАНИЯ
   ========================================================================== */

async function loadMyDefects() {
    const list = document.getElementById('workerDefectsList');
    list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">Загрузка ваших замечаний...</div>';

    try {
        const resp = await fetch('/api/defects/my');
        if (resp.ok) {
            const defects = await resp.json();
            if (!defects || defects.length === 0) {
                list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">Вы еще не добавили ни одного замечания</div>';
                return;
            }

            list.innerHTML = defects.map(d => {
                const photosHtml = d.photos && d.photos.length > 0
                    ? `<div class="defect-photos-grid">
                        ${d.photos.map(p => `
                            <img src="${p.url}" class="defect-photo-thumb" alt="Фото" onclick="openLightbox('${p.url}')">
                        `).join('')}
                       </div>`
                    : '';

                return `
                    <div class="defect-item-card ${d.urgency === 'URGENT' ? 'urgent-border' : ''}">
                        <div class="defect-header">
                            <div class="defect-meta">
                                <span style="font-weight: 700; font-size: 15px; color: #fff;">
                                    Подъезд ${d.entranceNumber}, Кв. ${d.apartmentNumber}
                                </span>
                                <span class="badge ${getUrgencyBadgeClass(d.urgency)}">${d.urgencyDisplayName}</span>
                                <span class="badge ${getStatusBadgeClass(d.status)}">${d.statusDisplayName}</span>
                                <span class="defect-time">&#128337; ${formatDate(d.createdAt)}</span>
                            </div>
                        </div>

                        <div class="defect-body">${escapeHtml(d.description)}</div>

                        ${photosHtml}
                        ${renderDefectCommentsHtml(d)}
                    </div>
                `;
            }).join('');
        }
    } catch (e) {
        list.innerHTML = '<div style="color: #ff8a80; padding: 20px;">Ошибка загрузки: ' + e.message + '</div>';
    }
}

/* ==========================================================================
   LIGHTBOX ПРОСМОТРА ФОТО
   ========================================================================== */

function openLightbox(url) {
    document.getElementById('lightboxImage').src = url;
    document.getElementById('lightboxModal').style.display = 'flex';
}

function closeLightbox() {
    document.getElementById('lightboxModal').style.display = 'none';
    document.getElementById('lightboxImage').src = '';
}

/* ==========================================================================
   УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
   ========================================================================== */

function showToast(message, type = 'success') {
    const toast = document.getElementById('alertToast');
    const msgEl = document.getElementById('toastMessage');

    toast.className = `alert-toast ${type}`;
    msgEl.innerText = message;
    toast.style.display = 'flex';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}

function formatDate(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${mins}`;
}

function getUrgencyBadgeClass(urgency) {
    switch (urgency) {
        case 'URGENT': return 'badge-urgent';
        case 'MEDIUM': return 'badge-medium';
        default: return 'badge-low';
    }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'NEW': return 'badge-status-new';
        case 'IN_PROGRESS': return 'badge-status-progress';
        case 'FIXED': return 'badge-status-fixed';
        case 'ACCEPTED': return 'badge-status-accepted';
        default: return 'badge-low';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ==========================================================================
   КОММЕНТАРИИ И ЖУРНАЛ ОПЕРАТИВНЫХ РАБОТ
   ========================================================================== */

function renderDefectCommentsHtml(d) {
    const comments = d.comments || [];
    return `
        <div class="defect-comments-section">
            <div class="defect-comments-header">
                <span>&#128196; ЖУРНАЛ РАБОТ И ЗАМЕТКИ (${comments.length})</span>
            </div>
            <div class="defect-comments-list" id="defectCommentsList_${d.id}">
                ${comments.length === 0 ? '<div style="color: var(--text-muted); font-size: 12px; font-style: italic;">Записей в оперативном журнале пока нет</div>' : ''}
                ${comments.map(c => `
                    <div class="comment-item ${c.authorRole === 'MANAGER' ? 'manager-comment' : 'worker-comment'}">
                        <div class="comment-header">
                            <div class="comment-author">
                                <span>${escapeHtml(c.authorName)}</span>
                                <span class="comment-role-badge ${c.authorRole === 'MANAGER' ? 'role-badge-manager' : 'role-badge-worker'}">
                                    ${c.authorRole === 'MANAGER' ? 'НАЧАЛЬНИК УЧАСТКА' : 'ПРИЕМЩИК'}
                                </span>
                            </div>
                            <span class="comment-time">&#128337; ${formatDate(c.createdAt)}</span>
                        </div>
                        <div class="comment-message">${escapeHtml(c.message)}</div>
                    </div>
                `).join('')}
            </div>

            <div class="comment-form-container">
                <div class="quick-tags-container">
                    <button type="button" class="quick-tag-btn" onclick="applyQuickTag(${d.id}, 'Отправил бригаду: ')">+ Отправил бригаду</button>
                    <button type="button" class="quick-tag-btn" onclick="applyQuickTag(${d.id}, 'Заказаны материалы: ')">+ Заказаны материалы</button>
                    <button type="button" class="quick-tag-btn" onclick="applyQuickTag(${d.id}, 'Подрядчик устранил замечание')">+ Подрядчик устранил</button>
                    <button type="button" class="quick-tag-btn" onclick="applyQuickTag(${d.id}, 'Требуется повторный осмотр на объекте')">+ Повторный осмотр</button>
                </div>
                <div class="comment-input-row">
                    <input type="text" id="commentInput_${d.id}" class="input-field" style="padding: 6px 10px; font-size: 13px;" placeholder="Добавить запись в журнал работ (например: 'Отправил бригаду отделочников')..." onkeydown="if(event.key==='Enter'){event.preventDefault(); submitDefectComment(${d.id});}">
                    <button type="button" class="btn-add-comment" onclick="submitDefectComment(${d.id})">ДОБАВИТЬ</button>
                </div>
            </div>
        </div>
    `;
}

function applyQuickTag(defectId, tag) {
    const inp = document.getElementById(`commentInput_${defectId}`);
    if (inp) {
        if (inp.value && inp.value.trim().length > 0) {
            inp.value = inp.value.trim() + '; ' + tag;
        } else {
            inp.value = tag;
        }
        inp.focus();
    }
}

async function submitDefectComment(defectId) {
    const inp = document.getElementById(`commentInput_${defectId}`);
    if (!inp) return;
    const msg = inp.value.trim();
    if (!msg) {
        showToast('Введите текст записи в журнал', 'error');
        return;
    }

    try {
        const resp = await fetch(`/api/defects/${defectId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });

        if (resp.ok) {
            showToast('Запись добавлена в журнал работ', 'success');
            inp.value = '';
            if (currentApartmentId) {
                await openApartmentModal(currentApartmentId);
            } else if (currentUser && currentUser.role === 'WORKER') {
                await loadMyDefects();
            }
        } else {
            const err = await resp.text();
            showToast('Ошибка при добавлении записи: ' + err, 'error');
        }
    } catch (e) {
        showToast('Ошибка сети: ' + e.message, 'error');
    }
}

/* ==========================================================================
   БЫСТРЫЕ ШАБЛОНЫ И ЛЕНТА ДЕФЕКТОВ (MOBILE-FIRST)
   ========================================================================== */

function applyTemplate(text) {
    const desc = document.getElementById('formDescription');
    if (!desc) return;
    if (desc.value.trim().length > 0) {
        desc.value = desc.value.trim() + '. ' + text;
    } else {
        desc.value = text;
    }
    desc.focus();
}

async function loadDefectsFeed() {
    const container = document.getElementById('defectsFeedListContainer');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">Загрузка списка замечаний...</div>';

    try {
        const url = (currentUser && currentUser.role === 'WORKER') ? '/api/defects/my' : '/api/defects/search';
        const resp = await fetch(url);
        if (!resp.ok) {
            container.innerHTML = '<div style="color: #ff8a80; padding: 20px; text-align: center;">Не удалось загрузить замечания</div>';
            return;
        }

        allFeedDefects = await resp.json();
        updateDefectsFilterCounts(allFeedDefects);
        applyFeedFiltersAndRender();
    } catch (e) {
        container.innerHTML = `<div style="color: #ff8a80; padding: 20px; text-align: center;">Ошибка сети: ${e.message}</div>`;
    }
}

function updateDefectsFilterCounts(defects) {
    const all = defects.length;
    const urgent = defects.filter(d => d.urgency === 'URGENT').length;
    const inWork = defects.filter(d => d.status !== 'ACCEPTED').length;
    const accepted = defects.filter(d => d.status === 'ACCEPTED').length;

    safeSetText('countDefectsAll', all);
    safeSetText('countDefectsUrgent', urgent);
    safeSetText('countDefectsInWork', inWork);
    safeSetText('countDefectsAccepted', accepted);
}

function setDefectsFeedFilter(filter) {
    currentFeedFilter = filter;
    window.currentFeedFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));

    if (filter === 'ALL') safeAddClass('chipAll', 'active');
    else if (filter === 'URGENT') safeAddClass('chipUrgent', 'active');
    else if (filter === 'IN_WORK') safeAddClass('chipInWork', 'active');
    else if (filter === 'ACCEPTED') safeAddClass('chipAccepted', 'active');

    applyFeedFiltersAndRender();
}

function onDefectsSearchInput(val) {
    currentSearchQuery = (val || '').trim().toLowerCase();
    window.currentSearchQuery = currentSearchQuery;
    applyFeedFiltersAndRender();
}

function clearDefectsSearch() {
    const inp = document.getElementById('quickDefectsSearchInput');
    if (inp) inp.value = '';
    currentSearchQuery = '';
    window.currentSearchQuery = '';
    applyFeedFiltersAndRender();
}

function applyFeedFiltersAndRender() {
    let filtered = (typeof allFeedDefects !== 'undefined' && Array.isArray(allFeedDefects)) ? allFeedDefects.slice() : [];

    const activeFilter = (typeof currentFeedFilter !== 'undefined') ? currentFeedFilter : 'ALL';
    const activeSearch = (typeof currentSearchQuery !== 'undefined') ? currentSearchQuery : '';

    if (activeFilter === 'URGENT') {
        filtered = filtered.filter(d => d.urgency === 'URGENT');
    } else if (activeFilter === 'IN_WORK') {
        filtered = filtered.filter(d => d.status !== 'ACCEPTED');
    } else if (activeFilter === 'ACCEPTED') {
        filtered = filtered.filter(d => d.status === 'ACCEPTED');
    }

    if (activeSearch) {
        filtered = filtered.filter(d => {
            const aptStr = String(d.apartmentNumber || '');
            const entStr = String(d.entranceNumber || '');
            const desc = (d.description || '').toLowerCase();
            return aptStr === activeSearch || aptStr.includes(activeSearch) || desc.includes(activeSearch);
        });
    }

    renderDefectsFeed(filtered);
}

function renderDefectsFeed(defects) {
    const container = document.getElementById('defectsFeedListContainer');
    if (!container) return;

    if (!defects || defects.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 40px; background: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: 4px;">
                <div style="font-size: 32px; margin-bottom: 8px;">📋</div>
                <div style="font-size: 15px; font-weight: 600; color: var(--text-primary);">Замечаний не найдено</div>
                <div style="font-size: 13px; margin-top: 4px;">Попробуйте изменить поисковый запрос или фильтр</div>
            </div>
        `;
        return;
    }

    container.innerHTML = defects.map(d => {
        const isUrgent = d.urgency === 'URGENT';
        const isAccepted = d.status === 'ACCEPTED';
        const cardClass = isUrgent ? 'urgent-border' : (isAccepted ? 'accepted-border' : '');

        const photosHtml = d.photos && d.photos.length > 0
            ? `<div class="defect-photos-grid">
                ${d.photos.map(p => `
                    <img src="${p.url}" class="defect-photo-thumb" alt="Фото дефекта" onclick="openLightbox('${p.url}')" title="Кликните для полноразмерного просмотра">
                `).join('')}
               </div>`
            : '';

        // Элементы управления для руководителя прямо на карточке
        const isManager = currentUser && currentUser.role === 'MANAGER';
        const controlsHtml = isManager ? `
            <div class="defect-actions" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border-color);">
                <div class="control-inline">
                    <span class="control-label">Срочность:</span>
                    <select class="select-field" style="padding: 4px 8px; min-height: 32px; font-size: 12px;" onchange="changeDefectUrgencyFeed(${d.id}, this.value)">
                        <option value="LOW" ${d.urgency === 'LOW' ? 'selected' : ''}>НИЗКАЯ</option>
                        <option value="MEDIUM" ${d.urgency === 'MEDIUM' ? 'selected' : ''}>СРЕДНЯЯ</option>
                        <option value="URGENT" ${d.urgency === 'URGENT' ? 'selected' : ''}>! СРОЧНО !</option>
                    </select>
                </div>

                <div class="control-inline">
                    <span class="control-label">Статус:</span>
                    <select class="select-field" style="padding: 4px 8px; min-height: 32px; font-size: 12px; font-weight: 700;" onchange="changeDefectStatusFeed(${d.id}, this.value)">
                        <option value="NEW" ${d.status === 'NEW' ? 'selected' : ''}>НОВЫЙ</option>
                        <option value="IN_PROGRESS" ${d.status === 'IN_PROGRESS' ? 'selected' : ''}>В РАБОТЕ</option>
                        <option value="FIXED" ${d.status === 'FIXED' ? 'selected' : ''}>ИСПРАВЛЕН</option>
                        <option value="ACCEPTED" ${d.status === 'ACCEPTED' ? 'selected' : ''}>ПРИНЯТ &#10003;</option>
                    </select>
                </div>
            </div>
        ` : '';

        return `
            <div class="defect-item-card ${cardClass}" style="margin-bottom: 14px;">
                <div class="defect-header" style="flex-wrap: wrap; gap: 6px;">
                    <div style="font-size: 16px; font-weight: 700; color: #fff;">
                        Подъезд ${d.entranceNumber}, Кв. ${d.apartmentNumber}
                    </div>
                    <div class="defect-meta">
                        <span class="badge ${getUrgencyBadgeClass(d.urgency)}">${d.urgencyDisplayName}</span>
                        <span class="badge ${getStatusBadgeClass(d.status)}">${d.statusDisplayName}</span>
                    </div>
                </div>

                <div class="defect-body" style="font-size: 15px; margin: 10px 0; color: #f0f6fc;">
                    ${escapeHtml(d.description)}
                </div>

                ${photosHtml}

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
                    <span>Приемщик: <strong style="color: var(--text-secondary);">${escapeHtml(d.workerName)}</strong></span>
                    <span>&#128337; ${formatDate(d.createdAt)}</span>
                </div>

                ${controlsHtml}
                ${renderDefectCommentsHtml(d)}
            </div>
        `;
    }).join('');
}

async function changeDefectStatusFeed(defectId, newStatus) {
    try {
        const resp = await fetch(`/api/defects/${defectId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (resp.ok) {
            showToast('Статус дефекта обновлен', 'success');
            await loadDefectsFeed();
            loadDashboardMetrics();
        } else {
            showToast('Не удалось изменить статус', 'error');
        }
    } catch (e) {
        showToast('Ошибка сети: ' + e.message, 'error');
    }
}

async function changeDefectUrgencyFeed(defectId, newUrgency) {
    try {
        const resp = await fetch(`/api/defects/${defectId}/urgency`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urgency: newUrgency })
        });

        if (resp.ok) {
            showToast('Срочность обновлена', 'success');
            await loadDefectsFeed();
            loadDashboardMetrics();
        } else {
            showToast('Не удалось изменить срочность', 'error');
        }
    } catch (e) {
        showToast('Ошибка сети: ' + e.message, 'error');
    }
}

/* ==========================================================================
   КПД И АНАЛИТИКА ЭФФЕКТИВНОСТИ (БЕЗОПАСНАЯ ЗАГРУЗКА)
   ========================================================================== */

async function loadEfficiencyMetrics() {
    try {
        const resp = await fetch('/api/dashboard/efficiency');
        if (!resp.ok) {
            showToast('Не удалось загрузить данные эффективности', 'error');
            return;
        }

        const data = await resp.json();

        // Общий КПД
        const overall = Math.min(100, Math.max(0, data.overallKpiPercent !== undefined ? data.overallKpiPercent : (data.overallResolutionRate || 0)));
        safeSetText('kpiOverallRate', overall.toFixed(1) + '%');
        safeSetWidth('kpiOverallBar', overall + '%');
        safeSetText('kpiOverallSub', `${data.totalAccepted || 0} из ${data.totalCreated || 0} замечаний принято`);

        // КПД по срочным
        const urgent = Math.min(100, Math.max(0, data.urgentKpiPercent !== undefined ? data.urgentKpiPercent : (data.urgentResolutionRate || 0)));
        safeSetText('kpiUrgentRate', urgent.toFixed(1) + '%');
        safeSetWidth('kpiUrgentBar', urgent + '%');
        safeSetText('kpiUrgentSub', `Закрытие критичных позиций: ${urgent.toFixed(1)}%`);

        // MTTR
        safeSetText('kpiMttrValue', (data.avgResolutionHours || 0) + ' ч');
        safeSetText('kpiAvgDays', `~ ${data.avgResolutionDays || 0} дн. на одно замечание`);

        // Скорость / Темп
        const badge = document.getElementById('kpiVelocityBadge');
        if (badge) {
            if (data.weeklyClosed > data.weeklyOpened) {
                badge.innerText = 'ОПЕРЕЖЕНИЕ (+' + (data.weeklyClosed - data.weeklyOpened) + ')';
                badge.style.color = '#81c784';
            } else if (data.weeklyClosed < data.weeklyOpened) {
                badge.innerText = 'ОТСТАВАНИЕ (-' + (data.weeklyOpened - data.weeklyClosed) + ')';
                badge.style.color = '#ff8a80';
            } else {
                badge.innerText = 'ПАРИТЕТ (СТАБИЛЬНО)';
                badge.style.color = '#ffb74d';
            }
        }
        safeSetText('kpiVelocitySub', `За неделю: +${data.weeklyOpened || 0} открыто / ${data.weeklyClosed || 0} закрыто`);

        // Детализация
        safeSetText('kpiWeeklyOpened', data.weeklyOpened || 0);
        safeSetText('kpiWeeklyClosed', data.weeklyClosed || 0);
        safeSetText('kpiMonthlyOpened', data.monthlyOpened || 0);
        safeSetText('kpiMonthlyClosed', data.monthlyClosed || 0);

        safeSetText('kpiTotalCreated', data.totalCreated || 0);
        safeSetText('kpiTotalAccepted', data.totalAccepted || 0);
        safeSetText('kpiTotalInWork', data.totalInWork || 0);
        safeSetText('kpiVelocityStatusText', data.velocityStatus || 'Данные формируются');

        // Таблица приемщиков
        const tableBody = document.getElementById('workerStatsTableBody');
        if (tableBody) {
            if (!data.workerStats || data.workerStats.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">Нет данных по приемщикам</td></tr>';
            } else {
                tableBody.innerHTML = data.workerStats.map(w => {
                    const total = w.totalReported !== undefined ? w.totalReported : (w.reportedDefects || 0);
                    const urgentCount = w.urgentReported !== undefined ? w.urgentReported : (w.urgentDefects || 0);
                    const resolvedCount = w.resolved !== undefined ? w.resolved : (w.resolvedDefects || 0);
                    const rate = total > 0 ? (resolvedCount / total) * 100 : 100;
                    let rateColor = '#ff8a80';
                    if (rate >= 75) rateColor = '#81c784';
                    else if (rate >= 40) rateColor = '#ffb74d';

                    return `
                        <tr>
                            <td>
                                <strong style="color: #fff;">${escapeHtml(w.workerName)}</strong>
                                <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">ID: ${w.workerId} &bull; ПРИЕМЩИК</div>
                            </td>
                            <td style="text-align: center; font-weight: 600;">${total}</td>
                            <td style="text-align: center; color: #ff8a80; font-weight: 700;">${urgentCount}</td>
                            <td style="text-align: center; color: #81c784; font-weight: 700;">${resolvedCount}</td>
                            <td style="text-align: center; font-weight: 700; color: ${rateColor};">
                                ${rate.toFixed(1)}%
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
    } catch (e) {
        showToast('Ошибка аналитики: ' + e.message, 'error');
    }
}

/* ==========================================================================
   БЕЗОПАСНЫЕ ХЕЛПЕРЫ ОБНОВЛЕНИЯ DOM
   ========================================================================== */

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = (text !== undefined && text !== null) ? text : '';
}

function safeSetHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = (html !== undefined && html !== null) ? html : '';
}

function safeSetWidth(id, width) {
    const el = document.getElementById(id);
    if (el) el.style.width = width;
}

function safeSetDisplay(id, display) {
    const el = document.getElementById(id);
    if (el) el.style.display = display;
}

function safeAddClass(id, className) {
    const el = document.getElementById(id);
    if (el) el.classList.add(className);
}

function safeRemoveClass(id, className) {
    const el = document.getElementById(id);
    if (el) el.classList.remove(className);
}
