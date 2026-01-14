chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: "panel.html",
    enabled: true
  });
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "OPEN_PANEL" && sender.tab?.id) {
    chrome.sidePanel.open({ tabId: sender.tab.id });
    chrome.storage.local.set({ lastText: msg.text || "" });
  }
});
