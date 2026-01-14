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
  Object.assign(bubble.style, {
    position: "absolute",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 2147483647,
    fontSize: "14px"
  });

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
  const r = el.getBoundingClientRect();
  bubble.style.top = `${r.bottom + window.scrollY - 8}px`;
  bubble.style.left = `${r.right + window.scrollX - 32}px`;
  bubble.style.display = "flex";
}

document.addEventListener("focusin", (e) => {
  if (!isEditable(e.target)) return;
  lastEl = e.target;
  createBubble();
  positionBubble(e.target);
});

document.addEventListener("focusout", () => {
  if (bubble) bubble.style.display = "none";
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "REDACT_TEXT" || !lastEl) return;

  let text = lastEl.value || lastEl.innerText;

  msg.replacements.forEach((r) => {
    text = text.replaceAll(r.span, r.replacement);
  });

  if ("value" in lastEl) lastEl.value = text;
  else lastEl.innerText = text;
});
