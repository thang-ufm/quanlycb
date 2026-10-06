import { initAuth, setupRBACUI } from './auth.js';
import { initStore, onTasksChanged } from './store.js';
import { checkAndSeedData } from './seed.js';
import { renderTabs, renderTable, showTasks } from './tasks.js';
import { showStatistics, setupExport, updateStatisticsCards } from './stats.js';
import { setupModals, openWeeklyTaskModal, openAssignTaskModal, openEditModal, openChangePasswordModal } from './modals.js';
import { database } from './firebase-config.js';
import { ref, update } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// Ensure global functions are attached to window for backward compatibility with HTML inline handlers
window.openWeeklyTaskModal = openWeeklyTaskModal;
window.openAssignTaskModal = openAssignTaskModal;
window.openEditModal = openEditModal;
window.openChangePasswordModal = openChangePasswordModal;
window.showStatistics = showStatistics;
window.searchTasks = function() { window.setPageAndRender(1); };

window.acceptTask = async function(taskId) {
    if (confirm('Xác nhận đã nhận công việc này?')) {
        try {
            await update(ref(database, 'tasks/' + taskId), { status: 'DANG_THUC_HIEN' });
        } catch (e) {
            console.error(e);
            alert('Lỗi cập nhật trạng thái');
        }
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ensure seed data exists
    await checkAndSeedData();

    // 2. Initialize Authentication & UI logic
    initAuth((user) => {
        if (user) {
            // Once user logs in, initialize the store which binds Firebase listeners
            initStore(user);
            setupRBACUI();

            // Set up module initializations
            setupModals();
            setupExport();

            // Setup status filter change listener
            const filterStatus = document.getElementById('filterStatus');
            if (filterStatus) {
                filterStatus.addEventListener('change', () => {
                    // Reset to first page when changing status
                    window.setPageAndRender(1);
                });
            }

            const taskSearchInput = document.getElementById('taskSearchInput');
            if (taskSearchInput) {
                taskSearchInput.addEventListener('input', window.searchTasks);
            }

            // Register task data change callback
            onTasksChanged(() => {
                const currentTab = window.currentTab || 'MY_TASKS'; // fallback
                if (currentTab === 'STATS') {
                    updateStatisticsCards();
                } else {
                    renderTable();
                }
            });
        }
    });
});
