// panel.js — detect + apply redaction

const detectBtn = document.getElementById("detectBtn");
const applyBtn = document.getElementById("applyBtn");
const itemsDiv = document.getElementById("items");

let detected = [];
let activeTabId = null;

/* ------------------ UI helpers ------------------ */

function card(item) {
  const bg = item.sensitivity === "sensitive" ? "#fee2e2" : "#eff6ff";
  const border = item.sensitivity === "sensitive" ? "#dc2626" : "#2563eb";

  return `
    <div style="
      background:${bg};
      border-left:4px solid ${border};
      padding:10px;
      margin-bottom:8px;
      border-radius:8px;
      font-size:13px;
    ">
      <strong>${item.type}</strong><br/>
      ${item.span}<br/>
      <small>→ ${item.replacement}</small>
    </div>
  `;
}

/* ------------------ Detect ------------------ */

detectBtn.onclick = async () => {
  itemsDiv.innerHTML = "Detecting…";

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  activeTabId = tab.id;

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: activeTabId },
    func: () =>
      document.activeElement?.value ||
      document.activeElement?.innerText ||
      ""
  });

  const res = await fetch(
    "https://fmyczyfgohmslbfstiqu.supabase.co/functions/v1/detect-pii",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: result })
    }
  );

  const data = await res.json();
  detected = data.items || [];

  itemsDiv.innerHTML = detected.map(card).join("");
  applyBtn.disabled = !detected.length;
};

/* ------------------ Apply ------------------ */

applyBtn.onclick = async () => {
  if (!activeTabId || !detected.length) return;

  chrome.tabs.sendMessage(activeTabId, {
    type: "APPLY_REDACTION",
    items: detected
  });
};
