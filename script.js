document.addEventListener("DOMContentLoaded", () => {
  // Add scroll animation to all relevant cards
  const animatedElements = document.querySelectorAll(
    ".product-card, .paypal-card"
  );
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

  animatedElements.forEach((element) => {
    observer.observe(element);
  });
});

// Add simple hover effect feedback for all buttons
const buttons = document.querySelectorAll(".buy-btn, .submit-btn");
buttons.forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    btn.style.opacity = "0.9";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.opacity = "1";
  });
});
