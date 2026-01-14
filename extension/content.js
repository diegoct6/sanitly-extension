let bubble = null;
let activeEl = null;

function isEditable(el) {
  return (
    el &&
    (el.tagName === "TEXTAREA" ||
      el.tagName === "INPUT" ||
      el.isContentEditable)
  );
}

/* ===== Caret position ===== */
function getCaretRect() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(true);

  const rects = range.getClientRects();
  return rects.length ? rects[0] : null;
}

/* ===== Bubble ===== */
function createBubble() {
  if (bubble) return;

  bubble = document.createElement("div");
  bubble.textContent = "🔒";
  bubble.style.position = "absolute";
  bubble.style.width = "26px";
  bubble.style.height = "26px";
  bubble.style.borderRadius = "50%";
  bubble.style.background = "#2563eb"; // blue
  bubble.style.color = "#fff";
  bubble.style.display = "flex";
  bubble.style.alignItems = "center";
  bubble.style.justifyContent = "center";
  bubble.style.cursor = "pointer";
  bubble.style.zIndex = "2147483647";
  bubble.style.fontSize = "14px";

  bubble.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!activeEl) return;

    chrome.runtime.sendMessage({
      type: "OPEN_PANEL",
      text: activeEl.value || activeEl.innerText || ""
    });
  });

  document.body.appendChild(bubble);
}

function positionBubble() {
  const rect = getCaretRect();
  if (!rect) {
    bubble.style.display = "none";
    return;
  }

  bubble.style.top = `${rect.bottom + window.scrollY + 6}px`;
  bubble.style.left = `${rect.right + window.scrollX + 6}px`;
  bubble.style.display = "flex";
}

/* ===== Events ===== */
document.addEventListener("selectionchange", () => {
  if (!activeEl) return;
  createBubble();
  positionBubble();
});

document.addEventListener("focusin", (e) => {
  if (!isEditable(e.target)) return;
  activeEl = e.target;
  createBubble();
  positionBubble();
});

document.addEventListener("focusout", () => {
  activeEl = null;
  if (bubble) bubble.style.display = "none";
});

/* ===== Apply redaction ===== */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "APPLY_REDACTION") return;

  if (!activeEl) return;

  let text =
    activeEl.value !== undefined
      ? activeEl.value
      : activeEl.innerText;

  msg.items.forEach((item) => {
    if (!item.enabled) return;

    const escaped = item.span.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "g");
    text = text.replace(re, item.replacement);
  });

  if (activeEl.value !== undefined) {
    activeEl.value = text;
  } else {
    activeEl.innerText = text;
  }
});


