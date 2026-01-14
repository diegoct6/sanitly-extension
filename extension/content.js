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
  bubble.style.background = "#2563eb"; // BLUE (Grammarly-ish)
  bubble.style.color = "white";
  bubble.style.display = "flex";
  bubble.style.alignItems = "center";
  bubble.style.justifyContent = "center";
  bubble.style.cursor = "pointer";
  bubble.style.zIndex = "2147483647";

  // IMPORTANT: use pointerdown, not click
  bubble.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    chrome.runtime.sendMessage({
      type: "OPEN_PANEL",
      text: lastEl?.value || lastEl?.innerText || ""
    });
  });

  document.body.appendChild(bubble);
}

function showBubble(el) {
  createBubble();
  lastEl = el;

  const rect = el.getBoundingClientRect();
  bubble.style.top = `${rect.bottom + window.scrollY + 6}px`;
  bubble.style.left = `${rect.right + window.scrollX - 24}px`;
  bubble.style.display = "flex";
}

document.addEventListener("focusin", (e) => {
  if (isEditable(e.target)) {
    showBubble(e.target);
  }
});
