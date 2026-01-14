const detectBtn = document.getElementById("detectBtn");
const applyBtn = document.getElementById("applyBtn");
const itemsDiv = document.getElementById("items");
const statusEl = document.getElementById("status");

const SUPABASE_FN =
  "https://fmyczyfgohmslbfstiqu.supabase.co/functions/v1/detect-pii";

let detected = [];
let activeTabId = null;

/* ---------- Helpers ---------- */

function render() {
  itemsDiv.innerHTML = "";
  statusEl.textContent = `${detected.length} PII items detected`;

  detected.forEach((d, idx) => {
    const card = document.createElement("div");
    card.className = `card ${d.sensitivity}`;

    card.innerHTML = `
      <div class="card-header">
        <strong>${d.type}</strong>
        <label class="toggle">
          <input type="checkbox" ${d.enabled ? "checked" : ""}/>
          <span></span>
        </label>
      </div>
      <div class="card-value">${d.span}</div>
      <div class="card-expl">${d.explanation}</div>
    `;

    card.querySelector("input").onchange = (e) => {
      detected[idx].enabled = e.target.checked;
    };

    itemsDiv.appendChild(card);
  });
}

/* ---------- Detect ---------- */

detectBtn.onclick = async () => {
  statusEl.textContent = "Detecting…";
  itemsDiv.innerHTML = "";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab.id;

  // Always fetch fresh text from page
  const [{ result: pageText }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () =>
      document.activeElement?.innerText ||
      document.activeElement?.value ||
      ""
  });

  if (!pageText) {
    statusEl.textContent = "No editable text found";
    return;
  }

  const res = await fetch(SUPABASE_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: pageText })
  });

  const data = await res.json();

  detected = (data.items || []).map((i) => ({
    ...i,
    enabled: true
  }));

  render();

  // 🔹 Send underline instruction
  chrome.tabs.sendMessage(tab.id, {
    type: "UNDERLINE_PII",
    items: detected
  });
};

/* ---------- Apply (next step) ---------- */

applyBtn.onclick = () => {
  if (!activeTabId) return;

  chrome.runtime.sendMessage({
    type: "APPLY_REDACTION",
    tabId: activeTabId,
    replacements: detected.filter((d) => d.enabled)
  });
};
