chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "OPEN_PANEL") {
    chrome.sidePanel.open({ tabId: sender.tab.id });
    chrome.storage.local.set({ lastText: msg.text });
  }
});
