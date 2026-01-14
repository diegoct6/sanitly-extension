let bubble = null;
let lastEl = null;

/**
 * Editable field detection
 */
function isEditable(el) {
  if (!el) return false;
  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName === "INPUT" && el.type === "text") return true;
  if (el.isContentEditable) return true;
  return false;
}

/**
 * Create bubble once
 */
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
  bubble.style.display = "none";
  bubble.style.alignItems = "center";
  bubble.style.justifyContent = "center";
  bubble.style.cursor = "pointer";
  bubble.style.zIndex = "2147483647";
  bubble.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
  bubble.style.userSelect = "none";

  bubble.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!lastEl) return;
    if (!chrome?.runtime?.id) return;

    const text = lastEl.isContentEditable
      ? lastEl.innerText
      : lastEl.value || "";

    // 🔒 HARD GUARD: never let this throw
    try {
      chrome.runtime.sendMessage(
        {
          type: "OPEN_PANEL",
          text
        },
        () => {
          // Ignore runtime.lastError silently
          void chrome.runtime?.lastError;
        }
      );
    } catch (_) {
      // Context invalidated → ignore safely
    }
  });

  document.body.appendChild(bubble);
}

/**
 * Position bubble
 */
function positionBubble(el) {
  if (!bubble || !el) return;

  const rect = el.getBoundingClientRect();
  bubble.style.top = `${rect.bottom + window.scrollY - 32}px`;
  bubble.style.left = `${rect.right + window.scrollX - 32}px`;
  bubble.style.display = "flex";
}

/**
 * Hide bubble
 */
function hideBubble() {
  if (bubble) bubble.style.display = "none";
}

/**
 * Focus tracking
 */
document.addEventListener("focusin", (e) => {
  const el = e.target;
  if (!isEditable(el)) return;

  lastEl = el;
  createBubble();
  positionBubble(el);
});

/**
 * Hide when clicking elsewhere
 */
document.addEventListener("mousedown", (e) => {
  if (bubble && e.target === bubble) return;
  hideBubble();
});

/**
 * Keep position stable
 */
window.addEventListener("scroll", () => {
  if (lastEl) positionBubble(lastEl);
});

window.addEventListener("resize", () => {
  if (lastEl) positionBubble(lastEl);
});

