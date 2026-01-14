let bubble = null;
let lastEl = null;

function isEditable(el) {
  return el && (
    el.tagName === "TEXTAREA" ||
    (el.tagName === "INPUT" && el.type === "text") ||
    el.isContentEditable
  );
}

function createBubble() {
  if (bubble) return;

  bubble = document.createElement("div");
  bubble.textContent = "🔒";
  Object.assign(bubble.style, {
    position: "absolute",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 2147483647,
    fontSize: "14px"
  });

  bubble.addEventListener("mousedown", e => {
    e.preventDefault();
    e.stopPropagation();
    chrome.runtime.sendMessage({
      type: "OPEN_PANEL",
      text: lastEl.value || lastEl.innerText || ""
    });
  });

  document.body.appendChild(bubble);
}

function showBubble(el) {
  createBubble();
  lastEl = el;
  const r = el.getBoundingClientRect();
  bubble.style.top = `${r.bottom + window.scrollY + 6}px`;
  bubble.style.left = `${r.right + window.scrollX - 30}px`;
  bubble.style.display = "flex";
}

function hideBubble() {
  if (bubble) bubble.style.display = "none";
}

document.addEventListener("focusin", e => {
  if (isEditable(e.target)) showBubble(e.target);
});

document.addEventListener("focusout", hideBubble);

// 🔥 SAFE UNDERLINE ENGINE
function underlineText(root, spanText, sensitivity) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const idx = node.textContent.indexOf(spanText);
    if (idx === -1) continue;

    const range = document.createRange();
    range.setStart(node, idx);
    range.setEnd(node, idx + spanText.length);

    const mark = document.createElement("span");
    mark.textContent = spanText;
    mark.style.textDecoration = "underline";
    mark.style.textDecorationThickness = "2px";
    mark.style.textDecorationColor =
      sensitivity === "sensitive" ? "#dc2626" : "#2563eb";

    range.deleteContents();
    range.insertNode(mark);
    break;
  }
}

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === "UNDERLINE" && lastEl?.isContentEditable) {
    msg.items.forEach(i =>
      underlineText(lastEl, i.span, i.sensitivity)
    );
  }
});


