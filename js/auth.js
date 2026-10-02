// Authentication System
import { database } from './firebase-config.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// State variables
let currentUser = null; // { fullName, email, role, deptCode }

const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const btnLogout = document.getElementById('btnLogout');
const userInfo = document.getElementById('userInfo');

export function initAuth(onAuthStateChangedCallback) {
    // Check local storage for session
    const storedUser = localStorage.getItem('taskAppUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        showMainApp();
        onAuthStateChangedCallback(currentUser);
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
                    currentUser = foundUser;
                    localStorage.setItem('taskAppUser', JSON.stringify(currentUser));
                    showMainApp();
                    onAuthStateChangedCallback(currentUser);
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
        currentUser = null;
        localStorage.removeItem('taskAppUser');
        showLoginScreen();
        onAuthStateChangedCallback(null);
    });
}

function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

function showMainApp() {
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
    return currentUser;
}
