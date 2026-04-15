// AR Gamestore - Firebase Auth, Cart & Website Logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCqEHEeDfjr1MwqEU_eBLkYatc6sMwuaZU",
  authDomain: "ar-game-store-web.firebaseapp.com",
  projectId: "ar-game-store-web",
  storageBucket: "ar-game-store-web.firebasestorage.app",
  messagingSenderId: "427606631299",
  appId: "1:427606631299:web:005d3f74f7b7f5c4d94cb6",
  measurementId: "G-YP898N3C39",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  // Auth State Listener
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const isLoginPage = window.location.pathname.includes("login.html");
    const isCartPage = window.location.pathname.includes("cart.html");
    const isOrderPage = window.location.pathname.includes("order.html");

    if (user) {
      if (isLoginPage) {
        window.location.href = "index.html";
      }
      setupUserUI(user);
      if (isCartPage) {
        loadCartItems();
      }
      if (isOrderPage) {
        renderSingleProductPayPal();
      }
    } else {
      if (isCartPage) {
        window.location.href = "login.html";
      }
      setupGuestUI();
      if (isOrderPage) {
        renderSingleProductPayPal();
      }
    }
  });

  // Login/Signup Logic
  const loginTab = document.getElementById("login-tab");
  const signupTab = document.getElementById("signup-tab");
  const loginFormContainer = document.getElementById("login-form-container");
  const signupFormContainer = document.getElementById("signup-form-container");
  const errorMsg = document.getElementById("auth-error");
  const spinner = document.getElementById("loading-spinner");

  if (loginTab) {
    loginTab.addEventListener("click", () => {
      loginTab.classList.add("active");
      signupTab.classList.remove("active");
      loginFormContainer.style.display = "block";
      signupFormContainer.style.display = "none";
      errorMsg.style.display = "none";
    });

    signupTab.addEventListener("click", () => {
      signupTab.classList.add("active");
      loginTab.classList.remove("active");
      signupFormContainer.style.display = "block";
      loginFormContainer.style.display = "none";
      errorMsg.style.display = "none";
    });

    document
      .getElementById("login-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const pass = document.getElementById("login-password").value;

        showLoading(true);
        try {
          await signInWithEmailAndPassword(auth, email, pass);
          window.location.href = "index.html";
        } catch (error) {
          showError(error.message);
        } finally {
          showLoading(false);
        }
      });

    document
      .getElementById("signup-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("signup-email").value;
        const pass = document.getElementById("signup-password").value;

        showLoading(true);
        try {
          await createUserWithEmailAndPassword(auth, email, pass);
          window.location.href = "index.html";
        } catch (error) {
          showError(error.message);
        } finally {
          showLoading(false);
        }
      });
  }

  function showLoading(show) {
    if (spinner) spinner.style.display = show ? "flex" : "none";
  }

  function showError(msg) {
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = "block";
    }
  }

  function setupUserUI(user) {
    const nav = document.querySelector("nav");
    if (nav) {
      const existingLogin = Array.from(nav.querySelectorAll("a")).find((a) =>
        a.textContent.includes("Login"),
      );
      if (existingLogin) existingLogin.remove();

      if (!document.getElementById("logout-btn")) {
        const logoutBtn = document.createElement("a");
        logoutBtn.href = "#";
        logoutBtn.id = "logout-btn";
        logoutBtn.className = "logout-link";
        logoutBtn.textContent = "Logout";
        logoutBtn.addEventListener("click", (e) => {
          e.preventDefault();
          signOut(auth);
        });
        nav.appendChild(logoutBtn);
      }
    }
  }

  function setupGuestUI() {
    const nav = document.querySelector("nav");
    if (nav) {
      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) logoutBtn.remove();

      if (
        !Array.from(nav.querySelectorAll("a")).find((a) =>
          a.href.includes("login.html"),
        )
      ) {
        const loginLink = document.createElement("a");
        loginLink.href = "login.html";
        loginLink.textContent = "Login";
        nav.appendChild(loginLink);
      }
    }
  }

  // Scroll Animations
  const observerOptions = { threshold: 0.1 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-fade");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document
    .querySelectorAll(
      ".product-card, .section-title, .form-container, .paypal-card",
    )
    .forEach((el) => {
      el.style.opacity = "0";
      observer.observe(el);
    });

  // Direct Buy Logic
  document.querySelectorAll(".direct-buy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-name");
      const priceUsd = btn.getAttribute("data-price-usd");
      const priceDzd = btn.getAttribute("data-price-dzd");
      localStorage.setItem("selected_product_name", name);
      localStorage.setItem("selected_product_price_usd", priceUsd);
      localStorage.setItem("selected_product_price_dzd", priceDzd);
    });
  });

  // Add to Cart Logic
  document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) {
        window.location.href = "login.html";
        return;
      }

      const name = btn.getAttribute("data-name");
      const priceUsd = parseFloat(btn.getAttribute("data-price-usd"));
      const priceDzd = parseInt(btn.getAttribute("data-price-dzd"));

      try {
        const cartRef = doc(db, "carts", user.uid);
        const cartSnap = await getDoc(cartRef);

        if (cartSnap.exists()) {
          const cartData = cartSnap.data();
          const items = cartData.items || [];
          const existingIndex = items.findIndex(
            (item) => item.product_name === name,
          );

          if (existingIndex > -1) {
            items[existingIndex].quantity += 1;
          } else {
            items.push({
              product_name: name,
              price_usd: priceUsd,
              price_dzd: priceDzd,
              quantity: 1,
            });
          }

          await updateDoc(cartRef, { items });
        } else {
          await setDoc(cartRef, {
            items: [
              {
                product_name: name,
                price_usd: priceUsd,
                price_dzd: priceDzd,
                quantity: 1,
              },
            ],
          });
        }

        showNotification(`"${name}" added to cart!`);
      } catch (error) {
        console.error("Error adding to cart:", error);
        showNotification("Error adding to cart", "error");
      }
    });
  });

  // PayPal Rendering for Single Product (order.html)
  window.renderSingleProductPayPal = () => {
    const container = document.getElementById("paypal-button-container");
    if (!container || !window.location.pathname.includes("order.html")) return;

    const name = localStorage.getItem("selected_product_name");
    const price = parseFloat(
      localStorage.getItem("selected_product_price_usd"),
    );

    if (!name || !price) {
      container.innerHTML =
        '<p class="error-msg">No product selected. Please go back to store.</p>';
      return;
    }

    if (typeof paypal !== "undefined") {
      paypal
        .Buttons({
          style: {
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
          },
          createOrder: function (data, actions) {
            return actions.order.create({
              purchase_units: [
                {
                  description: name,
                  amount: { value: price.toFixed(2) },
                },
              ],
            });
          },
          onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
              document.getElementById("thank-you-popup").style.display = "flex";
            });
          },
        })
        .render("#paypal-button-container");
    }
  };

  // Cart Page Functions
  window.loadCartItems = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const cartContainer = document.getElementById("cart-items-container");
    const totalUsdElement = document.getElementById("total-usd");
    const totalDzdElement = document.getElementById("total-dzd");
    const paypalSection = document.getElementById("paypal-section");
    const baridiSection = document.getElementById("baridi-section");

    if (!cartContainer) return;

    try {
      const cartRef = doc(db, "carts", user.uid);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists() && cartSnap.data().items.length > 0) {
        const items = cartSnap.data().items;
        cartContainer.innerHTML = "";

        let totalUsd = 0;
        let totalDzd = 0;

        items.forEach((item, index) => {
          const itemTotalUsd = item.price_usd * item.quantity;
          const itemTotalDzd = item.price_dzd * item.quantity;
          totalUsd += itemTotalUsd;
          totalDzd += itemTotalDzd;

          const itemHtml = `
            <div class="cart-item" data-index="${index}">
              <div class="cart-item-info">
                <h3>${item.product_name}</h3>
                <p class="cart-item-price">${item.price_usd} USD / ${item.price_dzd} DZD</p>
              </div>
              <div class="cart-item-quantity">
                <button class="qty-btn qty-minus" data-index="${index}">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn qty-plus" data-index="${index}">+</button>
              </div>
              <div class="cart-item-total">
                <p>${itemTotalUsd} USD</p>
                <p class="text-muted">${itemTotalDzd} DZD</p>
              </div>
              <button class="cart-remove-btn" data-index="${index}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `;
          cartContainer.innerHTML += itemHtml;
        });

        totalUsdElement.textContent = totalUsd.toFixed(2);
        totalDzdElement.textContent = totalDzd;

        // Store totals for PayPal
        window.cartTotalUsd = totalUsd;
        window.cartTotalDzd = totalDzd;

        // Show payment sections
        if (paypalSection) paypalSection.style.display = "block";
        if (baridiSection) baridiSection.style.display = "block";

        // Attach cart item event listeners
        attachCartEventListeners(items);

        // Initialize PayPal if visible
        if (typeof window.renderPayPalButton === "function") {
          window.renderPayPalButton();
        }
      } else {
        cartContainer.innerHTML =
          '<p class="empty-cart">Your cart is empty</p>';
        if (paypalSection) paypalSection.style.display = "none";
        if (baridiSection) baridiSection.style.display = "none";
        totalUsdElement.textContent = "0.00";
        totalDzdElement.textContent = "0";
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  };

  window.attachCartEventListeners = (items) => {
    document.querySelectorAll(".qty-plus").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const index = parseInt(btn.getAttribute("data-index"));
        await updateCartQuantity(index, items[index].quantity + 1);
      });
    });

    document.querySelectorAll(".qty-minus").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const index = parseInt(btn.getAttribute("data-index"));
        if (items[index].quantity > 1) {
          await updateCartQuantity(index, items[index].quantity - 1);
        } else {
          await removeFromCart(index);
        }
      });
    });

    document.querySelectorAll(".cart-remove-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const index = parseInt(btn.getAttribute("data-index"));
        await removeFromCart(index);
      });
    });
  };

  window.updateCartQuantity = async (index, newQuantity) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const cartRef = doc(db, "carts", user.uid);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        const items = cartSnap.data().items;
        items[index].quantity = newQuantity;
        await updateDoc(cartRef, { items });
        loadCartItems();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  window.removeFromCart = async (index) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const cartRef = doc(db, "carts", user.uid);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        const items = cartSnap.data().items;
        items.splice(index, 1);
        await updateDoc(cartRef, { items });
        loadCartItems();
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  window.showNotification = (message, type = "success") => {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, 2500);
  };

  // BaridiMob Form Handler
  const baridiForm = document.getElementById("baridimob-cart-form");
  if (baridiForm) {
    baridiForm.addEventListener("submit", (e) => {
      const cartInput = document.createElement("input");
      cartInput.type = "hidden";
      cartInput.name = "cart_products";
      cartInput.value = JSON.stringify(window.currentCartItems || []);
      baridiForm.appendChild(cartInput);

      const totalInput = document.createElement("input");
      totalInput.type = "hidden";
      totalInput.name = "total_price_usd";
      totalInput.value = window.cartTotalUsd || 0;
      baridiForm.appendChild(totalInput);

      const totalDzdInput = document.createElement("input");
      totalDzdInput.type = "hidden";
      totalDzdInput.name = "total_price_dzd";
      totalDzdInput.value = window.cartTotalDzd || 0;
      baridiForm.appendChild(totalDzdInput);
    });
  }
});
