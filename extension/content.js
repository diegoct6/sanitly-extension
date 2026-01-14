let bubble = null;
let activeEl = null;

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
  bubble.style.cssText = `
    position:absolute;
    width:28px;
    height:28px;
    border-radius:50%;
    background:#2563eb;
    color:white;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    z-index:2147483647;
    font-size:14px;
  `;

  bubble.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    chrome.runtime.sendMessage({
      type: "OPEN_PANEL",
      text: activeEl.value || activeEl.innerText || ""
    });
  };

  document.body.appendChild(bubble);
}

function positionBubble(el) {
  const r = el.getBoundingClientRect();
  bubble.style.top = `${r.bottom + window.scrollY + 6}px`;
  bubble.style.left = `${r.right + window.scrollX - 28}px`;
  bubble.style.display = "flex";
}

document.addEventListener("focusin", (e) => {
  if (!isEditable(e.target)) return;
  activeEl = e.target;
  createBubble();
  positionBubble(activeEl);
});

document.addEventListener("focusout", () => {
  if (bubble) bubble.style.display = "none";
});
