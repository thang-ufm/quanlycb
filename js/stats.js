import { getAllTasks, getCurrentUser } from './store.js';
import { deptCodeMap, statusMap } from './tasks.js';

export function updateStatisticsCards() {
    const allTasks = getAllTasks();
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    let total = 0, completed = 0, inProgress = 0, overdue = 0;

    for (const [taskId, task] of Object.entries(allTasks)) {
        const primary = task.primaryAssignee || task.mainAssignee || '';
        const secondary = task.secondaryAssignees || task.subAssignees || '';
        const isMyTask = primary === currentUser.fullName || primary === currentUser.email ||
                         secondary.includes(currentUser.fullName) || secondary.includes(currentUser.email) ||
                         (task.host === 'Ban Giám đốc' && primary === currentUser.fullName);

        let hasAccess = false;
        if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'BGD') {
            if (isMyTask || task.deptCode === currentUser.deptCode) hasAccess = true;
        } else {
            hasAccess = true;
        }

        if (hasAccess) {
            total++;
            if (task.status === 'HOAN_THANH') completed++;
            if (task.status === 'DANG_THUC_HIEN') inProgress++;
            if (task.status !== 'HOAN_THANH' && task.deadline) {
                if (new Date() > new Date(task.deadline)) overdue++;
            }
        }
    }

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statCompleted').innerText = completed;
    document.getElementById('statInProgress').innerText = inProgress;
    document.getElementById('statOverdue').innerText = overdue;
}

export function showStatistics() {
    const currentUser = getCurrentUser();
    document.getElementById('mainTableArea').classList.add('hidden');
    document.getElementById('filterContainer').classList.add('hidden');
    document.getElementById('statisticsArea').classList.remove('hidden');
    updateStatisticsCards();

    // Update Export target options based on Role
    const exportTarget = document.getElementById('exportTarget');
    if (exportTarget) {
        if (currentUser.role === 'NHAN_VIEN') {
            exportTarget.innerHTML = `<option value="MY_TASKS">Công việc của tôi</option>`;
        } else if (currentUser.role === 'TRUONG_PHONG' || currentUser.role === 'PHO_PHONG') {
            exportTarget.innerHTML = `
                <option value="ALL">Toàn Phân hiệu</option>
                <option value="MY_TASKS">Công việc của tôi</option>
                <option value="${currentUser.deptCode}">${deptCodeMap[currentUser.deptCode] || currentUser.deptCode}</option>
            `;
        } else { // BGD, ADMIN
            exportTarget.innerHTML = `
                <option value="ALL">Toàn Phân hiệu</option>
                <option value="MY_TASKS">Công việc của tôi</option>
                <option value="HCTV">Phòng Hành chính - Tài vụ</option>
                <option value="DT_KH_QLSV">Phòng Đào tạo - KH & QLSV</option>
            `;
        }
    }
}

export function setupExport() {
    document.getElementById('exportTimeRange')?.addEventListener('change', function() {
        const customRange = document.getElementById('exportCustomRange');
        if (this.value === 'CUSTOM') {
            customRange.classList.remove('hidden');
        } else {
            customRange.classList.add('hidden');
        }
    });

    document.getElementById('btnExportExcelNew')?.addEventListener('click', () => {
        const allTasks = getAllTasks();
        const currentUser = getCurrentUser();
        const timeRange = document.getElementById('exportTimeRange').value;
        const startDate = document.getElementById('exportStartDate').value;
        const endDate = document.getElementById('exportEndDate').value;
        const exportTarget = document.getElementById('exportTarget') ? document.getElementById('exportTarget').value : 'ALL';

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
            // Reusing isMyTask logic for Export Filter to be consistent
            const primary = task.primaryAssignee || task.mainAssignee || '';
            const secondary = task.secondaryAssignees || task.subAssignees || '';
            const isMyTask = primary === currentUser.fullName || primary === currentUser.email ||
                             secondary.includes(currentUser.fullName) || secondary.includes(currentUser.email) ||
                             (task.host === 'Ban Giám đốc' && primary === currentUser.fullName);

            // RBAC Filter
            if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'BGD') {
                if (!isMyTask && task.deptCode !== currentUser.deptCode) continue;
                if (currentUser.role === 'NHAN_VIEN' && !isMyTask) continue;
            }

            // Export Target Filter
            if (exportTarget === 'MY_TASKS' && !isMyTask) continue;
            if (exportTarget !== 'ALL' && exportTarget !== 'MY_TASKS' && task.deptCode !== exportTarget && !isMyTask) continue;

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
    });
}