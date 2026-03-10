document.addEventListener("DOMContentLoaded", () => {
  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-fade");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all product cards and sections
  document
    .querySelectorAll(
      ".product-card, .section-title, .form-container, .paypal-card"
    )
    .forEach((el) => {
      el.style.opacity = "0"; // Set initial state for observer
      observer.observe(el);
    });

  // Smooth scroll for nav links
  document.querySelectorAll('nav a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: "smooth",
        });
      }
    });
  });

  // Handle URL Parameters for Order Summary (if added back later)
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get("payment");

  if (paymentStatus === "success") {
    const thankYou = document.getElementById("thankYouMessage");
    if (thankYou) thankYou.style.display = "block";
  }

  // Interactive buttons feedback
  document.querySelectorAll(".buy-btn").forEach((btn) => {
    btn.addEventListener("mousedown", () => {
      btn.style.transform = "scale(0.98)";
    });
    btn.addEventListener("mouseup", () => {
      btn.style.transform = "scale(1.02)";
    });
  });
});
