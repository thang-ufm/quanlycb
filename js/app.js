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
        btnReg.innerHTML = '<i class="fas fa-plus mr-2"></i> Đăng ký tuần';
        btnReg.addEventListener('click', openWeeklyTaskModal);
        actionButtons.appendChild(btnReg);
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
    tr.innerHTML = `
        <td class="px-2 py-2 whitespace-nowrap text-sm text-gray-500">${index}</td>
        <td class="px-2 py-2"><input type="text" class="w-full border-gray-300 rounded text-sm task-name" required></td>
        <td class="px-2 py-2"><input type="text" class="w-full border-gray-300 rounded text-sm task-main" required placeholder="VD: Nguyễn Văn A"></td>
        <td class="px-2 py-2"><input type="text" class="w-full border-gray-300 rounded text-sm task-sub" placeholder="VD: Trần B, Lê C"></td>
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
    const week = document.getElementById('weekSelection').value;
    if(!week) { alert('Vui lòng chọn tuần.'); return; }

    const rows = batchTaskRows.querySelectorAll('tr');
    let hasError = false;
    const tasksToPush = [];

    rows.forEach(row => {
        const name = row.querySelector('.task-name').value.trim();
        const main = row.querySelector('.task-main').value.trim();
        const sub = row.querySelector('.task-sub').value.trim();
        const priority = row.querySelector('.task-priority').value;
        const deadline = row.querySelector('.task-deadline').value;

        if(!name || !main || !deadline) {
            hasError = true;
            return;
        }

        tasksToPush.push({
            name,
            week,
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

function setupModals() {
    // Close modal handlers
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            modalWeeklyTask.classList.add('hidden');
            document.getElementById('modalEditTask').classList.add('hidden');
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
        const table = document.getElementById('tasksTable');
        // Clone table to manipulate for export (remove action column)
        const cloneTable = table.cloneNode(true);

        // Remove the last column (Thao tác) from header and body
        const ths = cloneTable.querySelectorAll('th');
        if(ths.length > 0) ths[ths.length-1].remove();

        const trs = cloneTable.querySelectorAll('tbody tr');
        trs.forEach(tr => {
            const tds = tr.querySelectorAll('td');
            if(tds.length > 0) tds[tds.length-1].remove();
        });

        const wb = XLSX.utils.table_to_book(cloneTable, {sheet:"Tasks"});
        XLSX.writeFile(wb, "DanhSachCongViec.xlsx");
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
