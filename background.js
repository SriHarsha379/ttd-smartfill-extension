// background.js – Multi-family support for hotkey autofill

function sendAutofill(profiles) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    const tabId = tabs[0].id;

    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => {
          console.log("TTD SmartFill → content script ready check");
        }
      },
      () => {
        chrome.tabs.sendMessage(
          tabId,
          { type: "TTD_AUTOFILL", profiles: profiles },
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
// Uses the last active family
chrome.commands.onCommand.addListener((cmd) => {
  if (cmd === "ttd_autofill_hotkey") {
    chrome.storage.local.get(["ttd_families", "ttd_last_family_id"], (result) => {
      const families = result.ttd_families || {};
      const lastFamilyId = result.ttd_last_family_id || "1";

      const family = families[lastFamilyId];

      if (!family || !family.profiles || family.profiles.length === 0) {
        console.warn("No profiles found for autofill");
        return;
      }

      // Combine general details with profiles
      const completeProfiles = family.profiles.map(profile => ({
        ...family.generalDetails,
        ...profile
      }));

      sendAutofill(completeProfiles);
    });
  }
});