// popup.js - TTD SmartFill with AUTO Profile Switching (Option D)

const statusEl = document.getElementById("status");
const profilesContainer = document.getElementById("profiles-container");
const saveBtn = document.getElementById("saveProfiles");
const autofillBtn = document.getElementById("autofillTTD");

// All fields including gothram + country
const PROFILE_FIELDS = [
  "fullName",
  "age",
  "gender",
  "phone",
  "email",
  "address",
  "city",
  "state",
  "country",
  "pincode",
  "gothram",
  "idType",
  "idNumber"
];

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = "status " + (isError ? "error" : "ok");
}

function createProfileCard(index) {
  const card = document.createElement("div");
  card.className = "profile-card";

  card.innerHTML = `
    <div class="profile-header">
      <div class="profile-title">Person ${index + 1}</div>
      <div class="profile-tag">TTD Profile</div>
    </div>

    <div class="field-group">
      <label>Full Name</label>
      <input placeholder="Ex: Rama Krishna" data-field="fullName" />
    </div>

    <div class="row-3">
      <div class="field-group">
        <label>Age</label>
        <input type="number" min="1" max="120" data-field="age" />
      </div>

      <div class="field-group">
        <label>Gender</label>
        <select data-field="gender">
          <option value="">Select</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
      </div>

      <div class="field-group">
        <label>Phone</label>
        <input data-field="phone" />
      </div>
    </div>

    <div class="row-2">
      <div class="field-group">
        <label>Email</label>
        <input data-field="email" />
      </div>

      <div class="field-group">
        <label>Pincode</label>
        <input data-field="pincode" />
      </div>
    </div>

    <div class="field-group">
      <label>Address</label>
      <input data-field="address" />
    </div>

    <div class="row-2">
      <div class="field-group">
        <label>City</label>
        <input data-field="city" />
      </div>

      <div class="field-group">
        <label>State</label>
        <input data-field="state" />
      </div>
    </div>

    <div class="field-group">
      <label>Country</label>
      <input data-field="country" placeholder="India" />
    </div>

    <div class="field-group">
      <label>Gothram</label>
      <input data-field="gothram" placeholder="Bharadwaja / Vishwamitra" />
    </div>

    <div class="row-2">
      <div class="field-group">
        <label>ID Type</label>
        <input data-field="idType" placeholder="Aadhaar / PAN / Voter ID" />
      </div>

      <div class="field-group">
        <label>ID Number</label>
        <input data-field="idNumber" />
      </div>
    </div>
  `;

  return card;
}

function getProfilesFromUI() {
  const cards = [...profilesContainer.querySelectorAll(".profile-card")];
  return cards.map(card => {
    const profile = {};
    PROFILE_FIELDS.forEach(f => {
      const el = card.querySelector(`[data-field="${f}"]`);
      profile[f] = el ? el.value.trim() : "";
    });
    return profile;
  });
}

function fillProfilesToUI(profiles) {
  const cards = [...profilesContainer.querySelectorAll(".profile-card")];

  profiles.forEach((profile, index) => {
    const card = cards[index];
    if (!card) return;

    PROFILE_FIELDS.forEach(field => {
      const el = card.querySelector(`[data-field="${field}"]`);
      if (el) el.value = profile[field] || "";
    });
  });
}

async function loadProfilesFromStorage() {
  const { ttd_profiles, ttd_next_pair } = await chrome.storage.local.get([
    "ttd_profiles",
    "ttd_next_pair"
  ]);

  const profiles = ttd_profiles || [];

  while (profiles.length < 4) {
    profiles.push(Object.fromEntries(PROFILE_FIELDS.map(f => [f, ""])));
  }

  fillProfilesToUI(profiles);

  // If no next pair saved -> default to pair 1
  if (!ttd_next_pair) {
    chrome.storage.local.set({ ttd_next_pair: 1 });
  }
}

async function saveProfilesToStorage() {
  const profiles = getProfilesFromUI();
  await chrome.storage.local.set({ ttd_profiles: profiles });
  setStatus("Profiles saved ✔");
}

async function triggerAutofill() {
  const profiles = getProfilesFromUI();

  const { ttd_next_pair } = await chrome.storage.local.get("ttd_next_pair");
  let pair = ttd_next_pair || 1;

  // Determine which 2 profiles to send
  let sendProfiles =
    pair === 1 ? [profiles[0], profiles[1]] : [profiles[2], profiles[3]];

  // Flip pair for next time
  await chrome.storage.local.set({
    ttd_next_pair: pair === 1 ? 2 : 1
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return setStatus("No active tab", true);

    chrome.tabs.sendMessage(
      tabs[0].id,
      {
        type: "TTD_AUTOFILL",
        profiles: sendProfiles   // ⭐ send only 2 profiles
      },
      resp => {
        if (chrome.runtime.lastError) {
          setStatus("Not a valid page / script error", true);
          return;
        }
        if (resp?.success) setStatus("Autofill triggered ⚡");
        else setStatus("Autofill failed", true);
      }
    );
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  for (let i = 0; i < 4; i++) profilesContainer.appendChild(createProfileCard(i));
  await loadProfilesFromStorage();

  saveBtn.addEventListener("click", saveProfilesToStorage);
  autofillBtn.addEventListener("click", triggerAutofill);
});
