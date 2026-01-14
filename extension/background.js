chrome.runtime.onMessage.addListener(function (message, sender) {
    if (message.type === "OPEN_PANEL") {
      chrome.storage.local.set({ sanitlyText: message.text }, function () {
        if (sender.tab && sender.tab.id) {
          chrome.sidePanel.open({ tabId: sender.tab.id });
        }
      });
    }
  });
  