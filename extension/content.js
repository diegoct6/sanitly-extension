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
  bubble.style.left = `${rect.right + window.scrollX - 28}px`;
  bubble.style.display = "flex";
}

document.addEventListener("focusin", (e) => {
  if (!isEditable(e.target)) return;
  lastEl = e.target;
  createBubble();
  positionBubble(lastEl);
});

document.addEventListener("focusout", () => {
  if (bubble) bubble.style.display = "none";
});

/* ---------- Underlining ---------- */

function clearUnderlines() {
  activeMarks.forEach(mark => {
    const parent = mark.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
  activeMarks = [];
}

function underlinePII(el, items) {
  if (!el || !items?.length) return;

  clearUnderlines();

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node;

  while ((node = walker.nextNode())) {
    items.forEach(item => {
      const idx = node.nodeValue.indexOf(item.span);
      if (idx === -1) return;

      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + item.span.length);

      const mark = document.createElement("span");
      mark.textContent = item.span;
      mark.style.textDecoration = "underline";
      mark.style.textDecorationThickness = "2px";
      mark.style.textDecorationColor =
        item.sensitivity === "sensitive" ? "#dc2626" : "#2563eb";
      mark.style.cursor = "help";

      mark.title = `${item.type.toUpperCase()} — ${item.explanation}`;

      range.deleteContents();
      range.insertNode(mark);

      activeMarks.push(mark);
    });
  }
}

/* ---------- Messaging ---------- */

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "UNDERLINE_PII") {
    underlinePII(lastEl, msg.items);
  }
});
