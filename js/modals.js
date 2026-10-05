import { database } from './firebase-config.js';
import { ref, push, update } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";
import { getAllTasks, getAllUsers, getCurrentUser } from './store.js';
import { deptCodeMap } from './tasks.js';

import { setCurrentUser } from './store.js';

// --- MODAL: WEEKLY TASK ---
export function openWeeklyTaskModal() {
    const modalWeeklyTask = document.getElementById('modalWeeklyTask');
    const batchTaskRows = document.getElementById('batchTaskRows');
    const currentUser = getCurrentUser();

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
    const batchTaskRows = document.getElementById('batchTaskRows');
    const currentUser = getCurrentUser();
    const allUsers = getAllUsers();

    const tr = document.createElement('tr');
    const index = batchTaskRows.children.length + 1;

    let subOptions = '';
    for (const key in allUsers) {
        const u = allUsers[key];
        if (u.deptCode === 'HCTV' || u.deptCode === 'DT_KH_QLSV') {
            subOptions += `<label class="block px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm">
                <input type="checkbox" class="mr-2 task-sub-checkbox" value="${u.fullName}">${u.fullName} (${u.deptCode})
            </label>`;
        }
    }

    tr.innerHTML = `
        <td class="px-2 py-2 whitespace-nowrap text-sm text-gray-500">${index}</td>
        <td class="px-2 py-2"><input type="text" class="w-full border-gray-300 rounded text-sm task-name" required></td>
        <td class="px-2 py-2"><input type="text" class="w-full bg-gray-100 border-gray-300 rounded text-sm task-main text-gray-600" required readonly value="${currentUser.fullName}"></td>
        <td class="px-2 py-2">
            <div class="relative custom-dropdown-container">
                <button type="button" class="w-full border border-gray-300 rounded text-sm py-1 px-2 text-left bg-white text-gray-700 toggle-dropdown flex justify-between items-center">
                    <span>Chọn...</span>
                    <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
                </button>
                <div class="absolute z-10 hidden bg-white border border-gray-300 mt-1 max-h-32 overflow-y-auto w-full shadow-lg dropdown-menu rounded-md">
                    ${subOptions}
                </div>
            </div>
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

    // Toggle dropdown logic
    const dropdownBtn = tr.querySelector('.toggle-dropdown');
    const dropdownMenu = tr.querySelector('.dropdown-menu');
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // Close other dropdowns
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            if (menu !== dropdownMenu) menu.classList.add('hidden');
        });

        dropdownMenu.classList.toggle('hidden');
    });

    // Update dropdown button text when checkboxes change
    const checkboxes = tr.querySelectorAll('.task-sub-checkbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const checkedCount = tr.querySelectorAll('.task-sub-checkbox:checked').length;
            const btnTextSpan = dropdownBtn.querySelector('span');
            if (checkedCount === 0) {
                btnTextSpan.textContent = 'Chọn...';
            } else {
                btnTextSpan.textContent = `Đã chọn ${checkedCount}`;
            }
        });
    });

    batchTaskRows.appendChild(tr);
}

function updateRowIndices() {
    const batchTaskRows = document.getElementById('batchTaskRows');
    Array.from(batchTaskRows.children).forEach((tr, index) => {
        tr.querySelector('td').innerText = index + 1;
    });
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-dropdown-container')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.add('hidden');
        });
    }
});

// --- MODAL: ASSIGN TASK ---
export function openAssignTaskModal() {
    const modal = document.getElementById('modalAssignTask');
    modal.classList.remove('hidden');
    document.getElementById('formAssignTask').reset();
    populateAssignTarget();
}

function populateAssignTarget() {
    const assignType = document.getElementById('assignType').value;
    const assignTarget = document.getElementById('assignTarget');
    const assignSubTarget = document.getElementById('assignSubTarget');
    const assignSubTargetContainer = document.getElementById('assignSubTargetContainer');
    const allUsers = getAllUsers();

    assignTarget.innerHTML = '';
    if (assignSubTarget) assignSubTarget.innerHTML = '';

    if (assignType === 'PHONG') {
        if (assignSubTargetContainer) assignSubTargetContainer.classList.add('hidden');
        for (const code in deptCodeMap) {
            assignTarget.innerHTML += `<option value="${code}">${deptCodeMap[code]}</option>`;
        }
    } else {
        if (assignSubTargetContainer) assignSubTargetContainer.classList.remove('hidden');
        for (const key in allUsers) {
            const u = allUsers[key];
            assignTarget.innerHTML += `<option value="${u.fullName}">${u.fullName} (${u.deptCode})</option>`;
            if (assignSubTarget) {
                assignSubTarget.innerHTML += `<option value="${u.fullName}">${u.fullName} (${u.deptCode})</option>`;
            }
        }
    }
}

// --- MODAL: EDIT TASK ---
export function openEditModal(taskId) {
    const allTasks = getAllTasks();
    const currentUser = getCurrentUser();
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

    // Check if the current user is an assignee
    const primary = task.primaryAssignee || task.mainAssignee || '';
    const secondary = task.secondaryAssignees || task.subAssignees || '';
    const isMyTask = primary === currentUser.fullName || primary === currentUser.email ||
                     secondary.includes(currentUser.fullName) || secondary.includes(currentUser.email);

    // RBAC for editing
    if (currentUser.role === 'NHAN_VIEN' || currentUser.role === 'TRUONG_PHONG' || currentUser.role === 'PHO_PHONG') {
        if (task.status === 'DANG_THUC_HIEN' || task.status === 'YEU_CAU_SUA') {
            document.getElementById('editProgress').disabled = false;
            // Allow changing status to complete if progress is 100
            document.getElementById('editStatus').disabled = false;
            btnSave.classList.remove('hidden');
        }

        // Always allow editing evidence for assignee
        if (isMyTask || currentUser.role === 'TRUONG_PHONG' || currentUser.role === 'PHO_PHONG') {
            document.getElementById('editEvidence').disabled = false;
            btnSave.classList.remove('hidden');
        }
    }

    if (currentUser.role === 'BGD' || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'TRUONG_PHONG' || currentUser.role === 'PHO_PHONG') {
        // Always show feedback area for managers
        feedbackArea.classList.remove('hidden');
        document.getElementById('editFeedback').disabled = false;
        btnSave.classList.remove('hidden');

        if (task.status === 'CHO_DUYET' || task.status === 'CHO_BGD_DUYET') {
            btnApprove.classList.remove('hidden');
            btnReject.classList.remove('hidden');
        }
    }

    modal.classList.remove('hidden');
}

export function setupModals() {
    const modalWeeklyTask = document.getElementById('modalWeeklyTask');

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
            const passModal = document.getElementById('modalChangePassword');
            if (passModal) passModal.classList.add('hidden');
        });
    });

    document.getElementById('btnAddRow')?.addEventListener('click', addWeeklyTaskRow);

    document.getElementById('btnSubmitWeekly')?.addEventListener('click', async () => {
        const currentUser = getCurrentUser();
        const batchTaskRows = document.getElementById('batchTaskRows');
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

            const checkedBoxes = row.querySelectorAll('.task-sub-checkbox:checked');
            const selectedSubs = Array.from(checkedBoxes).map(cb => cb.value);
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

    document.getElementById('assignType')?.addEventListener('change', populateAssignTarget);

    document.getElementById('btnSubmitAssign')?.addEventListener('click', async () => {
        const type = document.getElementById('assignType').value;
        const target = document.getElementById('assignTarget').value;
        const name = document.getElementById('assignTaskName').value.trim();
        const priority = document.getElementById('assignPriority').value;
        const deadline = document.getElementById('assignDeadline').value;

        let subAssigneesStr = '';
        if (type === 'CA_NHAN') {
            const subSelect = document.getElementById('assignSubTarget');
            if (subSelect) {
                const selectedSubs = Array.from(subSelect.selectedOptions).map(opt => opt.value);
                const filteredSubs = selectedSubs.filter(sub => sub !== target);
                subAssigneesStr = filteredSubs.join(', ');
            }
        }

        if (!name || !deadline) {
            alert('Vui lòng nhập đầy đủ thông tin Tên công việc và Hạn chót!');
            return;
        }

        const task = {
            name,
            week: 'Giao trực tiếp', // Default placeholder if week is strictly needed
            deptCode: type === 'PHONG' ? target : 'ALL',
            host: 'Ban Giám đốc',
            primaryAssignee: type === 'CA_NHAN' ? target : `Toàn ${deptCodeMap[target] || target}`,
            secondaryAssignees: subAssigneesStr,
            mainAssignee: type === 'CA_NHAN' ? target : `Toàn ${deptCodeMap[target] || target}`, // Giữ lại mainAssignee cho tương thích ngược
            subAssignees: subAssigneesStr, // Giữ lại subAssignees cho tương thích ngược
            priority,
            deadline,
            status: 'MOI_GIAO',
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

    document.getElementById('btnSaveTask')?.addEventListener('click', async () => {
        const taskId = document.getElementById('editTaskId').value;
        const progress = document.getElementById('editProgress').value;
        const evidenceUrl = document.getElementById('editEvidence').value;
        let status = document.getElementById('editStatus').value;
        const feedback = document.getElementById('editFeedback').value;

        if (parseInt(progress) === 100) status = 'HOAN_THANH';

        try {
            await update(ref(database, 'tasks/' + taskId), { progress, evidenceUrl, status, feedback });
            document.getElementById('modalEditTask').classList.add('hidden');
        } catch (e) { console.error(e); alert('Error updating task'); }
    });

    document.getElementById('btnApproveTask')?.addEventListener('click', async () => {
        const taskId = document.getElementById('editTaskId').value;
        const feedback = document.getElementById('editFeedback').value;
        try {
            await update(ref(database, 'tasks/' + taskId), { status: 'DANG_THUC_HIEN', feedback });
            document.getElementById('modalEditTask').classList.add('hidden');
        } catch (e) { console.error(e); alert('Error approving task'); }
    });

    document.getElementById('btnRejectTask')?.addEventListener('click', async () => {
        const taskId = document.getElementById('editTaskId').value;
        const feedback = document.getElementById('editFeedback').value;
        if(!feedback.trim()) { alert('Vui lòng nhập lý do yêu cầu sửa!'); return; }
        try {
            await update(ref(database, 'tasks/' + taskId), { status: 'YEU_CAU_SUA', feedback });
            document.getElementById('modalEditTask').classList.add('hidden');
        } catch (e) { console.error(e); alert('Error rejecting task'); }
    });

    document.getElementById('btnSubmitChangePass')?.addEventListener('click', handleChangePasswordSubmit);
}

// --- MODAL: CHANGE PASSWORD ---
export function openChangePasswordModal() {
    const modal = document.getElementById('modalChangePassword');
    document.getElementById('formChangePassword').reset();
    document.getElementById('changePassError').classList.add('hidden');
    document.getElementById('changePassSuccess').classList.add('hidden');
    modal.classList.remove('hidden');
}

async function handleChangePasswordSubmit() {
    const errorMsg = document.getElementById('changePassError');
    const successMsg = document.getElementById('changePassSuccess');
    const currentPass = document.getElementById('currentPassword').value.trim();
    const newPass = document.getElementById('newPassword').value.trim();
    const confirmPass = document.getElementById('confirmNewPassword').value.trim();

    errorMsg.classList.add('hidden');
    successMsg.classList.add('hidden');

    if (!currentPass || !newPass || !confirmPass) {
        showError(errorMsg, 'Vui lòng nhập đầy đủ thông tin!');
        return;
    }

    if (newPass.length < 6) {
        showError(errorMsg, 'Mật khẩu mới phải có ít nhất 6 ký tự!');
        return;
    }

    if (newPass !== confirmPass) {
        showError(errorMsg, 'Xác nhận mật khẩu không khớp!');
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const allUsers = getAllUsers();
    let userKey = null;

    // Find the current user's key in the DB to update them
    for (const key in allUsers) {
        if (allUsers[key].email === currentUser.email) {
            userKey = key;
            break;
        }
    }

    if (!userKey) {
        showError(errorMsg, 'Không tìm thấy thông tin tài khoản trên hệ thống!');
        return;
    }

    // Verify current password against stored DB state
    if (allUsers[userKey].password !== currentPass) {
        showError(errorMsg, 'Mật khẩu hiện tại không đúng!');
        return;
    }

    try {
        await update(ref(database, `users/${userKey}`), { password: newPass });
        successMsg.classList.remove('hidden');

        // Clear fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';

        // Hide modal after short delay
        setTimeout(() => {
            document.getElementById('modalChangePassword').classList.add('hidden');
        }, 1500);

    } catch (e) {
        console.error(e);
        showError(errorMsg, 'Lỗi cập nhật mật khẩu trên hệ thống!');
    }
}

function showError(element, msg) {
    element.textContent = msg;
    element.classList.remove('hidden');
}
