let bubble = null;
let lastEl = null;
let highlights = [];

function isEditable(el) {
  return el && el.isContentEditable;
}

function createBubble() {
  if (bubble) return;

  bubble = document.createElement("div");
  bubble.textContent = "🔒";
  bubble.style.position = "absolute";
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

  bubble.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    chrome.runtime.sendMessage({
      type: "OPEN_PANEL",
      text: lastEl.innerText || ""
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

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "HIGHLIGHT_PII") {
    applyHighlights(msg.items);
  }
});

function applyHighlights(items) {
  if (!lastEl) return;

  // Reset previous highlights
  lastEl.innerHTML = lastEl.innerText;

  let html = lastEl.innerHTML;

  items.forEach(item => {
    const color =
      item.sensitivity === "sensitive" ? "#dc2626" : "#2563eb";

    const underline = `
      <span
        class="sanitly-highlight"
        style="
          text-decoration: underline;
          text-decoration-color: ${color};
          text-decoration-thickness: 2px;
          cursor: help;
          position: relative;
        "
        title="${item.explanation}"
      >
        ${item.span}
      </span>
    `;

    html = html.replace(item.span, underline);
  });

  lastEl.innerHTML = html;
}

