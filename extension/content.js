function isEditable(el) {
    if (!el) return false;
  
    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName === "INPUT" && el.type === "text") return true;
    if (el.isContentEditable) return true;
  
    return false;
  }
  
  document.addEventListener("focusin", (e) => {
    const el = e.target;
    if (!isEditable(el)) return;
  
    console.log("[Sanitly] Active field detected:", el);
    console.log("[Sanitly] Current value:", el.value || el.innerText);
  });
  