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

function getTextFromElement(el) {
  if (!el) return "";
  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
    return el.value || "";
  }
  if (el.isContentEditable) {
    return el.innerText || "";
  }
  return "";
}

function createBubble() {
  if (bubble) return;

  bubble = document.createElement("div");
  bubble.textContent = "🔒";
  bubble.style.position = "absolute";
  bubble.style.width = "28px";
  bubble.style.height = "28px";
  bubble.style.borderRadius = "50%";
  bubble.style.background = "#16a34a";
  bubble.style.color = "white";
  bubble.style.display = "flex";
  bubble.style.alignItems = "center";
  bubble.style.justifyContent = "center";
  bubble.style.cursor = "pointer";
  bubble.style.zIndex = "2147483647";

  bubble.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!lastEl) return;

    chrome.runtime.sendMessage({
      type: "OPEN_PANEL",
      text: getTextFromElement(lastEl)
    });
  });

  document.body.appendChild(bubble);
}

function positionBubble(el) {
  if (!el || !bubble) return;

  const rect = el.getBoundingClientRect();
  bubble.style.top = `${rect.bottom + window.scrollY + 6}px`;
  bubble.style.left = `${rect.right + window.scrollX - 28}px`;
  bubble.style.display = "flex";
}

document.addEventListener("focusin", (e) => {
  const el = e.target;
  if (!isEditable(el)) return;

  lastEl = el;
  createBubble();
  positionBubble(el);
});

document.addEventListener("focusout", () => {
  if (bubble) bubble.style.display = "none";
});
