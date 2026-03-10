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

  const encodedToken =
    "cGF0TDNuT1FThFAyaTY4c1hsLjY5MGQwZjJjOTg3MDRhZWFiMzAxOTBjOGVmNGQ4MmYxN2I2ODc4MGViMTMwODMzMjcxMmE4ZmQ2Y2FjOWU5N2I=";
  const airtableToken = atob(encodedToken);
  const baseId = "appREveHzZZJ8qhgi";
  const tableName = "Products";

  // Airtable Stock Check System
  const checkStock = async () => {
    const buyButtonContainer = document.getElementById("buy-button");
    const stockInfo = document.getElementById("stock-info");
    if (!buyButtonContainer) return;

    const url = `https://api.airtable.com/v0/${baseId}/${tableName}?filterByFormula=AND(NOT({Sold}), NOT({Reserved}))`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${airtableToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch stock data from Airtable.");
      }

      const data = await response.json();
      const availableRecords = data.records.length;

      if (stockInfo) {
        stockInfo.textContent = `In Stock: ${availableRecords} codes available`;
        stockInfo.style.color =
          availableRecords > 0 ? "var(--primary-color)" : "red";
      }

      if (availableRecords === 0) {
        buyButtonContainer.innerHTML =
          '<h3 style="color:red; text-align:center; margin-top:20px;">❌ Out of Stock</h3>';
        if (stockInfo) stockInfo.textContent = "❌ Out of Stock";
        return false;
      }
      return true;
    } catch (error) {
      console.error("Airtable Error:", error);
      if (stockInfo) stockInfo.textContent = "Error checking stock";
      return false;
    }
  };

  // Initialize PayPal Button System
  const initPayPal = () => {
    if (!document.getElementById("paypal-button-container")) return;

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
                amount: {
                  value: "2.50",
                },
                description: "Xbox Game Pass Premium",
              },
            ],
          });
        },
        onApprove: async function (data, actions) {
          const details = await actions.order.capture();
          const buyerEmail = details.payer.email_address;

          // UI State: Show Loading
          document.getElementById("buy-button").style.display = "none";
          document.getElementById("payment-instruction").style.display = "none";
          document.getElementById("stock-info").style.display = "none";
          document.getElementById("loading-message").style.display = "block";

          try {
            // Step 1: Find an available record (Sold=false AND Reserved=false)
            const fetchUrl = `https://api.airtable.com/v0/${baseId}/${tableName}?filterByFormula=AND(NOT({Sold}), NOT({Reserved}))&maxRecords=1`;
            const fetchRes = await fetch(fetchUrl, {
              headers: { Authorization: `Bearer ${airtableToken}` },
            });
            const fetchData = await fetchRes.json();

            if (fetchData.records.length === 0) {
              alert("Sorry, we just ran out of stock! Please contact support.");
              return;
            }

            const recordId = fetchData.records[0].id;

            // Step 2: Immediately set Reserved=true to lock the code
            await fetch(
              `https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${airtableToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  fields: { Reserved: true },
                }),
              }
            );

            // Step 4: Retrieve the Game pass code from the locked record
            const codeRes = await fetch(
              `https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`,
              {
                headers: { Authorization: `Bearer ${airtableToken}` },
              }
            );
            const codeData = await codeRes.json();
            const gamePassCode = codeData.fields["Game pass code"];

            // Step 5: Display the code
            document.getElementById("loading-message").style.display = "none";
            document.getElementById("code-display").style.display = "block";
            document.getElementById("game-pass-code").textContent =
              gamePassCode;

            // Step 6: Update record to Sold=true and log Buyer Email
            await fetch(
              `https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${airtableToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  fields: {
                    Sold: true,
                    "Buyer Email": buyerEmail,
                  },
                }),
              }
            );
          } catch (error) {
            console.error("Secure Delivery Error:", error);
            alert(
              "There was an error delivering your code. Please check your email or contact support."
            );
          }
        },
      })
      .render("#paypal-button-container");
  };

  // Run initial logic
  if (window.location.pathname.includes("payment.html")) {
    checkStock().then((hasStock) => {
      if (hasStock) {
        initPayPal();
      }
    });
  }
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
