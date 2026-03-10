document.addEventListener("DOMContentLoaded", () => {
  // PayPal Integration
  if (document.getElementById("paypal-button-container")) {
    paypal
      .Buttons({
        createOrder: function (data, actions) {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: "2.50", // The price of the product
                },
              },
            ],
          });
        },
        onApprove: function (data, actions) {
          return actions.order.capture().then(function (details) {
            // 1. Submit the form via FormSubmit
            const form = document.getElementById("order-form");
            const formData = new FormData(form);

            fetch(form.action, {
              method: "POST",
              body: formData,
              headers: {
                Accept: "application/json",
              },
            })
              .then((response) => {
                if (response.ok) {
                  // 2. Show the thank you popup
                  document.getElementById("thank-you-popup").style.display =
                    "flex";
                } else {
                  alert(
                    "There was an issue submitting your order. Please contact support."
                  );
                }
              })
              .catch((error) => {
                console.error("Form submission error:", error);
                alert(
                  "Could not submit order. Please check your connection and try again."
                );
              });
          });
        },
        onError: function (err) {
          console.error("PayPal Error:", err);
          alert("An error occurred with your payment. Please try again.");
        },
      })
      .render("#paypal-button-container");
  }

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

  document
    .querySelectorAll(".product-card, .section-title, .form-container")
    .forEach((el) => {
      el.style.opacity = "0";
      observer.observe(el);
    });
});
