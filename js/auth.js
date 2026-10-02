// Mock Authentication System
// In a real app, this would use Firebase Auth. For this requirement, it's simulated to test RBAC quickly.

// State variables
let currentUser = null; // { role: 'BGD' | 'TRUONG_PHONG' | 'NHAN_VIEN', deptCode: 'BGD' | 'PDT' | 'PHC' }

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
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const role = document.getElementById('loginRole').value;
        const dept = document.getElementById('loginDept').value;

        currentUser = { role, deptCode: dept };

        // Overrides logic: if role is BGD, dept must be BGD.
        if(role === 'BGD') currentUser.deptCode = 'BGD';

        localStorage.setItem('taskAppUser', JSON.stringify(currentUser));

        showMainApp();
        onAuthStateChangedCallback(currentUser);
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
    if(currentUser.role === 'BGD') roleText = "Ban Giám đốc";
    else if(currentUser.role === 'TRUONG_PHONG') roleText = "Trưởng/Phó Phòng";
    else roleText = "Nhân viên";

    userInfo.innerHTML = `Xin chào, <b>${roleText} (${currentUser.deptCode})</b>`;
}

export function getCurrentUser() {
    return currentUser;
}
