const SUPABASE_ENDPOINT =
  "https://fmyczyfgohmslbfstiqu.supabase.co/functions/v1/detect-pii";

document.getElementById("detectBtn").onclick = async function () {
  const status = document.getElementById("status");
  const itemsEl = document.getElementById("items");

  status.textContent = "Detecting…";
  itemsEl.innerHTML = "";

  chrome.storage.local.get("sanitlyText", async function (data) {
    try {
      const res = await fetch(SUPABASE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.sanitlyText || "" })
      });

      const json = await res.json();
      status.textContent = "";

      json.items.forEach(function (item) {
        const div = document.createElement("div");
        div.textContent = item.type + ": " + item.span;
        itemsEl.appendChild(div);
      });
    } catch (e) {
      status.textContent = "Error";
    }
  });
};
