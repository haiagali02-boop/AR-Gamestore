document.addEventListener("DOMContentLoaded", () => {
  // Check which page we are on
  if (window.location.pathname.includes("order.html")) {
    handleOrderPage();
  } else if (window.location.pathname.includes("payment.html")) {
    handlePaymentPage();
  }

  // Add scroll animation to products
  const products = document.querySelectorAll(".product-card");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade");
        }
      });
    },
    { threshold: 0.1 }
  );

  products.forEach((product) => {
    observer.observe(product);
  });
});

function handleOrderPage() {
  const params = new URLSearchParams(window.location.search);
  const productType = params.get("product");

  // Just a visual confirmation or we can store it in a hidden field if needed
  console.log("Ordering product:", productType);
}

function proceedToPayment() {
  const params = new URLSearchParams(window.location.search);
  const productType = params.get("product") || "premium";

  const firstName = document.getElementById("first_name").value;
  const lastName = document.getElementById("last_name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;

  // Redirect to payment page with all info
  const paymentUrl = `payment.html?product=${productType}&fname=${encodeURIComponent(
    firstName
  )}&lname=${encodeURIComponent(lastName)}&email=${encodeURIComponent(
    email
  )}&phone=${encodeURIComponent(phone)}`;
  window.location.href = paymentUrl;
}

function handlePaymentPage() {
  const params = new URLSearchParams(window.location.search);
  const productType = params.get("product");
  const userEmail = params.get("email");

  // Set Product Info
  let productName = "Xbox Game Pass Premium";
  let productPrice = "2.50";
  let displayPrice = "2.5 USD / 500 DZD";

  if (productType === "premium") {
    productName = "Xbox Game Pass Premium";
    productPrice = "2.50";
    displayPrice = "2.5 USD / 500 DZD";
  }

  const summaryProduct = document.getElementById("payment-summary-product");
  const summaryPrice = document.getElementById("payment-summary-price");
  if (summaryProduct) summaryProduct.textContent = productName;
  if (summaryPrice) summaryPrice.textContent = displayPrice;

  // Initialize PayPal Button if container exists
  if (document.getElementById("paypal-button-container")) {
    paypal
      .Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal",
        },

        createOrder: function (data, actions) {
          return actions.order.create({
            purchase_units: [
              {
                description: productName,
                amount: {
                  currency_code: "USD",
                  value: productPrice,
                },
                payee: {
                  email_address: "YOUR_PAYPAL_EMAIL", // Placeholder
                },
              },
            ],
          });
        },

        onApprove: function (data, actions) {
          return actions.order.capture().then(function (details) {
            showSuccessMessage(userEmail);
          });
        },

        onError: function (err) {
          console.error("PayPal Error:", err);
          alert("An error occurred with the payment. Please try again.");
        },
      })
      .render("#paypal-button-container");
  }
}

function showMethodDetail(method) {
  // Hide methods list
  document.getElementById("methods-list").style.display = "none";

  // Show selected detail
  document.getElementById(`${method}-detail`).classList.add("active");
}

function hideMethodDetail() {
  // Hide all details
  const details = document.querySelectorAll(".payment-detail-view");
  details.forEach((d) => d.classList.remove("active"));

  // Show methods list
  document.getElementById("methods-list").style.display = "flex";
}

function confirmManualPayment(method) {
  const params = new URLSearchParams(window.location.search);
  const userEmail = params.get("email");

  // For BaridiMob, we might check if a file is uploaded
  if (method === "BaridiMob") {
    const fileInput = document.getElementById("receipt-upload");
    if (fileInput.files.length === 0) {
      alert("Please upload a screenshot of your payment receipt.");
      return;
    }
  }

  showSuccessMessage(userEmail);
}

function showSuccessMessage(email) {
  const selectionContainer = document.getElementById(
    "payment-selection-container"
  );
  const successOverlay = document.getElementById("payment-success-overlay");

  if (selectionContainer && successOverlay) {
    selectionContainer.style.display = "none";
    successOverlay.style.display = "block";

    // You can update success text with email if needed
    const successText = document.getElementById("success-text");
    if (successText && email) {
      successText.innerHTML = `Thank you! Your Game Pass code will be sent to <strong>${email}</strong> shortly.`;
    }
  }
}

// Add simple hover effect feedback
const buttons = document.querySelectorAll(".buy-btn, .submit-btn");
buttons.forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    btn.style.opacity = "0.9";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.opacity = "1";
  });
});
