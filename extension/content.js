// content.js — underline only, NO text mutation

let bubble = null;
let lastEl = null;
let highlights = [];

/* ------------------ Utils ------------------ */

function isEditable(el) {
  if (!el) return false;
  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName === "INPUT" && el.type === "text") return true;
  if (el.isContentEditable) return true;
  return false;
}

/* ------------------ Bubble ------------------ */

function createBubble() {
  if (bubble) return;

  bubble = document.createElement("div");
  bubble.textContent = "🔒";
  bubble.style.position = "absolute";
  bubble.style.width = "28px";
  bubble.style.height = "28px";
  bubble.style.borderRadius = "50%";
  bubble.style.background = "#2563eb"; // blue
  bubble.style.color = "#fff";
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
      text: lastEl.value || lastEl.innerText || ""
    });
  });

  document.body.appendChild(bubble);
}

function positionBubble(el) {
  const rect = el.getBoundingClientRect();
  bubble.style.top = `${window.scrollY + rect.bottom + 6}px`;
  bubble.style.left = `${window.scrollX + rect.right - 28}px`;
  bubble.style.display = "flex";
}

function hideBubble() {
  if (bubble) bubble.style.display = "none";
}

/* ------------------ Focus tracking ------------------ */

document.addEventListener("focusin", (e) => {
  const el = e.target;
  if (!isEditable(el)) return;

  lastEl = el;
  createBubble();
  positionBubble(el);
});

document.addEventListener("focusout", () => {
  hideBubble();
});

/* ------------------ Highlight logic ------------------ */

function clearHighlights() {
  highlights.forEach(span => {
    if (span.parentNode) {
      span.replaceWith(span.textContent);
    }
  });
  highlights = [];
}

function underlineText(el, items) {
  clearHighlights();

  let text = el.innerText;
  let html = text;

  items.forEach(item => {
    const color =
      item.sensitivity === "sensitive" ? "#dc2626" : "#2563eb";

    const escaped = item.span.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    html = html.replace(
      new RegExp(escaped, "g"),
      `<span class="sanitly-underline"
         data-type="${item.type}"
         style="
           text-decoration: underline;
           text-decoration-color: ${color};
           text-decoration-thickness: 2px;
           text-underline-offset: 2px;
         "
       >${item.span}</span>`
    );
  });

  el.innerHTML = html;
  highlights = Array.from(el.querySelectorAll(".sanitly-underline"));
}

/* ------------------ Messages ------------------ */

chrome.runtime.onMessage.addListener((msg) => {
  if (!lastEl) return;

  if (msg.type === "UNDERLINE_PII") {
    underlineText(lastEl, msg.items || []);
  }

  if (msg.type === "CLEAR_PII") {
    clearHighlights();
  }
});
