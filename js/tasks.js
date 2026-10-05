import { getAllTasks, getCurrentUser } from './store.js';

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
    'MOI_GIAO': { text: 'Mới giao', class: 'bg-orange-500 text-white' },
    'CHO_DUYET': { text: 'Chờ duyệt', class: 'bg-orange-100 text-orange-800' },
    'CHO_BGD_DUYET': { text: 'Chờ BGD Duyệt', class: 'bg-yellow-100 text-yellow-800' },
    'DANG_THUC_HIEN': { text: 'Đang thực hiện', class: 'bg-blue-100 text-blue-800' },
    'YEU_CAU_SUA': { text: 'Yêu cầu sửa', class: 'bg-red-100 text-red-800' },
    'HOAN_THANH': { text: 'Hoàn thành', class: 'bg-green-100 text-green-800' }
};

export let currentTab = 'MY_TASKS';
export let globalMyTasksCount = 0;

let currentPage = 1;
const itemsPerPage = 15;

export function setCurrentTab(tab) {
    currentTab = tab;
    currentPage = 1; // Reset page when changing tab
}

export function setPage(page) {
    currentPage = page;
}

export function escapeHtml(unsafe) {
    if(!unsafe) return '';
    return unsafe
         .toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

export function showTasks() {
    document.getElementById('statisticsArea').classList.add('hidden');
    document.getElementById('mainTableArea').classList.remove('hidden');
    document.getElementById('filterContainer').classList.remove('hidden');
}

export function renderTabs() {
    const tabsContainer = document.getElementById('filterDeptTabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const tabsData = [
        { id: 'MY_TASKS', label: `📌 Công việc của tôi`, badge: globalMyTasksCount },
        { id: 'HCTV', label: 'Phòng Hành chính – Tài vụ' },
        { id: 'DT_KH_QLSV', label: 'Phòng Đào tạo - KH & QLSV' }
    ];

    if (currentUser.role === 'BGD' || currentUser.role === 'SUPER_ADMIN') {
        tabsData.push({ id: 'ALL', label: 'Toàn Phân hiệu' });
    }

    tabsData.push({ id: 'STATS', label: '📊 Thống kê' });

    tabsData.forEach(tab => {
        const btn = document.createElement('button');
        const isActive = currentTab === tab.id;

        let badgeHtml = '';
        if (tab.badge !== undefined && tab.badge > 0) {
            badgeHtml = `<span class="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">${tab.badge}</span>`;
        }

        btn.innerHTML = `${tab.label} ${badgeHtml}`;
        btn.className = `whitespace-nowrap px-4 py-2 font-medium text-sm transition-colors duration-150 outline-none
            ${isActive ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'}`;

        btn.onclick = () => {
            if (tab.id === 'STATS') {
                setCurrentTab(tab.id);
                window.showStatistics(); // Call global function
                renderTabs();
            } else {
                setCurrentTab(tab.id);
                showTasks();
                renderTable();
            }
        };

        tabsContainer.appendChild(btn);
    });
}

export function renderTable() {
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const allTasks = getAllTasks();
    const currentUser = getCurrentUser();

    if (!allTasks || Object.keys(allTasks).length === 0 || !currentUser) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-500">Chưa có công việc nào.</td></tr>';
        return;
    }

    const dFilter = currentTab;
    const filterStatus = document.getElementById('filterStatus');
    const sFilter = filterStatus ? filterStatus.value : 'ALL';

    let myTasksCount = 0;

    const filteredTasks = [];

    // Filter tasks based on RBAC and current tab
    for (const [taskId, task] of Object.entries(allTasks)) {
        const primary = task.primaryAssignee || task.mainAssignee || '';
        const secondary = task.secondaryAssignees || task.subAssignees || '';
        const isMyTask = primary === currentUser.fullName || primary === currentUser.email ||
                         secondary.includes(currentUser.fullName) || secondary.includes(currentUser.email) ||
                         (task.host === 'Ban Giám đốc' && primary === currentUser.fullName);

        if (isMyTask && (task.status === 'MOI_GIAO' || task.status === 'DANG_THUC_HIEN')) {
            myTasksCount++;
        }

        // Apply Tab Filter correctly to fix cross-view issues
        if (dFilter === 'MY_TASKS') {
            if (!isMyTask) continue;
        } else if (dFilter !== 'ALL' && dFilter !== 'STATS') {
            if (task.deptCode !== dFilter) continue;

            // If they are regular users, check if they are allowed to see this department
            if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'BGD') {
                if (currentUser.deptCode !== dFilter) continue; // Deny access to other departments completely
            }
        }

        // Apply Status Filter
        if (sFilter !== 'ALL' && task.status !== sFilter) {
            continue;
        }

        filteredTasks.push({ id: taskId, ...task, isMyTask });
    }

    globalMyTasksCount = myTasksCount;

    // Sort tasks (optional, maybe newest first)
    filteredTasks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Pagination
    const totalItems = filteredTasks.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    const pageTasks = filteredTasks.slice(startIndex, endIndex);

    if (pageTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-500">Chưa có công việc nào.</td></tr>';
    } else {
        pageTasks.forEach((task, pIndex) => {
            const index = startIndex + pIndex + 1;
            const tr = document.createElement('tr');

            // Zebra striping using standard classes
            tr.className = index % 2 !== 0 ? 'bg-white' : 'bg-slate-100';

            const badgeColor = deptColorMap[task.deptCode] || 'bg-gray-100 text-gray-800';
            const deptName = deptCodeMap[task.deptCode] || task.deptCode;

            const sInfo = statusMap[task.status] || {text: task.status, class: 'bg-gray-100 text-gray-800'};

            const evidenceHtml = task.evidenceUrl
                ? `<a href="${task.evidenceUrl}" target="_blank" class="text-blue-500 hover:text-blue-700 ml-2" title="Xem minh chứng"><i class="fab fa-google-drive"></i></a>`
                : '';

            let nameHtml = escapeHtml(task.name);
            if (task.status === 'MOI_GIAO') {
                nameHtml += ` <span class="bg-blue-600 text-white text-[10px] px-1 rounded ml-1">📌 BGD Giao</span>`;
            }

            // Check for director/leader opinion and append warning text if present
            if (task.directorOpinion || task.leaderOpinion || (task.feedback && task.feedback.trim() !== '')) {
                nameHtml += `<span class="text-xs text-red-600 font-semibold block mt-1">💬 Có ý kiến chỉ đạo từ BGD/Lãnh đạo</span>`;
            }

            let actionHtml = `<button onclick="window.openEditModal('${task.id}')" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded px-2 py-1"><i class="fas fa-edit"></i></button>`;
            if (task.status === 'MOI_GIAO' && task.isMyTask) {
                actionHtml = `<button onclick="window.acceptTask('${task.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-xs">Đã nhận việc</button> ` + actionHtml;
            }

            const dispPrimary = task.primaryAssignee || task.mainAssignee || '';
            const dispSecondary = task.secondaryAssignees || task.subAssignees || '';

            tr.innerHTML = `
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${index}</td>
                <td class="px-4 py-4 text-sm font-medium text-gray-900">${nameHtml}</td>
                <td class="px-4 py-4 text-sm">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${badgeColor}">
                        ${deptName}
                    </span>
                </td>
                <td class="px-4 py-4 text-sm text-gray-700">
                    <div class="font-bold">${escapeHtml(dispPrimary)}</div>
                    <div class="text-xs text-gray-500">${escapeHtml(dispSecondary)}</div>
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
                <td class="px-3 py-4 whitespace-nowrap text-center text-sm font-medium flex flex-col gap-1 items-center">
                    ${actionHtml}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderPagination(totalPages);
    renderTabs();
}

function renderPagination(totalPages) {
    let paginationContainer = document.getElementById('paginationContainer');

    // Create pagination container if it doesn't exist
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationContainer';
        paginationContainer.className = 'bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6';
        const tasksTable = document.getElementById('tasksTable');
        tasksTable.parentNode.parentNode.appendChild(paginationContainer); // Add below the table container
    }

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let buttonsHtml = '';
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50';
        buttonsHtml += `
            <button onclick="window.setPageAndRender(${i})" aria-current="page" class="${activeClass} relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                ${i}
            </button>
        `;
    }

    paginationContainer.innerHTML = `
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between w-full">
            <div>
                <p class="text-sm text-gray-700">
                    Trang <span class="font-medium">${currentPage}</span> / <span class="font-medium">${totalPages}</span>
                </p>
            </div>
            <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button onclick="window.setPageAndRender(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <span class="sr-only">Previous</span>
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    ${buttonsHtml}
                    <button onclick="window.setPageAndRender(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <span class="sr-only">Next</span>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </nav>
            </div>
        </div>
    `;
}

// Expose pagination set function globally to be called from html
window.setPageAndRender = function(page) {
    setPage(page);
    renderTable();
};
