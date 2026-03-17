// AR Gamestore - Firebase Auth & Website Logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. Firebase Configuration
const firebaseConfig = { 
  apiKey: "AIzaSyCqEHEeDfjr1MwqEU_eBLkYatc6sMwuaZU", 
  authDomain: "ar-game-store-web.firebaseapp.com", 
  projectId: "ar-game-store-web", 
  storageBucket: "ar-game-store-web.firebasestorage.app", 
  messagingSenderId: "427606631299", 
  appId: "1:427606631299:web:005d3f74f7b7f5c4d94cb6", 
  measurementId: "G-YP898N3C39" 
}; 

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
  // --- AUTH STATE LISTENER ---
  onAuthStateChanged(auth, (user) => {
    const isLoginPage = window.location.pathname.includes('login.html');
    
    if (user) {
      // User is logged in
      if (isLoginPage) {
        window.location.href = 'index.html'; // Auto-redirect to home if already logged in
      }
      setupUserUI(user);
    } else {
      // User is logged out
      if (!isLoginPage && !window.location.pathname.endsWith('/') && !window.location.pathname.endsWith('index.html')) {
        // Optional: protect other pages
      }
      setupGuestUI();
    }
  });

  // --- LOGIN / SIGNUP PAGE LOGIC ---
  const loginTab = document.getElementById('login-tab');
  const signupTab = document.getElementById('signup-tab');
  const loginFormContainer = document.getElementById('login-form-container');
  const signupFormContainer = document.getElementById('signup-form-container');
  const errorMsg = document.getElementById('auth-error');
  const spinner = document.getElementById('loading-spinner');

  if (loginTab) {
    // Toggle between Login and Signup
    loginTab.addEventListener('click', () => {
      loginTab.classList.add('active');
      signupTab.classList.remove('active');
      loginFormContainer.style.display = 'block';
      signupFormContainer.style.display = 'none';
      errorMsg.style.display = 'none';
    });

    signupTab.addEventListener('click', () => {
      signupTab.classList.add('active');
      loginTab.classList.remove('active');
      signupFormContainer.style.display = 'block';
      loginFormContainer.style.display = 'none';
      errorMsg.style.display = 'none';
    });

    // Handle Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      
      showLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, pass);
        window.location.href = 'index.html';
      } catch (error) {
        showError(error.message);
      } finally {
        showLoading(false);
      }
    });

    // Handle Signup
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signup-email').value;
      const pass = document.getElementById('signup-password').value;
      
      showLoading(true);
      try {
        await createUserWithEmailAndPassword(auth, email, pass);
        window.location.href = 'index.html';
      } catch (error) {
        showError(error.message);
      } finally {
        showLoading(false);
      }
    });
  }

  function showLoading(show) {
    if (spinner) spinner.style.display = show ? 'flex' : 'none';
  }

  function showError(msg) {
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = 'block';
    }
  }

  // --- UI SETUP FUNCTIONS ---
  function setupUserUI(user) {
    const nav = document.querySelector('nav');
    if (nav) {
      // Replace Login link with Logout
      const existingLogin = Array.from(nav.querySelectorAll('a')).find(a => a.textContent.includes('Login'));
      if (existingLogin) existingLogin.remove();

      if (!document.getElementById('logout-btn')) {
        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.id = 'logout-btn';
        logoutBtn.className = 'logout-link';
        logoutBtn.textContent = 'Logout';
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          signOut(auth);
        });
        nav.appendChild(logoutBtn);
      }
    }
  }

  function setupGuestUI() {
    const nav = document.querySelector('nav');
    if (nav) {
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) logoutBtn.remove();

      if (!Array.from(nav.querySelectorAll('a')).find(a => a.href.includes('login.html'))) {
        const loginLink = document.createElement('a');
        loginLink.href = 'login.html';
        loginLink.textContent = 'Login';
        nav.appendChild(loginLink);
      }
    }
  }

  // --- EXISTING STORE LOGIC (Scroll Animations) ---
  const observerOptions = { threshold: 0.1 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.product-card, .section-title, .form-container, .paypal-card').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });

  // Handle BaridiMob Buy Click
  document.querySelectorAll('.baridi-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const price = btn.getAttribute('data-price');
      localStorage.setItem('product_name', name);
      localStorage.setItem('product_price', price);
      window.location.href = 'payment-baridimob.html';
    });
  });
});
