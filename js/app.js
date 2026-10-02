import { database } from './firebase-config.js';
import { ref, onValue, push, set, update, remove } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";
import { initAuth, getCurrentUser } from './auth.js';
import { checkAndSeedData } from './seed.js';

// --- DATA MAPPINGS ---
export const deptCodeMap = {
    'BGD': 'Ban Giám đốc',
    'DT_KH_QLSV': 'Phòng Đào tạo - KH & QLSV',
    'HCTV': 'Phòng Hành chính – Tài vụ'
};

export const deptColorMap = {
    'BGD': 'bg-purple-100 text-purple-800 border-purple-200',
    'DT_KH_QLSV': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'HCTV': 'bg-blue-100 text-blue-800 border-blue-200'
};

export const statusMap = {
    'CHO_DUYET': { text: 'Chờ duyệt', class: 'bg-orange-100 text-orange-800' },
    'CHO_BGD_DUYET': { text: 'Chờ BGD Duyệt', class: 'bg-yellow-100 text-yellow-800' },
    'DANG_THUC_HIEN': { text: 'Đang thực hiện', class: 'bg-blue-100 text-blue-800' },
    'YEU_CAU_SUA': { text: 'Yêu cầu sửa', class: 'bg-red-100 text-red-800' },
    'HOAN_THANH': { text: 'Hoàn thành', class: 'bg-green-100 text-green-800' }
};

// Global state
let allTasks = {};
let allUsers = {};
let currentUser = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    await checkAndSeedData();
    initAuth((user) => {
        currentUser = user;
        if (user) {
            setupRBACUI();
            fetchData();
        }
    });

    setupModals();
    setupFilters();
    setupExport();
});

// --- RBAC UI SETUP ---
function setupRBACUI() {
    const actionButtons = document.getElementById('actionButtons');
    actionButtons.innerHTML = ''; // Clear existing

    // Show "Đăng ký công việc" button only if not BGD
    if (currentUser.role === 'NHAN_VIEN' || currentUser.role === 'TRUONG_PHONG') {
        const btnReg = document.createElement('button');
        btnReg.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm text-sm font-medium transition flex items-center';
        btnReg.innerHTML = '<i class="fas fa-plus mr-2"></i> Đăng ký';
        btnReg.addEventListener('click', openWeeklyTaskModal);
        actionButtons.appendChild(btnReg);
    }

    if (currentUser.role === 'BGD') {
        const btnAssign = document.createElement('button');
        btnAssign.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm text-sm font-medium transition flex items-center';
        btnAssign.innerHTML = '<i class="fas fa-plus mr-2"></i> Giao việc';
        btnAssign.addEventListener('click', openAssignTaskModal);
        actionButtons.appendChild(btnAssign);
    }
}

// --- FIREBASE INTERACTIONS ---
function fetchData() {
    const tasksRef = ref(database, 'tasks');
    onValue(tasksRef, (snapshot) => {
        const data = snapshot.val();
        allTasks = data || {};
        renderTable();
    });

    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
        allUsers = snapshot.val() || {};
    });
}

// --- MODAL & FORM LOGIC: WEEKLY TASK ---
const modalWeeklyTask = document.getElementById('modalWeeklyTask');
const batchTaskRows = document.getElementById('batchTaskRows');
const btnAddRow = document.getElementById('btnAddRow');
const btnSubmitWeekly = document.getElementById('btnSubmitWeekly');

function openWeeklyTaskModal() {
    modalWeeklyTask.classList.remove('hidden');
    document.getElementById('regDeptName').value = deptCodeMap[currentUser.deptCode] || currentUser.deptCode;

    // Set current week as default
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    document.getElementById('weekSelection').value = `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;

    // Clear existing and add 3 default rows
    batchTaskRows.innerHTML = '';
    for(let i=0; i<3; i++) addWeeklyTaskRow();
}

function addWeeklyTaskRow() {
    const tr = document.createElement('tr');
    const index = batchTaskRows.children.length + 1;

    let subOptions = '';
    for (const key in allUsers) {
        const u = allUsers[key];
        if (u.deptCode === 'HCTV' || u.deptCode === 'DT_KH_QLSV') {
            subOptions += `<option value="${u.fullName}">${u.fullName} (${u.deptCode})</option>`;
        }
    }

    tr.innerHTML = `
        <td class="px-2 py-2 whitespace-nowrap text-sm text-gray-500">${index}</td>
        <td class="px-2 py-2"><input type="text" class="w-full border-gray-300 rounded text-sm task-name" required></td>
        <td class="px-2 py-2"><input type="text" class="w-full bg-gray-100 border-gray-300 rounded text-sm task-main text-gray-600" required readonly value="${currentUser.fullName}"></td>
        <td class="px-2 py-2">
            <select multiple class="w-full border-gray-300 rounded text-sm task-sub" size="2">
                ${subOptions}
            </select>
        </td>
        <td class="px-2 py-2">
            <select class="w-full border-gray-300 rounded text-sm task-priority">
                <option value="Bình thường">Bình thường</option>
                <option value="Cao">Cao</option>
            </select>
        </td>
        <td class="px-2 py-2"><input type="date" class="w-full border-gray-300 rounded text-sm task-deadline" required></td>
        <td class="px-2 py-2 text-center">
            <button type="button" class="text-red-500 hover:text-red-700 btn-delete-row"><i class="fas fa-trash"></i></button>
        </td>
    `;

    tr.querySelector('.btn-delete-row').addEventListener('click', function() {
        if (batchTaskRows.children.length > 1) {
            tr.remove();
            updateRowIndices();
        } else {
            alert('Phải có ít nhất 1 dòng công việc.');
        }
    });
    batchTaskRows.appendChild(tr);
}

function updateRowIndices() {
    Array.from(batchTaskRows.children).forEach((tr, index) => {
        tr.querySelector('td').innerText = index + 1;
    });
}

btnAddRow.addEventListener('click', addWeeklyTaskRow);

btnSubmitWeekly.addEventListener('click', async () => {
    const regType = document.getElementById('regTypeSelection').value;
    let periodValue = '';

    if (regType === 'week') {
        periodValue = document.getElementById('weekSelection').value;
        if(!periodValue) { alert('Vui lòng chọn tuần.'); return; }
    } else if (regType === 'month') {
        periodValue = document.getElementById('monthSelection').value;
        if(!periodValue) { alert('Vui lòng chọn tháng.'); return; }
    } else if (regType === 'quarter') {
        const q = document.getElementById('quarterSelection').value;
        const y = document.getElementById('quarterYearSelection').value;
        if(!y) { alert('Vui lòng nhập năm cho quý.'); return; }
        periodValue = `${q}-${y}`;
    }

    const rows = batchTaskRows.querySelectorAll('tr');
    let hasError = false;
    const tasksToPush = [];

    rows.forEach(row => {
        const name = row.querySelector('.task-name').value.trim();
        const main = row.querySelector('.task-main').value.trim();

        const subSelect = row.querySelector('.task-sub');
        const selectedSubs = Array.from(subSelect.selectedOptions).map(opt => opt.value);
        const sub = selectedSubs.join(', ');

        const priority = row.querySelector('.task-priority').value;
        const deadline = row.querySelector('.task-deadline').value;

        if(!name || !main || !deadline) {
            hasError = true;
            return;
        }

        tasksToPush.push({
            name,
            week: periodValue, // Keep property name 'week' for backward compatibility or change to 'period' if needed
            deptCode: currentUser.deptCode,
            host: currentUser.deptCode === 'BGD' ? 'Ban Giám đốc' : deptCodeMap[currentUser.deptCode],
            mainAssignee: main,
            subAssignees: sub,
            priority,
            deadline,
            status: 'CHO_DUYET', // Default for new tasks
            progress: 0,
            evidenceUrl: '',
            feedback: '',
            createdAt: new Date().toISOString()
        });
    });

    if(hasError) {
        alert('Vui lòng điền đầy đủ Tên công việc, Phụ trách chính và Hạn chót ở tất cả các dòng.');
        return;
    }

    try {
        const tasksRef = ref(database, 'tasks');
        for (const task of tasksToPush) {
            await push(tasksRef, task);
        }
        alert('Đăng ký công việc thành công!');
        modalWeeklyTask.classList.add('hidden');
    } catch(err) {
        console.error("Error saving tasks: ", err);
        alert('Có lỗi xảy ra khi lưu dữ liệu.');
    }
});

function openAssignTaskModal() {
    const modal = document.getElementById('modalAssignTask');
    modal.classList.remove('hidden');
    document.getElementById('formAssignTask').reset();
    populateAssignTarget();
}

function populateAssignTarget() {
    const assignType = document.getElementById('assignType').value;
    const assignTarget = document.getElementById('assignTarget');
    assignTarget.innerHTML = '';

    if (assignType === 'PHONG') {
        for (const code in deptCodeMap) {
            assignTarget.innerHTML += `<option value="${code}">${deptCodeMap[code]}</option>`;
        }
    } else {
        for (const key in allUsers) {
            const u = allUsers[key];
            assignTarget.innerHTML += `<option value="${u.fullName}">${u.fullName} (${u.deptCode})</option>`;
        }
    }
}

document.getElementById('assignType')?.addEventListener('change', populateAssignTarget);

document.getElementById('btnSubmitAssign')?.addEventListener('click', async () => {
    const type = document.getElementById('assignType').value;
    const target = document.getElementById('assignTarget').value;
    const name = document.getElementById('assignTaskName').value.trim();
    const priority = document.getElementById('assignPriority').value;
    const deadline = document.getElementById('assignDeadline').value;

    if (!name || !deadline) {
        alert('Vui lòng nhập đầy đủ thông tin Tên công việc và Hạn chót!');
        return;
    }

    const task = {
        name,
        week: 'Giao trực tiếp', // Default placeholder if week is strictly needed
        deptCode: type === 'PHONG' ? target : 'ALL',
        host: 'Ban Giám đốc',
        mainAssignee: type === 'CA_NHAN' ? target : `Toàn ${deptCodeMap[target] || target}`,
        subAssignees: '',
        priority,
        deadline,
        status: 'DANG_THUC_HIEN',
        progress: 0,
        evidenceUrl: '',
        feedback: '',
        createdAt: new Date().toISOString()
    };

    try {
        await push(ref(database, 'tasks'), task);
        alert('Giao việc thành công!');
        document.getElementById('modalAssignTask').classList.add('hidden');
    } catch (e) {
        console.error("Error creating task: ", e);
        alert('Có lỗi xảy ra khi tạo công việc mới.');
    }
});

function setupModals() {
    // Event listener cho Select regTypeSelection trong formWeeklyTask
    document.getElementById('regTypeSelection')?.addEventListener('change', function() {
        const type = this.value;
        const weekInput = document.getElementById('weekSelection');
        const monthInput = document.getElementById('monthSelection');
        const quarterContainer = document.getElementById('quarterSelectionContainer');

        weekInput.classList.add('hidden');
        monthInput.classList.add('hidden');
        quarterContainer.classList.add('hidden');

        if(type === 'week') {
            weekInput.classList.remove('hidden');
        } else if (type === 'month') {
            monthInput.classList.remove('hidden');
        } else if (type === 'quarter') {
            quarterContainer.classList.remove('hidden');
            quarterContainer.classList.add('flex');
        }
    });

    // Close modal handlers
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            modalWeeklyTask.classList.add('hidden');
            document.getElementById('modalEditTask').classList.add('hidden');
            const assignModal = document.getElementById('modalAssignTask');
            if (assignModal) assignModal.classList.add('hidden');
            const exportModal = document.getElementById('modalExportExcel');
            if (exportModal) exportModal.classList.add('hidden');
        });
    });
}

// Global functions need to be attached to window or exported if used directly in HTML
window.openWeeklyTaskModal = openWeeklyTaskModal;

// --- FILTERING & RENDERING TABLE ---
const filterDept = document.getElementById('filterDept');
const filterStatus = document.getElementById('filterStatus');

function setupFilters() {
    filterDept.addEventListener('change', renderTable);
    filterStatus.addEventListener('change', renderTable);
}

function renderTable() {
    const tbody = document.getElementById('tasksTableBody');
    tbody.innerHTML = '';

    if (!allTasks || Object.keys(allTasks).length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-500">Chưa có công việc nào.</td></tr>';
        return;
    }

    const dFilter = filterDept.value;
    const sFilter = filterStatus.value;

    let index = 1;
    for (const [taskId, task] of Object.entries(allTasks)) {

        // RBAC View Logic
        // SUPER_ADMIN and BGD see all. Truong Phong / Pho Phong / Nhan Vien see their dept only, unless specifically filtering (handled below)
        if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'BGD' && task.deptCode !== currentUser.deptCode) {
            continue;
        }

        // Apply Dept Filter
        if (dFilter === 'MY_TASKS') {
            // Very simple check for demo purposes: does their name/dept match somehow?
            // In a real app, we'd check if user.name == task.mainAssignee. Here we just check dept.
            if (task.deptCode !== currentUser.deptCode) continue;
        } else if (dFilter !== 'ALL' && task.deptCode !== dFilter) {
            continue;
        }

        // Apply Status Filter
        if (sFilter !== 'ALL' && task.status !== sFilter) {
            continue;
        }

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50';

        const badgeColor = deptColorMap[task.deptCode] || 'bg-gray-100 text-gray-800';
        const deptName = deptCodeMap[task.deptCode] || task.deptCode;

        const sInfo = statusMap[task.status] || {text: task.status, class: 'bg-gray-100 text-gray-800'};

        const evidenceHtml = task.evidenceUrl
            ? `<a href="${task.evidenceUrl}" target="_blank" class="text-blue-500 hover:text-blue-700 ml-2" title="Xem minh chứng"><i class="fab fa-google-drive"></i></a>`
            : '';

        tr.innerHTML = `
            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${index++}</td>
            <td class="px-4 py-4 text-sm font-medium text-gray-900">${escapeHtml(task.name)}</td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${badgeColor}">
                    ${deptName}
                </span>
            </td>
            <td class="px-4 py-4 text-sm text-gray-700">
                <div class="font-bold">${escapeHtml(task.mainAssignee)}</div>
                <div class="text-xs text-gray-500">${escapeHtml(task.subAssignees || '')}</div>
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">${task.priority}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sInfo.class}">
                    ${sInfo.text}
                </span>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="flex items-center">
                    <div class="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[4rem]">
                        <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${task.progress || 0}%"></div>
                    </div>
                    <span>${task.progress || 0}%</span>
                    ${evidenceHtml}
                </div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${task.deadline}</td>
            <td class="px-3 py-4 whitespace-nowrap text-center text-sm font-medium">
                <button onclick="openEditModal('${taskId}')" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded px-2 py-1"><i class="fas fa-edit"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

// --- EDIT MODAL LOGIC ---
window.openEditModal = function(taskId) {
    const task = allTasks[taskId];
    if(!task) return;

    document.getElementById('editTaskId').value = taskId;
    document.getElementById('editTaskName').value = task.name;
    document.getElementById('editStatus').value = task.status;
    document.getElementById('editProgress').value = task.progress || 0;
    document.getElementById('editEvidence').value = task.evidenceUrl || '';
    document.getElementById('editFeedback').value = task.feedback || '';

    // Reset inputs & buttons state based on role
    const modal = document.getElementById('modalEditTask');
    const btnSave = document.getElementById('btnSaveTask');
    const btnApprove = document.getElementById('btnApproveTask');
    const btnReject = document.getElementById('btnRejectTask');
    const feedbackArea = document.getElementById('feedbackArea');

    // Default disable all
    document.getElementById('editStatus').disabled = true;
    document.getElementById('editProgress').disabled = true;
    document.getElementById('editEvidence').disabled = true;
    document.getElementById('editFeedback').disabled = true;

    btnSave.classList.add('hidden');
    btnApprove.classList.add('hidden');
    btnReject.classList.add('hidden');
    feedbackArea.classList.add('hidden');

    // RBAC for editing
    if (currentUser.role === 'NHAN_VIEN' || currentUser.role === 'TRUONG_PHONG' || currentUser.role === 'PHO_PHONG') {
        if (task.status === 'DANG_THUC_HIEN' || task.status === 'YEU_CAU_SUA') {
            document.getElementById('editProgress').disabled = false;
            document.getElementById('editEvidence').disabled = false;

            // Allow changing status to complete if progress is 100
            document.getElementById('editStatus').disabled = false;

            btnSave.classList.remove('hidden');
        }
    }

    if (currentUser.role === 'BGD' || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'TRUONG_PHONG' || currentUser.role === 'PHO_PHONG') {
        if (task.status === 'CHO_DUYET' || task.status === 'CHO_BGD_DUYET') {
            btnApprove.classList.remove('hidden');
            btnReject.classList.remove('hidden');
            feedbackArea.classList.remove('hidden');
            document.getElementById('editFeedback').disabled = false;
        }
        if (task.status === 'YEU_CAU_SUA' || task.status === 'HOAN_THANH') {
             feedbackArea.classList.remove('hidden');
             document.getElementById('editFeedback').disabled = true;
        }
    }

    modal.classList.remove('hidden');
};

document.getElementById('btnSaveTask').addEventListener('click', async () => {
    const taskId = document.getElementById('editTaskId').value;
    const progress = document.getElementById('editProgress').value;
    const evidenceUrl = document.getElementById('editEvidence').value;
    let status = document.getElementById('editStatus').value;

    if (parseInt(progress) === 100) status = 'HOAN_THANH';

    try {
        await update(ref(database, 'tasks/' + taskId), { progress, evidenceUrl, status });
        document.getElementById('modalEditTask').classList.add('hidden');
    } catch (e) { console.error(e); alert('Error updating task'); }
});

document.getElementById('btnApproveTask').addEventListener('click', async () => {
    const taskId = document.getElementById('editTaskId').value;
    const feedback = document.getElementById('editFeedback').value;
    try {
        await update(ref(database, 'tasks/' + taskId), { status: 'DANG_THUC_HIEN', feedback });
        document.getElementById('modalEditTask').classList.add('hidden');
    } catch (e) { console.error(e); alert('Error approving task'); }
});

document.getElementById('btnRejectTask').addEventListener('click', async () => {
    const taskId = document.getElementById('editTaskId').value;
    const feedback = document.getElementById('editFeedback').value;
    if(!feedback.trim()) { alert('Vui lòng nhập lý do yêu cầu sửa!'); return; }
    try {
        await update(ref(database, 'tasks/' + taskId), { status: 'YEU_CAU_SUA', feedback });
        document.getElementById('modalEditTask').classList.add('hidden');
    } catch (e) { console.error(e); alert('Error rejecting task'); }
});


// --- EXPORT TO EXCEL ---
function setupExport() {
    document.getElementById('btnExportExcel').addEventListener('click', () => {
        document.getElementById('modalExportExcel').classList.remove('hidden');
    });

    document.getElementById('exportTimeRange')?.addEventListener('change', function() {
        const customRange = document.getElementById('exportCustomRange');
        if (this.value === 'CUSTOM') {
            customRange.classList.remove('hidden');
        } else {
            customRange.classList.add('hidden');
        }
    });

    document.getElementById('btnConfirmExport')?.addEventListener('click', () => {
        const timeRange = document.getElementById('exportTimeRange').value;
        const startDate = document.getElementById('exportStartDate').value;
        const endDate = document.getElementById('exportEndDate').value;

        // Custom time range validation
        let startObj = null, endObj = null;
        if (timeRange === 'CUSTOM') {
            if (!startDate || !endDate) {
                alert('Vui lòng chọn Từ ngày và Đến ngày');
                return;
            }
            startObj = new Date(startDate);
            endObj = new Date(endDate);
            endObj.setHours(23, 59, 59, 999);
        }

        const dataToExport = [];
        let index = 1;

        for (const [taskId, task] of Object.entries(allTasks)) {
            // RBAC Filter
            if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'BGD') {
                if (currentUser.role === 'TRUONG_PHONG' || currentUser.role === 'PHO_PHONG') {
                    if (task.deptCode !== currentUser.deptCode) continue;
                } else if (currentUser.role === 'NHAN_VIEN') {
                    if (task.mainAssignee !== currentUser.fullName && (!task.subAssignees || !task.subAssignees.includes(currentUser.fullName))) {
                        continue;
                    }
                }
            }

            // Time Filter
            let taskDateStr = task.createdAt || task.deadline;
            if (!taskDateStr) continue;
            let taskDate = new Date(taskDateStr);
            let inRange = false;
            let today = new Date();

            if (timeRange === 'ALL') {
                inRange = true; // Fallback
            } else if (timeRange === 'WEEK') {
                const dayNum = today.getUTCDay() || 7;
                today.setUTCDate(today.getUTCDate() + 4 - dayNum);
                const yearStart = new Date(Date.UTC(today.getUTCFullYear(),0,1));
                const weekNoCurrent = Math.ceil((((today - yearStart) / 86400000) + 1)/7);

                let taskD = new Date(taskDateStr);
                const taskDayNum = taskD.getUTCDay() || 7;
                taskD.setUTCDate(taskD.getUTCDate() + 4 - taskDayNum);
                const taskYearStart = new Date(Date.UTC(taskD.getUTCFullYear(),0,1));
                const weekNoTask = Math.ceil((((taskD - taskYearStart) / 86400000) + 1)/7);

                if(weekNoTask === weekNoCurrent && taskD.getUTCFullYear() === today.getUTCFullYear()) inRange = true;

            } else if (timeRange === 'MONTH') {
                if (taskDate.getMonth() === today.getMonth() && taskDate.getFullYear() === today.getFullYear()) {
                    inRange = true;
                }
            } else if (timeRange === 'QUARTER') {
                const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
                const taskQuarter = Math.floor(taskDate.getMonth() / 3) + 1;
                if (taskQuarter === currentQuarter && taskDate.getFullYear() === today.getFullYear()) {
                    inRange = true;
                }
            } else if (timeRange === 'CUSTOM') {
                if (taskDate >= startObj && taskDate <= endObj) {
                    inRange = true;
                }
            }

            if (!inRange) continue;

            const evidenceCell = task.evidenceUrl || '';
            const statusText = statusMap[task.status] ? statusMap[task.status].text : task.status;
            const deptText = deptCodeMap[task.deptCode] || task.deptCode;

            dataToExport.push({
                "STT": index++,
                "Tên công việc": task.name,
                "Đơn vị chủ trì": deptText,
                "Người thực hiện": task.mainAssignee + (task.subAssignees ? ` (Phối hợp: ${task.subAssignees})` : ''),
                "Ưu tiên": task.priority,
                "Trạng thái": statusText,
                "Tiến độ (%)": task.progress || 0,
                "Minh chứng": evidenceCell,
                "Hạn chót": task.deadline
            });
        }

        if (dataToExport.length === 0) {
            alert('Không có dữ liệu trong khoảng thời gian đã chọn.');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Tasks");
        XLSX.writeFile(wb, "DanhSachCongViec.xlsx");

        document.getElementById('modalExportExcel').classList.add('hidden');
    });
}

// Utils
function escapeHtml(unsafe) {
    if(!unsafe) return '';
    return unsafe
         .toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
