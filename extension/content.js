// content.js — in-place redaction (safe MVP)

let lastEl = null;

/* ------------------ Utils ------------------ */

function isEditable(el) {
  if (!el) return false;
  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName === "INPUT" && el.type === "text") return true;
  if (el.isContentEditable) return true;
  return false;
}

/* ------------------ Track focused field ------------------ */

document.addEventListener("focusin", (e) => {
  if (isEditable(e.target)) {
    lastEl = e.target;
  }
});

/* ------------------ Redaction ------------------ */

function applyRedaction(items) {
  if (!lastEl || !items?.length) return;

  let text =
    lastEl.value ??
    lastEl.innerText ??
    "";

  items.forEach(item => {
    if (!item.span || !item.replacement) return;

    const escaped = item.span.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "g");

    text = text.replace(regex, item.replacement);
  });

  // Write back safely
  if ("value" in lastEl) {
    lastEl.value = text;
  } else {
    lastEl.innerText = text;
  }
}

/* ------------------ Messages ------------------ */

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "APPLY_REDACTION") {
    applyRedaction(msg.items || []);
  }
});

