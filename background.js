// background.js – stable messaging for Manifest V3

function sendAutofill(profiles) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    const tabId = tabs[0].id;

    // Make sure the tab exists & is ready before messaging
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => {
          console.log("TTD SmartFill → content script ready check");
        }
      },
      () => {
        // Now send the message to content.js
        chrome.tabs.sendMessage(
          tabId,
          { type: "TTD_AUTOFILL", profiles },
          (response) => {
            if (chrome.runtime.lastError) {
              console.warn(
                "TTD SmartFill ERROR:",
                chrome.runtime.lastError.message
              );
            } else {
              console.log("TTD SmartFill response:", response);
            }
          }
        );
      }
    );
  });
}

// Hotkey: Alt+Shift+F (⌥+Shift+F on Mac)
chrome.commands.onCommand.addListener((cmd) => {
  if (cmd === "ttd_autofill_hotkey") {
    chrome.storage.local.get(["ttd_profiles"], ({ ttd_profiles }) => {
      const profiles = ttd_profiles || [];
      sendAutofill(profiles);
    });
  }
});
