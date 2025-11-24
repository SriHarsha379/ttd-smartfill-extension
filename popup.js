// popup.js - TTD SmartFill Pro - Multi-Family Management (FIXED)

const statusEl = document.getElementById("status");
const profilesContainer = document.getElementById("profiles-container");
const saveBtn = document.getElementById("saveProfiles");
const autofillBtn = document.getElementById("autofillTTD");
const addProfileBtn = document.getElementById("addProfile");
const profileCountEl = document.getElementById("profile-count");

const familySelect = document.getElementById("familySelect");
const addFamilyBtn = document.getElementById("addFamily");
const deleteFamilyBtn = document.getElementById("deleteFamily");
const renameFamilyBtn = document.getElementById("renameFamily");

const MAX_PROFILES = 6;
let currentFamilyId = "1";
let allFamilies = {};

// General details (shared across all profiles in a family)
const GENERAL_FIELDS = [
  "email",
  "phone",
  "address",
  "city",
  "state",
  "country",
  "pincode",
  "gothram"
];

// Individual profile fields
const PROFILE_FIELDS = [
  "fullName",
  "age",
  "gender",
  "idType",
  "idNumber"
];

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = "status " + (isError ? "error" : "ok");
  setTimeout(() => {
    statusEl.textContent = "";
    statusEl.className = "status";
  }, 3000);
}

function updateProfileCount() {
  const count = profilesContainer.querySelectorAll(".profile-card").length;
  profileCountEl.textContent = `${count} profile${count !== 1 ? 's' : ''}`;

  if (count >= MAX_PROFILES) {
    addProfileBtn.style.display = "none";
  } else {
    addProfileBtn.style.display = "block";
  }
}

function createProfileCard(index) {
  const card = document.createElement("div");
  card.className = "profile-card";
  card.dataset.index = index;

  card.innerHTML = `
    <div class="profile-header">
      <div class="profile-title">Person ${index + 1}</div>
      <button class="btn-remove" title="Remove profile">×</button>
    </div>

    <div class="field-group">
      <label>Full Name *</label>
      <input placeholder="Ex: Rama Krishna" data-field="fullName" required />
    </div>

    <div class="row-3">
      <div class="field-group">
        <label>Age *</label>
        <input type="number" min="1" max="120" data-field="age" required />
      </div>

      <div class="field-group">
        <label>Gender *</label>
        <select data-field="gender" required>
          <option value="">Select</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
      </div>
    </div>

    <div class="row-2">
      <div class="field-group">
        <label>ID Type *</label>
        <input data-field="idType" placeholder="Aadhaar Card (or PAN, Passport, Voter ID)" required />
      </div>

      <div class="field-group">
        <label>ID Number *</label>
        <input data-field="idNumber" placeholder="Enter ID number" required />
      </div>
    </div>
  `;

  const removeBtn = card.querySelector(".btn-remove");
  removeBtn.addEventListener("click", () => {
    card.remove();
    renumberProfiles();
    updateProfileCount();
  });

  return card;
}

function renumberProfiles() {
  const cards = [...profilesContainer.querySelectorAll(".profile-card")];
  cards.forEach((card, index) => {
    card.dataset.index = index;
    card.querySelector(".profile-title").textContent = `Person ${index + 1}`;
  });
}

function getGeneralDetailsFromUI() {
  const generalTab = document.getElementById("general-tab");
  const details = {};

  GENERAL_FIELDS.forEach(field => {
    const el = generalTab.querySelector(`[data-field="${field}"]`);
    details[field] = el ? el.value.trim() : "";
  });

  return details;
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

function fillGeneralDetailsToUI(details) {
  const generalTab = document.getElementById("general-tab");

  GENERAL_FIELDS.forEach(field => {
    const el = generalTab.querySelector(`[data-field="${field}"]`);
    if (el) el.value = details[field] || "";
  });
}

function fillProfilesToUI(profiles) {
  profilesContainer.innerHTML = "";

  profiles.forEach((profile, index) => {
    const card = createProfileCard(index);
    profilesContainer.appendChild(card);

    PROFILE_FIELDS.forEach(field => {
      const el = card.querySelector(`[data-field="${field}"]`);
      if (el) el.value = profile[field] || "";
    });
  });

  updateProfileCount();
}

function saveCurrentFamilyToMemory() {
  // Safety check: ensure currentFamilyId exists
  if (!allFamilies[currentFamilyId]) {
    console.warn(`Family ${currentFamilyId} does not exist, creating new entry`);
    allFamilies[currentFamilyId] = {
      name: `Family ${currentFamilyId}`,
      generalDetails: {},
      profiles: []
    };
  }

  const generalDetails = getGeneralDetailsFromUI();
  const profiles = getProfilesFromUI();

  // Safely get the family name
  const selectedOption = familySelect.options[familySelect.selectedIndex];
  const familyName = selectedOption ? selectedOption.text : allFamilies[currentFamilyId].name;

  allFamilies[currentFamilyId] = {
    name: familyName,
    generalDetails,
    profiles
  };
}

function loadFamilyToUI(familyId) {
  currentFamilyId = familyId;

  const family = allFamilies[familyId];

  if (family) {
    fillGeneralDetailsToUI(family.generalDetails || {});
    fillProfilesToUI(family.profiles || []);
  } else {
    fillGeneralDetailsToUI({});
    fillProfilesToUI([]);
  }

  updateDeleteButton();
}

function updateFamilyDropdown() {
  const selectedValue = familySelect.value;
  familySelect.innerHTML = "";

  const sortedIds = Object.keys(allFamilies).sort((a, b) => parseInt(a) - parseInt(b));

  sortedIds.forEach(id => {
    const family = allFamilies[id];
    if (!family) return; // Skip if family is null/undefined

    const option = document.createElement("option");
    option.value = id;
    option.textContent = family.name || `Family ${id}`;
    familySelect.appendChild(option);
  });

  // Only set value if the family still exists
  if (allFamilies[selectedValue]) {
    familySelect.value = selectedValue;
  } else if (sortedIds.length > 0) {
    // Default to first available family
    familySelect.value = sortedIds[0];
    currentFamilyId = sortedIds[0];
  }

  updateDeleteButton();
}

function updateDeleteButton() {
  const familyCount = Object.keys(allFamilies).length;
  deleteFamilyBtn.disabled = familyCount <= 1;
  deleteFamilyBtn.style.opacity = familyCount <= 1 ? "0.5" : "1";
}

async function loadAllFamiliesFromStorage() {
  const { ttd_families, ttd_last_family_id } = await chrome.storage.local.get([
    "ttd_families",
    "ttd_last_family_id"
  ]);

  if (ttd_families && Object.keys(ttd_families).length > 0) {
    allFamilies = ttd_families;

    // Restore last used family if it exists
    if (ttd_last_family_id && allFamilies[ttd_last_family_id]) {
      currentFamilyId = ttd_last_family_id;
    } else {
      // Default to first family
      const firstId = Object.keys(allFamilies).sort((a, b) => parseInt(a) - parseInt(b))[0];
      currentFamilyId = firstId || "1";
    }
  } else {
    // Initialize with default family
    allFamilies = {
      "1": {
        name: "Family 1",
        generalDetails: {},
        profiles: []
      }
    };
    currentFamilyId = "1";
  }

  updateFamilyDropdown();
  loadFamilyToUI(currentFamilyId);
}

async function saveAllFamiliesToStorage() {
  saveCurrentFamilyToMemory();
  await chrome.storage.local.set({
    ttd_families: allFamilies,
    ttd_last_family_id: currentFamilyId
  });
  setStatus("Family saved ✔");
}

function addNewFamily() {
  saveCurrentFamilyToMemory();

  const familyIds = Object.keys(allFamilies).map(id => parseInt(id));
  const newId = (Math.max(...familyIds, 0) + 1).toString();

  const familyName = prompt("Enter family name:", `Family ${newId}`);
  if (!familyName) return;

  allFamilies[newId] = {
    name: familyName,
    generalDetails: {},
    profiles: []
  };

  updateFamilyDropdown();
  familySelect.value = newId;
  loadFamilyToUI(newId);
  setStatus(`${familyName} added ✔`);
}

function deleteCurrentFamily() {
  const familyCount = Object.keys(allFamilies).length;

  if (familyCount <= 1) {
    setStatus("Cannot delete the last family", true);
    return;
  }

  const family = allFamilies[currentFamilyId];
  if (!family) {
    setStatus("Family not found", true);
    return;
  }

  const currentName = family.name;
  const confirmed = confirm(`Delete "${currentName}"?\n\nThis cannot be undone.`);

  if (!confirmed) return;

  delete allFamilies[currentFamilyId];

  const remainingIds = Object.keys(allFamilies).sort((a, b) => parseInt(a) - parseInt(b));
  const newCurrentId = remainingIds[0];

  updateFamilyDropdown();
  familySelect.value = newCurrentId;
  loadFamilyToUI(newCurrentId);

  saveAllFamiliesToStorage();
  setStatus(`${currentName} deleted`);
}

function renameCurrentFamily() {
  const family = allFamilies[currentFamilyId];
  if (!family) {
    setStatus("Family not found", true);
    return;
  }

  const currentName = family.name;
  const newName = prompt("Enter new family name:", currentName);

  if (!newName || newName === currentName) return;

  allFamilies[currentFamilyId].name = newName;
  updateFamilyDropdown();
  setStatus(`Renamed to "${newName}" ✔`);
}

async function triggerAutofill() {
  saveCurrentFamilyToMemory();

  // Save last used family for hotkey
  await chrome.storage.local.set({ ttd_last_family_id: currentFamilyId });

  const family = allFamilies[currentFamilyId];

  if (!family) {
    setStatus("Family not found", true);
    return;
  }

  if (!family.profiles || family.profiles.length === 0) {
    setStatus("No profiles to fill", true);
    return;
  }

  const completeProfiles = family.profiles.map(profile => ({
    ...family.generalDetails,
    ...profile
  }));

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return setStatus("No active tab", true);

    chrome.tabs.sendMessage(
      tabs[0].id,
      {
        type: "TTD_AUTOFILL",
        profiles: completeProfiles
      },
      resp => {
        if (chrome.runtime.lastError) {
          setStatus("Not a valid page / script error", true);
          return;
        }
        if (resp?.success) setStatus(`Autofilled ${family.name} ⚡`);
        else setStatus("Autofill failed", true);
      }
    );
  });
}

function addNewProfile() {
  const currentCount = profilesContainer.querySelectorAll(".profile-card").length;

  if (currentCount >= MAX_PROFILES) {
    setStatus(`Maximum ${MAX_PROFILES} profiles per family`, true);
    return;
  }

  const newCard = createProfileCard(currentCount);
  profilesContainer.appendChild(newCard);
  updateProfileCount();

  newCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;

      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(`${tabName}-tab`).classList.add("active");
    });
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  setupTabs();
  await loadAllFamiliesFromStorage();

  familySelect.addEventListener("change", (e) => {
    saveCurrentFamilyToMemory();
    loadFamilyToUI(e.target.value);
  });

  addFamilyBtn.addEventListener("click", addNewFamily);
  deleteFamilyBtn.addEventListener("click", deleteCurrentFamily);
  renameFamilyBtn.addEventListener("click", renameCurrentFamily);

  saveBtn.addEventListener("click", saveAllFamiliesToStorage);
  autofillBtn.addEventListener("click", triggerAutofill);
  addProfileBtn.addEventListener("click", addNewProfile);
});