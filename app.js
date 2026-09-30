import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCdP98GYwndtWuTKAvae8pN6I0nmdy3xPA",
  authDomain: "quanlycb.firebaseapp.com",
  projectId: "quanlycb",
  storageBucket: "quanlycb.firebasestorage.app",
  messagingSenderId: "997756052957",
  appId: "1:997756052957:web:5a02feba82cf10576d8234",
  measurementId: "G-GVTH9F2P2J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const loginContainer = document.getElementById("login-container");
  const dashboardContainer = document.getElementById("dashboard-container");
  const loginForm = document.getElementById("login-form");
  const loginStatus = document.getElementById("login-status");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      loginStatus.textContent = "Đang đăng nhập...";
      loginStatus.style.color = "blue";

      try {
        await signInWithEmailAndPassword(auth, email, password);
        loginStatus.textContent = `Đăng nhập thành công!`;
        loginStatus.style.color = "green";
        const errorMessage = error.message;
        loginStatus.textContent = `Lỗi đăng nhập: ${errorMessage}`;
        loginStatus.style.color = "red";
      }
    });
  }

  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Lỗi đăng xuất:", error);
      }
    });
  }

  // Handle Auth State Changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      loginContainer.style.display = "none";
      dashboardContainer.style.display = "block";
      const userEmailSpan = document.getElementById("user-email");
      if (userEmailSpan) {
        userEmailSpan.textContent = user.email;
      }
      loadStaffData();
    } else {
      // User is signed out
      loginContainer.style.display = "block";
      dashboardContainer.style.display = "none";
      loginForm.reset();
      loginStatus.textContent = "";
    }
  });

  const addStaffForm = document.getElementById("add-staff-form");
  if (addStaffForm) {
    addStaffForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const ma_cb = document.getElementById("ma_cb").value;
      const ho_ten = document.getElementById("ho_ten").value;
      const chuc_vu = document.getElementById("chuc_vu").value;
      const phong_ban = document.getElementById("phong_ban").value;
      const sdt = document.getElementById("sdt").value;

      try {
        await addDoc(collection(db, "can_bo"), {
          ma_cb: ma_cb,
          ho_ten: ho_ten,
          chuc_vu: chuc_vu,
          phong_ban: phong_ban,
          sdt: sdt
        });
        addStaffForm.reset();
      } catch (error) {
        console.error("Lỗi khi thêm cán bộ:", error);
        alert("Lỗi khi thêm cán bộ: " + error.message);
      }
    });
  }

  // Handle delete action using event delegation
  const staffTableBody = document.getElementById("staff-table-body");
  if (staffTableBody) {
    staffTableBody.addEventListener("click", async (e) => {
      if (e.target.classList.contains("btn-delete")) {
        const docId = e.target.getAttribute("data-id");
        if (docId) {
          if (confirm("Bạn có chắc chắn muốn xóa cán bộ này?")) {
            try {
              await deleteDoc(doc(db, "can_bo", docId));
            } catch (error) {
              console.error("Lỗi khi xóa cán bộ:", error);
              alert("Lỗi khi xóa cán bộ: " + error.message);
            }
          }
        }
      }
    });
  }

  function loadStaffData() {
    const canBoRef = collection(db, "can_bo");

    onSnapshot(canBoRef, (snapshot) => {
      staffTableBody.innerHTML = ""; // Clear current table

      let index = 1;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const docId = docSnap.id;

        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${index++}</td>
          <td>${data.ma_cb || ""}</td>
          <td>${data.ho_ten || ""}</td>
          <td>${data.chuc_vu || ""}</td>
          <td>${data.phong_ban || ""}</td>
          <td>${data.sdt || ""}</td>
          <td>
            <button class="btn-delete" data-id="${docId}">Xóa</button>
          </td>
        `;

        staffTableBody.appendChild(row);
      });
    }, (error) => {
      console.error("Lỗi khi tải dữ liệu:", error);
    });
  }
});
