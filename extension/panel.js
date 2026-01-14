const detectBtn = document.getElementById("detectBtn");
const applyBtn = document.getElementById("applyBtn");
const itemsDiv = document.getElementById("items");

let detected = [];

detectBtn.onclick = async () => {
  itemsDiv.innerHTML = "Detecting…";

  const { sanitly_text } = await chrome.storage.local.get("sanitly_text");

  const res = await fetch(
    "https://fmyczyfgohmslbfstiqu.supabase.co/functions/v1/detect-pii",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sanitly_text })
    }
  );

  const data = await res.json();
  detected = data.items.map((i) => ({ ...i, enabled: true }));

  render();
};

applyBtn.onclick = async () => {
  const { sanitly_source } = await chrome.storage.local.get("sanitly_source");

  chrome.runtime.sendMessage({
    type: "APPLY_REDACTION",
    tabId: sanitly_source.tabId,
    replacements: detected.filter((d) => d.enabled)
  });
};

function render() {
  itemsDiv.innerHTML = "";

  detected.forEach((d, idx) => {
    const card = document.createElement("div");
    card.className = `card ${d.category === "identity" ? "basic" : "sensitive"}`;

    card.innerHTML = `
      <label>
        <input type="checkbox" ${d.enabled ? "checked" : ""}/>
        <strong>${d.type}</strong><br/>
        <small>${d.span}</small>
      </label>
    `;

    card.querySelector("input").onchange = (e) => {
      detected[idx].enabled = e.target.checked;
    };

    itemsDiv.appendChild(card);
  });
}
