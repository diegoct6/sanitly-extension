const SUPABASE_URL =
  "https://fmyczyfgohmslbfstiqu.supabase.co/functions/v1/detect-pii";

let detectedItems = [];

const itemsEl = document.getElementById("items");
const detectBtn = document.getElementById("detectBtn");
const applyBtn = document.getElementById("applyBtn");

chrome.storage.session.get("lastText", ({ lastText }) => {
  window.sourceText = lastText || "";
});

detectBtn.onclick = async () => {
  itemsEl.innerHTML = "Detecting...";
  applyBtn.disabled = true;

  const res = await fetch(SUPABASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: window.sourceText })
  });

  const data = await res.json();
  detectedItems = data.items || [];

  render();
};

applyBtn.onclick = () => {
  let redacted = window.sourceText;

  detectedItems.forEach((i) => {
    redacted = redacted.replaceAll(i.span, i.replacement);
  });

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text) => {
        const el = document.activeElement;
        if (el?.value !== undefined) el.value = text;
        else if (el?.isContentEditable) el.innerText = text;
      },
      args: [redacted]
    });
  });
};

function render() {
  itemsEl.innerHTML = "";
  detectedItems.forEach((i) => {
    const card = document.createElement("div");
    card.className = `card ${i.sensitivity === "sensitive" ? "sensitive" : "basic"}`;
    card.innerHTML = `
      <strong>${i.type}</strong>
      ${i.span}<br/>
      <small>${i.explanation}</small>
    `;
    itemsEl.appendChild(card);
  });

  applyBtn.disabled = detectedItems.length === 0;
}
