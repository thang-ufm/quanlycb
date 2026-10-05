// Authentication System
import { database } from './firebase-config.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";
import { setCurrentUser, getCurrentUser as getStoreCurrentUser } from './store.js';

const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const btnLogout = document.getElementById('btnLogout');
const userInfo = document.getElementById('userInfo');

export function initAuth(onAuthStateChangedCallback) {
    // Fetch users for Fast Login Table
    fetchUsersForFastLogin();

    // Check local storage for session
    const storedUser = localStorage.getItem('taskAppUser');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        showMainApp();
        onAuthStateChangedCallback(user);
    } else {
        showLoginScreen();
    }

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const errorMsg = document.getElementById('loginError');

        if (errorMsg) errorMsg.classList.add('hidden');

        try {
            const usersRef = ref(database, 'users');
            const snapshot = await get(usersRef);

            if (snapshot.exists()) {
                const users = snapshot.val();
                let foundUser = null;

                // Find user by email and check password
                for (const key in users) {
                    if (users[key].email === email && users[key].password === password) {
                        foundUser = users[key];
                        // Don't save password in local storage
                        const { password: _, ...safeUser } = foundUser;
                        foundUser = safeUser;
                        break;
                    }
                }

                if (foundUser) {
                    setCurrentUser(foundUser);
                    localStorage.setItem('taskAppUser', JSON.stringify(foundUser));
                    showMainApp();
                    onAuthStateChangedCallback(foundUser);
                } else {
                    if (errorMsg) {
                        errorMsg.textContent = "Email hoặc mật khẩu không đúng!";
                        errorMsg.classList.remove('hidden');
                    } else {
                        alert("Email hoặc mật khẩu không đúng!");
                    }
                }
            } else {
                 if (errorMsg) {
                    errorMsg.textContent = "Hệ thống chưa có dữ liệu người dùng!";
                    errorMsg.classList.remove('hidden');
                 } else {
                    alert("Hệ thống chưa có dữ liệu người dùng!");
                 }
            }
        } catch (error) {
            console.error("Login error:", error);
            if (errorMsg) {
                errorMsg.textContent = "Đã xảy ra lỗi kết nối!";
                errorMsg.classList.remove('hidden');
            } else {
                alert("Đã xảy ra lỗi kết nối!");
            }
        }
    });

    // Handle Logout
    btnLogout.addEventListener('click', () => {
        setCurrentUser(null);
        localStorage.removeItem('taskAppUser');
        showLoginScreen();
        onAuthStateChangedCallback(null);
    });

    // Bind Change Password Button
    const btnChangePassword = document.getElementById('btnChangePassword');
    if (btnChangePassword) {
        btnChangePassword.addEventListener('click', window.openChangePasswordModal);
    }
}

function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

function showMainApp() {
    const currentUser = getStoreCurrentUser();
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');

    // Update Header info
    let roleText = "";
    if (currentUser.role === 'SUPER_ADMIN') roleText = "Super Admin";
    else if (currentUser.role === 'BGD') roleText = "Ban Giám đốc";
    else if (currentUser.role === 'TRUONG_PHONG') roleText = "Trưởng Phòng";
    else if (currentUser.role === 'PHO_PHONG') roleText = "Phó Phòng";
    else roleText = "Nhân viên";

    userInfo.innerHTML = `Xin chào, <b>${currentUser.fullName}</b> (${roleText} - ${currentUser.deptCode})`;
}

export function getCurrentUser() {
    return getStoreCurrentUser();
}

// --- FAST LOGIN TABLE LOGIC ---
async function fetchUsersForFastLogin() {
    const tbody = document.getElementById('fastLoginTableBody');
    if (!tbody) return;

    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const users = snapshot.val();
            renderFastLoginTable(users);
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-sm text-gray-500">Chưa có dữ liệu người dùng</td></tr>';
        }
    } catch (e) {
        console.error("Error fetching users for fast login: ", e);
        tbody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-sm text-red-500">Lỗi tải danh sách</td></tr>';
    }
}

function renderFastLoginTable(users) {
    const tbody = document.getElementById('fastLoginTableBody');
    tbody.innerHTML = '';

    const groups = {
        'BGD': { name: 'BAN GIÁM ĐỐC', users: [] },
        'HCTV': { name: 'PHÒNG HÀNH CHÍNH - TÀI VỤ', users: [] },
        'DT_KH_QLSV': { name: 'PHÒNG ĐÀO TẠO - KHOA HỌC & QUẢN LÝ SINH VIÊN', users: [] },
        'OTHER': { name: 'KHÁC', users: [] }
    };

    // Group users
    for (const key in users) {
        const u = users[key];
        // Exclude Super Admin from fast login if desired, or keep them in OTHER
        if (u.role === 'SUPER_ADMIN') {
            groups['OTHER'].users.push(u);
            continue;
        }

        if (groups[u.deptCode]) {
            groups[u.deptCode].users.push(u);
        } else {
            groups['OTHER'].users.push(u);
        }
    }

    let globalIndex = 1;

    for (const groupKey in groups) {
        const group = groups[groupKey];
        if (group.users.length === 0) continue;

        // Group Header Row
        const groupHeaderRow = document.createElement('tr');
        groupHeaderRow.innerHTML = `
            <td colspan="4" class="bg-gray-200 font-bold text-xs py-2 px-2 text-gray-800">${group.name}</td>
        `;
        tbody.appendChild(groupHeaderRow);

        // User Rows
        group.users.forEach(u => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-blue-50 cursor-pointer transition-colors';

            // Allow clicking the entire row
            tr.onclick = () => window.selectQuickLogin(u.email);

            tr.innerHTML = `
                <td class="py-2 pl-2 pr-2 text-sm text-gray-500 w-10">${globalIndex++}</td>
                <td class="py-2 pl-2 pr-2 text-sm text-gray-900 font-medium">${u.fullName}</td>
                <td class="py-2 pl-2 pr-2 text-sm text-gray-500">${u.role}</td>
                <td class="py-2 pl-2 pr-2 text-center w-24">
                    <button type="button" class="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Đăng nhập
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

window.selectQuickLogin = function(email) {
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = ''; // clear password
    document.getElementById('loginPassword').focus(); // Auto focus password field
};

// --- RBAC UI SETUP ---
export function setupRBACUI() {
    const currentUser = getStoreCurrentUser();
    if (!currentUser) return;

    const actionButtons = document.getElementById('actionButtons');
    if (!actionButtons) return;

    actionButtons.innerHTML = ''; // Clear existing

    // Show "Đăng ký công việc" button only if not BGD
    if (currentUser.role === 'NHAN_VIEN' || currentUser.role === 'TRUONG_PHONG' || currentUser.role === 'PHO_PHONG' || currentUser.role === 'SUPER_ADMIN') {
        const btnReg = document.createElement('button');
        btnReg.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm text-sm font-medium transition flex items-center';
        btnReg.innerHTML = '<i class="fas fa-plus mr-2"></i> Đăng ký';
        btnReg.addEventListener('click', window.openWeeklyTaskModal);
        actionButtons.appendChild(btnReg);
    }

    if (currentUser.role === 'BGD' || currentUser.role === 'SUPER_ADMIN') {
        const btnAssign = document.createElement('button');
        btnAssign.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm text-sm font-medium transition flex items-center';
        btnAssign.innerHTML = '<i class="fas fa-plus mr-2"></i> Giao việc';
        btnAssign.addEventListener('click', window.openAssignTaskModal);
        actionButtons.appendChild(btnAssign);
    }
}
