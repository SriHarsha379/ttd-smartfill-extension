// ======================================================
// TTD SmartFill - MULTI-PROFILE UL/LI ENGINE
// Handles multiple tickets with different profiles
// ======================================================

// -----------------------------
// Extract clean label for input
// -----------------------------
function getSmartLabel(input) {
  if (input.getAttribute("label"))
    return input.getAttribute("label").replace("*", "").trim();

  if (input.placeholder)
    return input.placeholder.replace("*", "").trim();

  const prev = input.previousElementSibling;
  if (prev && prev.innerText)
    return prev.innerText.replace("*", "").trim();

  return "";
}

// -----------------------------
// Detect which profile field it is
// -----------------------------
function guessFieldType(input, labelText) {
  const all = ((input.getAttribute("label") || "") + " " + (labelText || "")).toLowerCase();

  if (all.includes("email")) return "email";
  if (all.includes("city")) return "city";
  if (all.includes("state")) return "state";
  if (all.includes("country")) return "country";
  if (all.includes("pin")) return "pincode";
  if (all.includes("phone")) return "phone";
  if (all.includes("address")) return "address";

  if (all.includes("name")) return "fullName";
  if (all.includes("age")) return "age";
  if (all.includes("gothram")) return "gothram";

  if (all.includes("gender")) return "gender";
  if (all.includes("photo id proof") || all.includes("id type")) return "idType";

  if (all.includes("id number") || all.includes("aadhaar") || all.includes("pan"))
    return "idNumber";

  return null;
}

// -----------------------------
// Fill basic text input fields
// -----------------------------
function applyValue(el, val) {
  if (!val) return;
  el.value = val;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

// -----------------------------
// Group inputs by ticket section
// Only include Gruhastha Details sections
// -----------------------------
function groupInputsBySection() {
  const sections = [];
  const allInputs = Array.from(document.querySelectorAll("input"));

  let currentSection = [];
  let inGruhastha = false;

  allInputs.forEach(input => {
    const label = getSmartLabel(input);
    const field = guessFieldType(input, label);

    // Start tracking when we hit "Name" field (Gruhastha section starts)
    if (field === "fullName") {
      // Save previous section if exists
      if (currentSection.length > 0) {
        sections.push(currentSection);
      }
      // Start new section
      currentSection = [input];
      inGruhastha = true;
      return;
    }

    // Only add to section if we're in Gruhastha Details area
    if (inGruhastha) {
      currentSection.push(input);
    }
  });

  // Push last section
  if (currentSection.length > 0) {
    sections.push(currentSection);
  }

  console.log(`📋 Found ${sections.length} ticket sections`);
  sections.forEach((sec, i) => {
    console.log(`  Section ${i + 1}: ${sec.length} inputs`);
  });
  return sections;
}

// -----------------------------
// Scan ALL <li> dropdown options
// -----------------------------
function scanULOptions() {
  const list = [];

  const selectors = [
    ".dropdown_scroll ul li",
    "ul li.floatingDropdown_ListItem_tU_5X",
    "ul li",
  ];

  for (const sel of selectors) {
    const found = document.querySelectorAll(sel);
    found.forEach(li => {
      const text = li.innerText.trim();
      if (text.length > 0) list.push({ node: li, text });
    });
  }

  return list;
}

// -----------------------------
// Wait for dropdown to render
// -----------------------------
async function waitForULOptions(timeout = 1500) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const ops = scanULOptions();
    if (ops.length > 0) return ops;
    await new Promise(r => setTimeout(r, 60));
  }

  return [];
}

// -----------------------------
// Pick option from UL LI list
// -----------------------------
async function pickULOption(value, options) {
  const target = value.trim().toLowerCase();

  for (const op of options) {
    const txt = op.text.trim().toLowerCase();

    if (txt === target || txt.includes(target) || target.includes(txt)) {
      op.node.scrollIntoView({ block: "center" });
      op.node.click();
      return true;
    }
  }

  console.error("❌ Match not found:", value);
  console.log("Available options:", options.map(o => o.text));
  return false;
}

// -----------------------------
// Open specific dropdown by input element
// -----------------------------
function openDropdownByElement(input) {
  input.scrollIntoView({ block: "center" });
  input.click();
  input.focus();
}

// -----------------------------
// FULL HANDLER for dropdowns (element-specific)
// -----------------------------
async function handleDropdownForInput(input, value) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`🔽 Attempt ${attempt} for dropdown`);

    openDropdownByElement(input);
    await new Promise(r => setTimeout(r, 250));

    const ops = await waitForULOptions(1500);
    if (ops.length === 0) {
      console.warn(`⚠ No options displayed`);
      continue;
    }

    const ok = await pickULOption(value, ops);
    if (ok) return true;
  }

  console.error(`❌ FAILED to select dropdown value: ${value}`);
  return false;
}

// -----------------------------
// Fill a single section with profile
// -----------------------------
async function fillSection(inputs, profile, sectionIndex) {
  console.log(`\n🎫 Filling Section ${sectionIndex + 1} with:`, profile.fullName);

  // First pass: Fill all text inputs (including ID Number)
  for (const input of inputs) {
    const label = getSmartLabel(input);
    const field = guessFieldType(input, label);

    if (!field) continue;
    if (field === "gender" || field === "idType") continue; // Handle dropdowns separately

    applyValue(input, profile[field]);
  }

  await new Promise(r => setTimeout(r, 200));

  // Second pass: Handle dropdowns
  for (const input of inputs) {
    const label = getSmartLabel(input);
    const field = guessFieldType(input, label);

    if (field === "gender" && profile.gender) {
      console.log(`🔽 Setting Gender: ${profile.gender}`);
      await handleDropdownForInput(input, profile.gender);
      await new Promise(r => setTimeout(r, 200));
    }

    if (field === "idType" && profile.idType) {
      console.log(`🔽 Setting ID Type: ${profile.idType}`);
      await handleDropdownForInput(input, profile.idType);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // Third pass: Fill ID Number after ID Type is selected
  // (Some forms only enable ID Number field after ID Type is chosen)
  await new Promise(r => setTimeout(r, 200));

  for (const input of inputs) {
    const label = getSmartLabel(input);
    const field = guessFieldType(input, label);

    if (field === "idNumber" && profile.idNumber) {
      console.log(`🔢 Setting ID Number: ${profile.idNumber}`);
      applyValue(input, profile.idNumber);
    }
  }

  console.log(`✅ Section ${sectionIndex + 1} complete`);
}

// -----------------------------
// Fill General Details (top section)
// -----------------------------
function fillGeneralDetails(profile) {
  console.log("📝 Filling General Details with:", profile.fullName);

  const allInputs = document.querySelectorAll("input");

  allInputs.forEach(input => {
    const label = getSmartLabel(input);
    const field = guessFieldType(input, label);

    // Only fill General Details fields (not Gruhastha)
    if (!field) return;
    if (field === "fullName" || field === "age" || field === "gender" ||
        field === "idType" || field === "idNumber") return;

    // Fill: email, city, state, country, pincode, phone, address, gothram
    applyValue(input, profile[field]);
  });

  console.log("✅ General Details filled");
}

// -----------------------------
// MAIN AUTOFILL ENGINE
// -----------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "TTD_AUTOFILL") return;

  (async () => {
    console.log("🚀 AUTOFILL START - Multi-Profile Mode");
    console.log("📦 Profiles received:", msg.profiles.length);

    // Step 1: Fill General Details with Person 1
    if (msg.profiles[0]) {
      fillGeneralDetails(msg.profiles[0]);
      await new Promise(r => setTimeout(r, 300));
    }

    // Step 2: Fill Gruhastha Details sections
    const sections = groupInputsBySection();

    for (let i = 0; i < sections.length; i++) {
      const profile = msg.profiles[i];

      if (!profile) {
        console.warn(`⚠️ No profile for section ${i + 1}, skipping`);
        continue;
      }

      await fillSection(sections[i], profile, i);

      // Small delay between sections
      if (i < sections.length - 1) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    console.log("\n✅ AUTOFILL COMPLETE - All sections filled");
    sendResponse({ success: true });
  })();

  return true;
});