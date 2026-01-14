let bubble = null;
let lastEl = null;

function isEditable(el) {
  return (
    el &&
    (el.tagName === "TEXTAREA" ||
      (el.tagName === "INPUT" && el.type === "text") ||
      el.isContentEditable)
  );
}

function createBubble() {
  if (bubble) return;

  bubble = document.createElement("div");
  bubble.textContent = "🔒";
  bubble.style.position = "absolute";
  bubble.style.width = "28px";
  bubble.style.height = "28px";
  bubble.style.borderRadius = "50%";
  bubble.style.background = "#2563eb"; // blue
  bubble.style.color = "white";
  bubble.style.display = "flex";
  bubble.style.alignItems = "center";
  bubble.style.justifyContent = "center";
  bubble.style.cursor = "pointer";
  bubble.style.zIndex = "2147483647";
  bubble.style.boxShadow = "0 4px 10px rgba(0,0,0,.15)";

  bubble.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!lastEl) return;

    chrome.runtime.sendMessage({
      type: "OPEN_PANEL",
      text: lastEl.innerText || lastEl.value || ""
    });
  });

  document.body.appendChild(bubble);
}

function positionBubble(el) {
  const rect = el.getBoundingClientRect();
  bubble.style.top = `${window.scrollY + rect.bottom - 14}px`;
  bubble.style.left = `${window.scrollX + rect.right - 14}px`;
}

document.addEventListener("focusin", (e) => {
  const el = e.target;
  if (!isEditable(el)) return;

  lastEl = el;
  createBubble();
  positionBubble(el);
  bubble.style.display = "flex";
});

document.addEventListener("focusout", () => {
  if (bubble) bubble.style.display = "none";
});
