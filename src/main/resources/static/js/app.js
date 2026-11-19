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
            switchManagerTab('dashboard');
        } else {
            document.getElementById('managerNav').style.display = 'none';
            document.getElementById('workerNav').style.display = 'flex';
            switchWorkerTab('create');
        }
    } catch (e) {
        window.location.href = '/login.html';
    }
}

function renderUserInfo() {
    document.getElementById('currentUserName').innerText = currentUser.fullName;
    document.getElementById('currentUserRole').innerText =
        currentUser.role === 'MANAGER' ? 'НАЧАЛЬНИК УЧАСТКА' : 'ПРИЕМЩИК';
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
        window.location.href = '/login.html';
    }
}

/* ==========================================================================
   ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
   ========================================================================== */

function switchManagerTab(tab) {
    document.querySelectorAll('#managerNav .nav-item').forEach(btn => btn.classList.remove('active'));
    document.getElementById('managerDashboardView').style.display = 'none';
    if (document.getElementById('managerKpiView')) document.getElementById('managerKpiView').style.display = 'none';
    document.getElementById('managerCalendarView').style.display = 'none';
    document.getElementById('managerArchiveView').style.display = 'none';
    document.getElementById('defectCreateView').style.display = 'none';
    document.getElementById('workerMyDefectsView').style.display = 'none';

    if (tab === 'dashboard') {
        event && event.target && event.target.classList.add('active');
        document.getElementById('managerDashboardView').style.display = 'block';
        loadDashboardMetrics();
        loadEntrancesFilter();
        loadApartmentsRegistry();
    } else if (tab === 'kpi') {
        event && event.target && event.target.classList.add('active');
        if (document.getElementById('managerKpiView')) {
            document.getElementById('managerKpiView').style.display = 'block';
        }
        loadEfficiencyMetrics();
    } else if (tab === 'calendar') {
        event && event.target && event.target.classList.add('active');
        document.getElementById('managerCalendarView').style.display = 'block';
        loadCalendar();
    } else if (tab === 'archive') {
        event && event.target && event.target.classList.add('active');
        document.getElementById('managerArchiveView').style.display = 'block';
        loadArchiveRegistry();
    } else if (tab === 'new-defect') {
        event && event.target && event.target.classList.add('active');
        document.getElementById('defectCreateView').style.display = 'block';
        resetDefectForm();
    }
}

function switchWorkerTab(tab) {
    document.querySelectorAll('#workerNav .nav-item').forEach(btn => btn.classList.remove('active'));
    document.getElementById('defectCreateView').style.display = 'none';
    document.getElementById('workerMyDefectsView').style.display = 'none';

    if (tab === 'create') {
        event && event.target && event.target.classList.add('active');
        document.getElementById('defectCreateView').style.display = 'block';
        resetDefectForm();
    } else if (tab === 'my-defects') {
        event && event.target && event.target.classList.add('active');
        document.getElementById('workerMyDefectsView').style.display = 'block';
        loadMyDefects();
    }
}

/* ==========================================================================
   ДАШБОРД РУКОВОДИТЕЛЯ
   ========================================================================== */

async function loadDashboardMetrics() {
    try {
        const resp = await fetch('/api/dashboard/metrics');
        if (resp.ok) {
            const m = await resp.json();
            document.getElementById('kpiApartmentsInWork').innerText = m.apartmentsInWork;
            document.getElementById('kpiOpenDefects').innerText = m.totalOpenDefects;
            document.getElementById('kpiUrgentDefects').innerText = m.urgentOpenDefects;
            document.getElementById('kpiClosedMonth').innerText = m.closedThisMonth;
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

        document.getElementById('aptModalTitle').innerText =
            `ПОДЪЕЗД ${apt.entranceNumber}, КВАРТИРА ${apt.apartmentNumber}`;

        const isArch = apt.isArchived;
        document.getElementById('aptModalSubtitle').innerHTML = isArch
            ? '<span class="badge badge-low">В АРХИВЕ</span>'
            : (apt.canArchive
                ? '<span class="badge badge-status-accepted">ВСЕ ДЕФЕКТЫ ПРИНЯТЫ &bull; ГОТОВА К АРХИВУ</span>'
                : '<span class="badge badge-status-progress">В РАБОТЕ СТРОИТЕЛЕЙ</span>');

        document.getElementById('aptModalSummaryText').innerHTML =
            `Активных замечаний: <strong style="color: ${apt.activeDefects.length > 0 ? '#ff6b6b' : '#66bb6a'}">${apt.activeDefects.length}</strong> | Принятых: <strong style="color: #66bb6a">${apt.acceptedDefects.length}</strong>`;

        const archiveBtn = document.getElementById('btnArchiveApartment');
        if (isArch) {
            archiveBtn.style.display = 'none';
        } else {
            archiveBtn.style.display = 'inline-flex';
            archiveBtn.disabled = !apt.canArchive;
            archiveBtn.title = apt.canArchive ? 'Отправить квартиру в архив' : 'Доступно только когда все дефекты приняты';
        }

        renderApartmentDefectsList('aptActiveDefectsContainer', apt.activeDefects, false);
        renderApartmentDefectsList('aptAcceptedDefectsContainer', apt.acceptedDefects, true);

        document.getElementById('activeDefectsCount').innerText = apt.activeDefects.length;
        document.getElementById('acceptedDefectsCount').innerText = apt.acceptedDefects.length;

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
    document.getElementById('calendarMonthTitle').innerText =
        `${monthNames[calendarCurrentMonth - 1]} ${calendarCurrentYear}`;

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
   КПД И АНАЛИТИКА ЭФФЕКТИВНОСТИ
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
        document.getElementById('kpiOverallRate').innerText = overall.toFixed(1) + '%';
        document.getElementById('kpiOverallBar').style.width = overall + '%';
        document.getElementById('kpiOverallSub').innerText = `${data.totalAccepted} из ${data.totalCreated} замечаний принято`;

        // КПД по срочным
        const urgent = Math.min(100, Math.max(0, data.urgentKpiPercent !== undefined ? data.urgentKpiPercent : (data.urgentResolutionRate || 0)));
        document.getElementById('kpiUrgentRate').innerText = urgent.toFixed(1) + '%';
        document.getElementById('kpiUrgentBar').style.width = urgent + '%';
        document.getElementById('kpiUrgentSub').innerText = `Закрытие критичных позиций: ${urgent.toFixed(1)}%`;

        // MTTR
        document.getElementById('kpiMttrValue').innerText = (data.avgResolutionHours || 0) + ' ч';
        document.getElementById('kpiAvgDays').innerText = `~ ${data.avgResolutionDays || 0} дн. на одно замечание`;

        // Скорость / Темп
        const badge = document.getElementById('kpiVelocityBadge');
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
        document.getElementById('kpiVelocitySub').innerText = `За неделю: +${data.weeklyOpened} открыто / ${data.weeklyClosed} закрыто`;

        // Детализация
        document.getElementById('kpiWeeklyOpened').innerText = data.weeklyOpened;
        document.getElementById('kpiWeeklyClosed').innerText = data.weeklyClosed;
        document.getElementById('kpiMonthlyOpened').innerText = data.monthlyOpened;
        document.getElementById('kpiMonthlyClosed').innerText = data.monthlyClosed;

        document.getElementById('kpiTotalCreated').innerText = data.totalCreated;
        document.getElementById('kpiTotalAccepted').innerText = data.totalAccepted;
        document.getElementById('kpiTotalInWork').innerText = data.totalInWork;
        document.getElementById('kpiVelocityStatusText').innerText = data.velocityStatus || 'Данные формируются';

        // Таблица приемщиков
        const tableBody = document.getElementById('workerStatsTableBody');
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
    } catch (e) {
        showToast('Ошибка загрузки аналитики: ' + e.message, 'error');
    }
}
