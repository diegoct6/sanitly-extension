const btn = document.getElementById("detectBtn");
const itemsDiv = document.getElementById("items");

btn.onclick = async () => {
  itemsDiv.textContent = "Detecting...";

  const { lastText } = await chrome.storage.local.get("lastText");

  const res = await fetch(
    "https://fmyczyfgohmslbfstiqu.supabase.co/functions/v1/detect-pii",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lastText })
    }
  );

  const data = await res.json();
  itemsDiv.innerHTML = "";

  data.items.forEach(item => {
    const div = document.createElement("div");
    div.className = `card ${item.sensitivity}`;
    div.innerHTML = `<strong>${item.type}</strong><br/>${item.span}`;
    itemsDiv.appendChild(div);
  });

  // 🔑 Send items back to content script
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, {
      type: "HIGHLIGHT_PII",
      items: data.items
    });
  });
};

