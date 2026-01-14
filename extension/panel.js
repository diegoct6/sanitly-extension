const btn = document.getElementById("detect");
const itemsDiv = document.getElementById("items");
const applyBtn = document.getElementById("apply");

let detected = [];

btn.onclick = async () => {
  itemsDiv.innerHTML = "Detecting...";
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
  detected = data.items || [];
  render();

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "UNDERLINE",
      items: detected
    });
  });
};

function render() {
  itemsDiv.innerHTML = "";
  detected.forEach(i => {
    const d = document.createElement("div");
    d.className = `card ${i.sensitivity}`;
    d.innerHTML = `<b>${i.type}</b><br>${i.span}`;
    itemsDiv.appendChild(d);
  });
  applyBtn.disabled = !detected.length;
}

