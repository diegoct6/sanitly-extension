const SUPABASE_URL =
  "https://fmyczyfgohmslbfstiqu.supabase.co/functions/v1/detect-pii";

const detectBtn = document.getElementById("detectBtn");
const applyBtn = document.getElementById("applyBtn");
const itemsDiv = document.getElementById("items");

let detectedItems = [];

detectBtn.onclick = async () => {
  itemsDiv.innerHTML = "Detecting…";
  applyBtn.disabled = true;

  const { lastText } = await chrome.storage.local.get("lastText");

  const res = await fetch(SUPABASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: lastText || "" })
  });

  const data = await res.json();

  detectedItems = data.items.map((i) => ({
    ...i,
    enabled: true
  }));

  render();
};

applyBtn.onclick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, {
      type: "APPLY_REDACTION",
      items: detectedItems
    });
  });
};

function render() {
  itemsDiv.innerHTML = "";
  applyBtn.disabled = false;

  detectedItems.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className =
      "card " + (item.sensitivity === "sensitive" ? "sensitive" : "basic");

    card.innerHTML = `
      <label>
        <input type="checkbox" ${item.enabled ? "checked" : ""}/>
        <strong>${item.type}</strong><br/>
        <span>${item.span}</span><br/>
        <small>→ ${item.replacement}</small>
      </label>
    `;

    card.querySelector("input").onchange = (e) => {
      detectedItems[idx].enabled = e.target.checked;
    };

    itemsDiv.appendChild(card);
  });
}

