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
