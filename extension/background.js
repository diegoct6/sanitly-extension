chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "OPEN_PANEL") {
    chrome.sidePanel.open({ tabId: sender.tab.id });
    chrome.storage.local.set({
      sanitly_text: msg.text,
      sanitly_source: {
        tabId: sender.tab.id,
        frameId: sender.frameId
      }
    });
  }

  if (msg.type === "APPLY_REDACTION") {
    chrome.tabs.sendMessage(msg.tabId, {
      type: "REDACT_TEXT",
      replacements: msg.replacements
    });
  }
});
