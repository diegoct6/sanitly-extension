const ENDPOINT =
  "https://fmyczyfgohmslbfstiqu.supabase.co/functions/v1/detect-pii";

let detectedItems = [];

document.getElementById("detectBtn").onclick = async () => {
  const status = document.getElementById("status");
  const itemsEl = document.getElementById("items");

  status.textContent = "Detecting…";
  itemsEl.innerHTML = "";

  chrome.storage.local.get("sanitlyText", async ({ sanitlyText }) => {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sanitlyText || "" })
      });

      const json = await res.json();
      detectedItems = json.items || [];

      status.textContent = "";
      renderItems();
    } catch {
      status.textContent = "Error detecting PII";
    }
  });
};

function renderItems() {
  const itemsEl = document.getElementById("items");
  itemsEl.innerHTML = "";

  detectedItems.forEach((item, i) => {
    const card = document.createElement("div");
    card.className = `card ${item.sensitivity}`;

    card.innerHTML = `
      <div class="card-header">
        <span class="badge ${item.sensitivity}">
          ${item.type} • ${item.sensitivity}
        </span>
        <label class="switch">
          <input type="checkbox" checked data-index="${i}">
          <span class="slider"></span>
        </label>
      </div>
      <div class="value">${item.span}</div>
      <div class="hint">${item.explanation}</div>
      <div class="replacement">Replacement: ${item.replacement}</div>
    `;

    itemsEl.appendChild(card);
  });
}

