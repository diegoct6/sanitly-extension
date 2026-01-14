chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "OPEN_PANEL") {
    if (!sender.tab?.id) return;

    chrome.sidePanel.open({
      tabId: sender.tab.id
    });

    // Forward text to panel
    chrome.runtime.sendMessage({
      type: "TEXT_FROM_PAGE",
      text: msg.text || ""
    });
  }
});
