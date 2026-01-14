chrome.runtime.onMessage.addListener((msg, sender) => {
  // Open side panel
  if (msg.type === "OPEN_PANEL") {
    chrome.sidePanel.open({
      tabId: sender.tab.id
    });
  }

  // Apply redaction (next step wiring)
  if (msg.type === "APPLY_REDACTION") {
    chrome.tabs.sendMessage(msg.tabId, {
      type: "APPLY_REDACTION",
      replacements: msg.replacements
    });
  }
});
