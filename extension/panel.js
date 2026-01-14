const DETECT_BTN = document.getElementById("detectBtn");
const APPLY_BTN = document.getElementById("applyBtn");
const ITEMS_EL = document.getElementById("items");
const STATUS_EL = document.getElementById("status");

const SUPABASE_FN =
  "https://fmyczyfgohmslbfstiqu.supabase.co/functions/v1/detect-pii";

let lastItems = [];

/* ---------- Helpers ---------- */

function badgeColor(item) {
  return item.sensitivity === "sensitive" ? "red" : "blue";
}

function renderItems(items) {
  ITEMS_EL.innerHTML = "";
  STATUS_EL.textContent = `${items.length} PII items detected`;

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = `card ${badgeColor(item)}`;

    card.innerHTML = `
      <div class="card-header">
        <strong>${item.type}</strong>
        <span class="pill ${badgeColor(item)}">
          ${item.sensitivity}
        </span>
      </div>

      <div class="card-value">${item.span}</div>

      <div class="card-expl">
        ${item.explanation}
      </div>

      <div class="card-repl">
        → ${item.replacement}
      </div>
    `;

    ITEMS_EL.appendChild(card);
  });
}

/* ---------- Detect ---------- */

DETECT_BTN.addEventListener("click", async () => {
  STATUS_EL.textContent = "Detecting…";
  ITEMS_EL.innerHTML = "";

  chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.activeElement?.innerText || document.activeElement?.value || ""
    });

    if (!result) {
      STATUS_EL.textContent = "No editable text found";
      return;
    }

    const res = await fetch(SUPABASE_FN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: result })
    });

    const data = await res.json();
    lastItems = data.items || [];

    renderItems(lastItems);

    chrome.tabs.sendMessage(tab.id, {
      type: "UNDERLINE_PII",
      items: lastItems
    });
  });
});

/* ---------- Apply (next step) ---------- */

APPLY_BTN.addEventListener("click", () => {
  alert("Apply Redaction comes next — underline phase complete ✔️");
});


