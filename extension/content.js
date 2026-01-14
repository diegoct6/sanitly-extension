let bubble = null;
let lastEl = null;
let activeMarks = [];

function isEditable(el) {
  return (
    el &&
    (el.tagName === "TEXTAREA" ||
      (el.tagName === "INPUT" && el.type === "text") ||
      el.isContentEditable)
  );
}

/* ---------- Bubble ---------- */

function createBubble() {
  if (bubble) return;

  bubble = document.createElement("div");
  bubble.textContent = "🔒";
  bubble.style.position = "fixed";
  bubble.style.width = "28px";
  bubble.style.height = "28px";
  bubble.style.borderRadius = "50%";
  bubble.style.background = "#2563eb";
  bubble.style.color = "white";
  bubble.style.display = "flex";
  bubble.style.alignItems = "center";
  bubble.style.justifyContent = "center";
  bubble.style.cursor = "pointer";
  bubble.style.zIndex = "2147483647";

  bubble.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    chrome.runtime.sendMessage({
      type: "OPEN_PANEL",
      text: lastEl?.innerText || lastEl?.value || ""
    });
  });

  document.body.appendChild(bubble);
}

function positionBubble(el) {
  if (!el) return;

  const rect = el.getBoundingClientRect();
  bubble.style.top = `${rect.top + window.scrollY - 34}px`;
  bubble.style.left = `${r


