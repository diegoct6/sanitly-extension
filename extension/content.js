function isEditable(el) {
  if (!el) return false;

  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName === "INPUT" && el.type === "text") return true;
  if (el.isContentEditable) return true;

  return false;
}

/* ---------------- Bubble ---------------- */

let bubble = null;

function createBubble() {
  if (bubble) return;

  bubble = document.createElement("div");
  bubble.id = "sanitly-bubble";
  bubble.textContent = "🔒";
  document.body.appendChild(bubble);
}

function showBubbleNear(el) {
  createBubble();

  const rect = el.getBoundingClientRect();

  bubble.style.top = `${rect.bottom + window.scrollY + 6}px`;
  bubble.style.left = `${rect.right + window.scrollX - 24}px`;
  bubble.style.display = "flex";
}

function hideBubble() {
  if (bubble) bubble.style.display = "none";
}

/* ---------------- Events ---------------- */

document.addEventListener("focusin", (e) => {
  const el = e.target;
  if (!isEditable(el)) return;

  console.log("[Sanitly] Active field detected:", el);
  console.log("[Sanitly] Current value:", el.value || el.innerText);

  showBubbleNear(el);
});

document.addEventListener("focusout", () => {
  hideBubble();
});
