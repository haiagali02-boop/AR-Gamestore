const encodedToken = "cGF0TDNuT1E4UDJpNjhzWGwuNjkwZDBmMmM5ODcwNGFlYWIzMDE5MGM4ZWY0ZDgyZjE3YjY4NzgwZWIxMzA4MzMyNzEyaThmZDNjYWM5ZTk3Yg==";
const AIRTABLE_TOKEN = atob(encodedToken);
const BASE_ID = "appREveHzZZJ8qhgi";
const TABLE_NAME = "Products";

const popup = document.getElementById('popup');
const codeDisplay = document.getElementById('code-display');

document.querySelectorAll('.buy-btn').forEach(btn => {
  btn.addEventListener('click', () => { popup.style.display = 'flex'; });
});

document.querySelector('.close-popup').addEventListener('click', () => {
  popup.style.display = 'none';
  codeDisplay.innerHTML = '';
});

async function fetchAvailableCode(customerEmail) {
  try {
    let response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?filterByFormula=AND(NOT({Sold}), NOT({Reserved}))&pageSize=1`, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
    });
    let data = await response.json();
    if (data.records.length === 0) {
      codeDisplay.innerText = "❌ Out of Stock";
      return null;
    }
    const record = data.records[0];
    await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${record.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { Reserved: true } })
    });
    await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${record.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { Sold: true, "Buyer Email": customerEmail } })
    });
    return record.fields["Game pass code"];
  } catch(err) {
    console.error(err);
    codeDisplay.innerText = "Error fetching code";
    return null;
  }
}

paypal.Buttons({
  createOrder: (data, actions) => actions.order.create({ purchase_units: [{ amount: { value: "2.50" } }] }),
  onApprove: async (data, actions) => {
    const details = await actions.order.capture();
    const email = details.payer.email_address;
    codeDisplay.innerText = "Preparing your Game Pass code...";
    const code = await fetchAvailableCode(email);
    if(code){ codeDisplay.innerHTML = "Your Xbox Game Pass Code: <b>" + code + "</b>"; }
  }
}).render('#paypal-button-container');
