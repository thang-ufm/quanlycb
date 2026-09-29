import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        loginStatus.textContent = `Đăng nhập thành công! User: ${user.email}`;
        loginStatus.style.color = "green";
      } catch (error) {
        const errorMessage = error.message;
        loginStatus.textContent = `Lỗi đăng nhập: ${errorMessage}`;
        loginStatus.style.color = "red";
      }
    });
  }
});
