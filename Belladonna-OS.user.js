// ==UserScript==
// @name         Belladonna OS
// @version      1.0.0-alpha
// @description  Belladonna OS Alpha 1.0: dashboard, intelligence, operations, profile, settings, and the Oracle.
// @match        *://*.torn.com/*
// @match        *://torn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  /*
    Belladonna Tools

    Uses the player's own Torn API key.
    Stores settings locally on the player's device.
    Reads permitted information from Torn's official API.
    Calculates, organizes, and recommends. It does not play Torn for you.

    Better information is fair play. Automation is where things get stupid.

    - Eshara
  */

  const APP = "belladonnaOS";
  const TORN_API = "https://api.torn.com";

  const $ = id => document.getElementById(id);
  const save = (key, value) => localStorage.setItem(`${APP}:${key}`, String(value));
  const load = (key, fallback = "") => localStorage.getItem(`${APP}:${key}`) ?? fallback;
  const money = value => "$" + Math.round(Number(value || 0)).toLocaleString();
  const number = value => Math.max(0, Number(value || 0));

  function readJson(key, fallback) {
    try {
      return JSON.parse(load(key, JSON.stringify(fallback)));
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    save(key, JSON.stringify(value));
  }

  const defaultProfile = {
    displayName: "",
    experience: "learning",
    build: "balanced",
    primaryGoal: "general",
    secondaryGoal: "none",
    safeAttacks: true,
    saveXanaxForChains: true,
    avoidTravelBeforeChains: true
  };

  const defaultAppearance = {
    accent: "#6e315d",
    compactMode: false
  };

  const getProfile = () => ({ ...defaultProfile, ...readJson("profile", defaultProfile) });
  const getAppearance = () => ({ ...defaultAppearance, ...readJson("appearance", defaultAppearance) });
  const accentColour = () => getAppearance().accent || defaultAppearance.accent;

  const sharedButtonStyle = `
    width:100%;
    box-sizing:border-box;
    padding:10px;
    border-radius:10px;
    border:1px solid #555;
    background:#242424;
    color:#fff;
    font-weight:700;
  `;

  const sharedInputStyle = `
    width:100%;
    box-sizing:border-box;
    margin:4px 0 9px;
    padding:9px;
    border-radius:8px;
    background:#222;
    color:#fff;
    border:1px solid #555;
  `;

  const cardStyle = `
    padding:11px;
    border:1px solid #444;
    border-radius:12px;
    background:#1b1b1b;
    margin-bottom:10px;
  `;

  const FLIGHTS = {
    standard: { label: "Standard", speed: 1.0, capacity: 5 },
    airstrip: { label: "Airstrip / PI", speed: 0.7, capacity: 15 },
    business: { label: "Business Class", speed: 0.3, capacity: 15 }
  };

  const ABROAD_PRICES = {
    "Jaguar Plushie": 10000,
    "Dahlia": 300,
    "Stingray Plushie": 400,
    "Banana Orchid": 4000,
    "Wolverine Plushie": 30,
    "Crocus": 600,
    "Orchid": 700,
    "Nessie Plushie": 200,
    "Heather": 5000,
    "Red Fox Plushie": 1000,
    "Monkey Plushie": 400,
    "Ceibo Flower": 500,
    "Edelweiss": 900,
    "Chamois Plushie": 400,
    "Cherry Blossom": 500,
    "Panda Plushie": 400,
    "Peony": 5000,
    "Camel Plushie": 14000,
    "Tribulus Omanense": 6000,
    "Lion Plushie": 400,
    "African Violet": 2000
  };

  const ROUTES = [
    { country: "Mexico", items: ["Jaguar Plushie", "Dahlia"], minutes: 18 },
    { country: "Cayman Islands", items: ["Stingray Plushie", "Banana Orchid"], minutes: 25 },
    { country: "Canada", items: ["Wolverine Plushie", "Crocus"], minutes: 29 },
    { country: "Hawaii", items: ["Orchid"], minutes: 94 },
    { country: "United Kingdom", items: ["Nessie Plushie", "Heather", "Red Fox Plushie"], minutes: 111 },
    { country: "Argentina", items: ["Monkey Plushie", "Ceibo Flower"], minutes: 117 },
    { country: "Switzerland", items: ["Edelweiss", "Chamois Plushie"], minutes: 123 },
    { country: "Japan", items: ["Cherry Blossom"], minutes: 158 },
    { country: "China", items: ["Panda Plushie", "Peony"], minutes: 169 },
    { country: "UAE", items: ["Camel Plushie", "Tribulus Omanense"], minutes: 190 },
    { country: "South Africa", items: ["Lion Plushie", "African Violet"], minutes: 208 }
  ];

  const chainCommandSettings = {
    defaultGoal: 250,
    energyPerAttack: 25,
    warningTimeSeconds: 180,
    dangerTimeSeconds: 120,
    defaultOrders: [
      "Keep the chain moving. Easy targets are there for a reason.",
      "Call it out early if the timer starts getting ugly.",
      "Do not wander off on a scenic international tour during a push."
    ]
  };

  async function torn(section, id, selections, key) {
    const url = `${TORN_API}/${section}/${id || ""}?selections=${encodeURIComponent(selections)}&key=${encodeURIComponent(key)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.error || JSON.stringify(data.error));
    }

    return data;
  }

  function closeOpenPanels() {
    ["belladonnaHomePanel", "belladonnaTravelPanel", "belladonnaChainPanel", "belladonnaLessonPanel", "belladonnaCoveragePanel", "belladonnaReconPanel", "belladonnaOraclePanel", "belladonnaSettingsPanel", "belladonnaPlaceholderPanel"].forEach(id => {
      const panel = $(id);
      if (panel) panel.remove();
    });
  }

  function createLauncher() {
    if ($("belladonnaLauncher")) return;

    const launcher = document.createElement("div");
    launcher.id = "belladonnaLauncher";

    Object.assign(launcher.style, {
      position: "fixed",
      right: "12px",
      bottom: "46px",
      zIndex: "999999",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: "8px",
      fontFamily: "Arial, sans-serif"
    });

    launcher.innerHTML = `
      <div id="belladonnaToolMenu" style="display:none;flex-direction:column;gap:7px;align-items:flex-end;">
        <button class="belladonnaToolButton" data-tool="home">☠ Home Dashboard</button>
        <button class="belladonnaToolButton" data-tool="oracle">🔮 Belladonna Oracle</button>
        <button class="belladonnaToolButton" data-tool="chain">⛓ Chain Command</button>
        <button class="belladonnaToolButton" data-tool="travel">✈ Travel Calculator</button>
        <button class="belladonnaToolButton" data-tool="recon">🔍 Recon Scanner</button>
        <button class="belladonnaToolButton" data-tool="coverage">🌐 Faction Coverage</button>
        <button class="belladonnaToolButton" data-tool="lesson">📖 Academy</button>
        <button class="belladonnaToolButton" data-tool="settings">⚙ Profile & Settings</button>
        <button class="belladonnaToolButton" data-tool="about">ⓘ About</button>
      </div>

      <button id="belladonnaLauncherButton" style="
        min-width:62px;
        height:44px;
        padding:0 13px;
        border-radius:16px;
        border:1px solid #666;
        background:#151515;
        color:#fff;
        font-weight:800;
        font-size:13px;
        box-shadow:0 3px 12px rgba(0,0,0,.45);
      ">☠ B-OS</button>
    `;

    document.body.appendChild(launcher);

    launcher.querySelectorAll(".belladonnaToolButton").forEach(button => {
      Object.assign(button.style, {
        minWidth: "190px",
        padding: "10px 13px",
        borderRadius: "12px",
        border: "1px solid #555",
        background: "#191919",
        color: "#fff",
        fontWeight: "700",
        fontSize: "13px",
        textAlign: "left",
        boxShadow: "0 3px 10px rgba(0,0,0,.4)"
      });

      button.onclick = () => {
        const tool = button.dataset.tool;
        closeToolMenu();

        if (tool === "home") return openBelladonnaHome();
        if (tool === "travel") return openTravelCalculator();
        if (tool === "chain") return openChainCommand();
        if (tool === "lesson") return openTodaysLesson();
        if (tool === "coverage") return openFactionCoverage();
        if (tool === "recon") return openReconScanner();
        if (tool === "oracle") return openBelladonnaOracle();
        if (tool === "settings") return openBelladonnaSettings();
        if (tool === "about") return openAboutPanel();
      };
    });

    $("belladonnaLauncherButton").onclick = toggleToolMenu;
  }

  function toggleToolMenu() {
    const menu = $("belladonnaToolMenu");
    const button = $("belladonnaLauncherButton");
    const isOpen = menu.style.display === "flex";

    menu.style.display = isOpen ? "none" : "flex";
    button.textContent = isOpen ? "☠ B-OS" : "✕ Close";
  }

  function closeToolMenu() {
    const menu = $("belladonnaToolMenu");
    const button = $("belladonnaLauncherButton");

    if (menu) menu.style.display = "none";
    if (button) button.textContent = "☠ B-OS";
  }

  function makePanel(id, title, subtitle) {
    closeOpenPanels();

    const panel = document.createElement("div");
    panel.id = id;

    Object.assign(panel.style, {
      position: "fixed",
      left: "10px",
      right: "10px",
      bottom: "98px",
      zIndex: "999999",
      maxHeight: "74vh",
      overflowY: "auto",
      background: "#101010",
      color: "#fff",
      border: "1px solid #444",
      borderRadius: "16px",
      padding: "14px",
      fontFamily: "Arial, sans-serif",
      boxShadow: "0 4px 18px rgba(0,0,0,.55)"
    });

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <b>${title}</b>
        <button data-close-panel style="background:#333;color:white;border:0;border-radius:8px;padding:6px 10px;">X</button>
      </div>
      <div style="opacity:.82;font-size:12px;margin-bottom:12px;">${subtitle}</div>
      <div data-panel-body></div>
    `;

    document.body.appendChild(panel);
    panel.querySelector("[data-close-panel]").onclick = () => panel.remove();

    return panel.querySelector("[data-panel-body]");
  }

  function openPlaceholderPanel(title, message) {
    const body = makePanel("belladonnaPlaceholderPanel", title, "Belladonna is expanding. Apparently nobody thought to stop us.");
    body.innerHTML = `<div style="${cardStyle}">${message}</div>`;
  }

  // Belladonna OS application settings.
  // These values are safe to edit before building a release.
  const BELLADONNA_CONFIG = {
    appName: "Belladonna OS",
    releaseName: "Standalone Alpha",
    factionName: "Belladonna",
    tornApiBase: "https://api.torn.com",
    yata: {
      enabled: false,
      baseUrl: "",
      apiKey: ""
    }
  };

  /*
    Manual faction coverage data.

    utcOffset:
      Difference from Torn Time / UTC.
      Ontario during daylight time is -4.
      Pakistan is +5.

    activeHours:
      Local member time, 24-hour format.
      Multiple windows are allowed.

    Add or remove members here, then rebuild the project.
  */
  const BELLADONNA_FACTION_MEMBERS = [
    {
      name: "Eshara",
      tornId: "",
      utcOffset: -4,
      activeHours: ["18:00-23:30"],
      roles: ["Leadership", "Chain Support"],
      notes: "Example entry. Replace with the final faction roster."
    }
  ];

  function factionMembersToCoverageText() {
    const heading = [
      "# Generated from config/faction-data.js",
      "# Format: Name | UTC offset | active hours | roles"
    ];

    const rows = BELLADONNA_FACTION_MEMBERS.map(member => {
      const hours = (member.activeHours || []).join(", ");
      const roles = (member.roles || []).join(", ");
      return `${member.name} | ${member.utcOffset} | ${hours} | ${roles}`;
    });

    return [...heading, ...rows].join("\n");
  }

  // -------------------------
  // YATA INTEGRATION ADAPTER
  // -------------------------

  /*
    YATA is optional. Belladonna OS remains fully usable without it.

    The public YATA project confirms that YATA is a separate Torn helper
    service, but its live spy API contract and authentication should be
    configured from current YATA documentation or faction instructions.

    Set BELLADONNA_CONFIG.yata.enabled, baseUrl, and apiKey in app-config.js.
    The adapter deliberately refuses to invent an endpoint.
  */

  function yataIsConfigured() {
    return Boolean(
      BELLADONNA_CONFIG.yata.enabled &&
      BELLADONNA_CONFIG.yata.baseUrl &&
      BELLADONNA_CONFIG.yata.apiKey
    );
  }

  async function yataRequest(path, options = {}) {
    if (!yataIsConfigured()) {
      throw new Error("YATA is not configured. Belladonna is using local intelligence only.");
    }

    const baseUrl = BELLADONNA_CONFIG.yata.baseUrl.replace(/\/+$/, "");
    const cleanPath = String(path || "").replace(/^\/+/, "");
    const url = `${baseUrl}/${cleanPath}`;

    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${BELLADONNA_CONFIG.yata.apiKey}`,
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      throw new Error(`YATA request failed with status ${response.status}.`);
    }

    return response.json();
  }

  async function getYataSpyReport(playerId) {
    /*
      Configure the exact route once YATA's current spy endpoint is confirmed.
      Keeping this in one function means the rest of Recon never needs to care
      how YATA names or authenticates the route.
    */
    throw new Error(
      `YATA spy route is not configured for player ${playerId}. Add the current route in src/integrations/yata.js.`
    );
  }

  // -------------------------
  // HOME DASHBOARD
  // -------------------------

  function openBelladonnaHome() {
    const profile = getProfile();
    const body = makePanel(
      "belladonnaHomePanel",
      "☠ Belladonna OS",
      "Intelligence, operations, and an unreasonable refusal to waste good information."
    );

    body.innerHTML = `
      <div style="${cardStyle}">
        <div style="font-size:11px;opacity:.72;text-transform:uppercase;letter-spacing:.08em;">Alpha 1.0</div>
        <h2 style="margin:6px 0;">Welcome back, ${profile.displayName || "Operator"}.</h2>
        <div style="opacity:.8;">Let us see what Torn is trying to make your problem today.</div>
      </div>

      <button id="homeRefresh" style="${sharedButtonStyle}background:${accentColour()};border:0;margin-bottom:10px;">Refresh Dashboard</button>
      <div id="homeLiveStatus"><div style="${cardStyle}">Dashboard waiting. Suspiciously calm.</div></div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
        <button data-home-open="oracle" style="${sharedButtonStyle}">🔮 Oracle</button>
        <button data-home-open="chain" style="${sharedButtonStyle}">⛓ Chain</button>
        <button data-home-open="travel" style="${sharedButtonStyle}">✈ Travel</button>
        <button data-home-open="recon" style="${sharedButtonStyle}">🔍 Recon</button>
        <button data-home-open="lesson" style="${sharedButtonStyle}">📖 Academy</button>
        <button data-home-open="settings" style="${sharedButtonStyle}">⚙ Settings</button>
      </div>
    `;

    $("homeRefresh").onclick = refreshHomeDashboard;

    body.querySelectorAll("[data-home-open]").forEach(button => {
      button.onclick = () => {
        const target = button.dataset.homeOpen;
        if (target === "oracle") openBelladonnaOracle();
        if (target === "chain") openChainCommand();
        if (target === "travel") openTravelCalculator();
        if (target === "recon") openReconScanner();
        if (target === "lesson") openTodaysLesson();
        if (target === "settings") openBelladonnaSettings();
      };
    });

    refreshHomeDashboard();
  }

  async function refreshHomeDashboard() {
    const output = $("homeLiveStatus");
    const key = load("apiKey");
    const profile = getProfile();

    if (!key) {
      output.innerHTML = `<div style="${cardStyle}"><b>Setup needed</b><br><br>Add your Torn API key in Profile & Settings. Authentication remains stubbornly non-mystical.</div>`;
      return;
    }

    output.innerHTML = `<div style="${cardStyle}">Reading the room. The room is mostly API endpoints.</div>`;

    const state = { bars: null, travel: null, chain: null, cooldowns: null, errors: [] };

    try { state.bars = await torn("user", "", "bars", key); } catch (error) { state.errors.push("Bars unavailable"); }
    try { state.travel = await torn("user", "", "travel", key); } catch (error) { state.errors.push("Travel unavailable"); }
    try { const faction = await torn("faction", "", "chain", key); state.chain = faction.chain || faction; } catch (error) { state.errors.push("Chain unavailable"); }
    try { const cooldowns = await torn("user", "", "cooldowns", key); state.cooldowns = cooldowns.cooldowns || cooldowns; } catch (error) { state.errors.push("Cooldowns unavailable"); }

    const energy = state.bars?.energy?.current ?? null;
    const maxEnergy = state.bars?.energy?.maximum ?? null;
    const nerve = state.bars?.nerve?.current ?? null;
    const maxNerve = state.bars?.nerve?.maximum ?? null;
    const destination = state.travel?.travel?.destination || state.travel?.destination || "Torn";
    const energyPercent = energy !== null && maxEnergy ? (energy / maxEnergy) * 100 : 0;
    const nervePercent = nerve !== null && maxNerve ? (nerve / maxNerve) * 100 : 0;

    let priority = "No urgent issue detected. A rare and beautiful administrative miracle.";

    if (state.chain?.current > 0 && number(state.chain.timeout) <= 120 && energy >= 25) {
      priority = "Active chain, low timer, enough energy. Make one safe hit before everyone discovers caps lock.";
    } else if (energyPercent >= 90) {
      priority = profile.saveXanaxForChains && state.chain?.current > 0
        ? "Energy is near the cap, but your profile says to preserve resources for chains. Check orders first."
        : "Energy is near the cap. Train or attack before natural regeneration becomes decorative.";
    } else if (nervePercent >= 90) {
      priority = "Nerve is nearly full. Use it before crime becomes an entirely theoretical hobby.";
    }

    output.innerHTML = `
      <div style="${cardStyle}">
        <div style="font-size:11px;opacity:.72;text-transform:uppercase;letter-spacing:.08em;">Current priority</div>
        <h3 style="margin:6px 0;">${priority}</h3>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div style="${cardStyle}"><b>Energy</b><br>${energy !== null ? `${energy}/${maxEnergy ?? "?"}` : "Unavailable"}</div>
        <div style="${cardStyle}"><b>Nerve</b><br>${nerve !== null ? `${nerve}/${maxNerve ?? "?"}` : "Unavailable"}</div>
        <div style="${cardStyle}"><b>Chain</b><br>${state.chain?.current > 0 ? `${state.chain.current} — ${formatChainTime(state.chain.timeout)}` : "Inactive"}</div>
        <div style="${cardStyle}"><b>Location</b><br>${destination}</div>
      </div>

      <div style="${cardStyle}">
        <b>Profile focus</b><br>
        Build: ${profile.build}<br>
        Main goal: ${profile.primaryGoal}<br>
        Experience: ${profile.experience}
      </div>

      ${state.errors.length ? `<div style="${cardStyle}"><b>Partial data</b><br><br>${state.errors.join("<br>")}</div>` : ""}
    `;
  }

  // -------------------------
  // PROFILE & SETTINGS
  // -------------------------

  function openBelladonnaSettings() {
    const body = makePanel(
      "belladonnaSettingsPanel",
      "⚙ Profile & Settings",
      "Tell Belladonna what you are trying to become. Otherwise it guesses, and guessing is how cults start."
    );

    body.innerHTML = `
      <div id="settingsTabs" style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:11px;">
        <button data-settings-tab="profile" style="${sharedButtonStyle}padding:8px 3px;font-size:11px;">Profile</button>
        <button data-settings-tab="api" style="${sharedButtonStyle}padding:8px 3px;font-size:11px;">API</button>
        <button data-settings-tab="appearance" style="${sharedButtonStyle}padding:8px 3px;font-size:11px;">Theme</button>
        <button data-settings-tab="data" style="${sharedButtonStyle}padding:8px 3px;font-size:11px;">Data</button>
      </div>
      <div id="settingsContent"></div>
    `;

    body.querySelectorAll("[data-settings-tab]").forEach(button => {
      button.onclick = () => showSettingsTab(button.dataset.settingsTab);
    });

    showSettingsTab("profile");
  }

  function showSettingsTab(tabName) {
    document.querySelectorAll("[data-settings-tab]").forEach(button => {
      button.style.background = button.dataset.settingsTab === tabName ? accentColour() : "#242424";
    });

    if (tabName === "profile") renderProfileSettings();
    if (tabName === "api") renderApiSettings();
    if (tabName === "appearance") renderAppearanceSettings();
    if (tabName === "data") renderDataSettings();
  }

  function renderProfileSettings() {
    const profile = getProfile();
    const content = $("settingsContent");

    content.innerHTML = `
      <label>Display name</label>
      <input id="profileName" value="${profile.displayName}" placeholder="Eshara, preferably. Dave is less ominous." style="${sharedInputStyle}">

      <label>Experience</label>
      <select id="profileExperience" style="${sharedInputStyle}">
        <option value="new">New</option>
        <option value="learning">Learning</option>
        <option value="experienced">Experienced</option>
        <option value="leadership">Leadership</option>
      </select>

      <label>Battle build</label>
      <select id="profileBuild" style="${sharedInputStyle}">
        <option value="balanced">Balanced</option>
        <option value="strength">Strength</option>
        <option value="defense">Defense</option>
        <option value="speed">Speed</option>
        <option value="dexterity">Dexterity</option>
      </select>

      <label>Primary goal</label>
      <select id="profilePrimaryGoal" style="${sharedInputStyle}">
        <option value="general">General growth</option>
        <option value="battle">Battle stats</option>
        <option value="networth">Networth</option>
        <option value="ranked-war">Ranked war</option>
        <option value="crimes">Crimes</option>
        <option value="travel">Travel income</option>
        <option value="job">Job progression</option>
      </select>

      <label>Secondary goal</label>
      <select id="profileSecondaryGoal" style="${sharedInputStyle}">
        <option value="none">None</option>
        <option value="battle">Battle stats</option>
        <option value="networth">Networth</option>
        <option value="ranked-war">Ranked war</option>
        <option value="crimes">Crimes</option>
        <option value="travel">Travel income</option>
        <option value="job">Job progression</option>
      </select>

      <label style="display:block;margin:8px 0;"><input id="profileSafeAttacks" type="checkbox"> Prefer safer attack advice</label>
      <label style="display:block;margin:8px 0;"><input id="profileSaveXanax" type="checkbox"> Save Xanax for chains</label>
      <label style="display:block;margin:8px 0 12px;"><input id="profileTravelWarning" type="checkbox"> Warn me about travelling before chains</label>

      <button id="profileSave" style="${sharedButtonStyle}background:${accentColour()};border:0;">Save Profile</button>
      <div id="profileMessage" style="font-size:12px;opacity:.82;margin-top:10px;"></div>
    `;

    $("profileExperience").value = profile.experience;
    $("profileBuild").value = profile.build;
    $("profilePrimaryGoal").value = profile.primaryGoal;
    $("profileSecondaryGoal").value = profile.secondaryGoal;
    $("profileSafeAttacks").checked = profile.safeAttacks;
    $("profileSaveXanax").checked = profile.saveXanaxForChains;
    $("profileTravelWarning").checked = profile.avoidTravelBeforeChains;

    $("profileSave").onclick = () => {
      writeJson("profile", {
        displayName: $("profileName").value.trim(),
        experience: $("profileExperience").value,
        build: $("profileBuild").value,
        primaryGoal: $("profilePrimaryGoal").value,
        secondaryGoal: $("profileSecondaryGoal").value,
        safeAttacks: $("profileSafeAttacks").checked,
        saveXanaxForChains: $("profileSaveXanax").checked,
        avoidTravelBeforeChains: $("profileTravelWarning").checked
      });

      $("profileMessage").textContent = "Profile saved. Belladonna now has fewer excuses for bad advice.";
    };
  }

  function renderApiSettings() {
    const content = $("settingsContent");

    content.innerHTML = `
      <label>Torn API key</label>
      <input id="settingsApiKey" value="${load("apiKey")}" placeholder="Stored only on this device" style="${sharedInputStyle}">
      <button id="settingsSaveApi" style="${sharedButtonStyle}margin-bottom:7px;">Save API Key</button>
      <button id="settingsTestApi" style="${sharedButtonStyle}background:${accentColour()};border:0;">Run API Health Check</button>
      <div id="apiHealthOutput" style="font-size:13px;line-height:1.45;margin-top:12px;"></div>
    `;

    $("settingsSaveApi").onclick = () => {
      save("apiKey", $("settingsApiKey").value.trim());
      $("apiHealthOutput").innerHTML = `<div style="${cardStyle}">API key saved locally. It has not been sent anywhere else.</div>`;
    };

    $("settingsTestApi").onclick = runApiHealthCheck;
  }

  async function runApiHealthCheck() {
    const key = $("settingsApiKey").value.trim();
    const output = $("apiHealthOutput");

    if (!key) {
      output.innerHTML = "Add a key first. The health check cannot examine a philosophical concept.";
      return;
    }

    save("apiKey", key);
    output.innerHTML = `<div style="${cardStyle}">Testing access. Politely knocking on several doors.</div>`;

    const tests = [
      ["Basic player information", "user", "basic"],
      ["Bars", "user", "bars"],
      ["Money", "user", "money"],
      ["Travel", "user", "travel"],
      ["Cooldowns", "user", "cooldowns"],
      ["Faction chain", "faction", "chain"]
    ];

    const results = [];

    for (const [label, section, selection] of tests) {
      try {
        await torn(section, "", selection, key);
        results.push({ label, okay: true, message: "Available" });
      } catch (error) {
        results.push({ label, okay: false, message: error.message });
      }
    }

    output.innerHTML = `
      <div style="${cardStyle}">
        <b>API health</b><br><br>
        ${results.map(result => `${result.okay ? "✓" : "⚠"} <b>${result.label}</b><br><span style="opacity:.72;font-size:11px;">${result.message}</span><br><br>`).join("")}
      </div>
      <div style="${cardStyle}">
        <b>Recommendation</b><br><br>
        ${results.every(result => result.okay)
          ? "Everything Alpha 1.0 currently uses is available."
          : "Belladonna will use what is available and fall back where possible. Missing access may simply mean the key is restricted."}
      </div>
    `;
  }

  function renderAppearanceSettings() {
    const appearance = getAppearance();
    const content = $("settingsContent");

    content.innerHTML = `
      <label>Accent colour</label>
      <select id="appearanceAccent" style="${sharedInputStyle}">
        <option value="#6e315d">Belladonna Purple</option>
        <option value="#3d5f8f">Night Blue</option>
        <option value="#477c62">Field Green</option>
        <option value="#8b4b3e">Ember</option>
        <option value="#6b6b6b">Steel</option>
      </select>

      <label style="display:block;margin:8px 0 12px;"><input id="appearanceCompact" type="checkbox"> Compact mode</label>
      <button id="appearanceSave" style="${sharedButtonStyle}background:${accentColour()};border:0;">Save Appearance</button>
      <div id="appearanceMessage" style="font-size:12px;opacity:.82;margin-top:10px;"></div>
    `;

    $("appearanceAccent").value = appearance.accent;
    $("appearanceCompact").checked = appearance.compactMode;

    $("appearanceSave").onclick = () => {
      writeJson("appearance", {
        accent: $("appearanceAccent").value,
        compactMode: $("appearanceCompact").checked
      });
      $("appearanceMessage").textContent = "Appearance saved. Reopen Belladonna OS to see it everywhere.";
    };
  }

  function renderDataSettings() {
    const content = $("settingsContent");

    content.innerHTML = `
      <div style="${cardStyle}">
        <b>Local Belladonna data</b><br><br>
        Back up your profile, settings, lessons, coverage, recon notes, chain information, and other local records.
      </div>

      <button id="dataExport" style="${sharedButtonStyle}background:${accentColour()};border:0;margin-bottom:7px;">Export My Belladonna Data</button>
      <label>Import backup</label>
      <textarea id="dataImportText" rows="6" placeholder="Paste a Belladonna OS backup here" style="${sharedInputStyle}resize:vertical;"></textarea>
      <button id="dataImport" style="${sharedButtonStyle}margin-bottom:7px;">Import Backup</button>
      <button id="dataClear" style="${sharedButtonStyle}background:#5f2525;">Clear Belladonna Data</button>
      <div id="dataMessage" style="font-size:12px;opacity:.82;margin-top:10px;"></div>
    `;

    $("dataExport").onclick = exportBelladonnaData;
    $("dataImport").onclick = importBelladonnaData;
    $("dataClear").onclick = clearBelladonnaData;
  }

  async function exportBelladonnaData() {
    const data = {};

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith(`${APP}:`)) data[key] = localStorage.getItem(key);
    }

    const backup = JSON.stringify({
      app: "Belladonna OS",
      version: "Alpha 1.0",
      exportedAt: new Date().toISOString(),
      data
    }, null, 2);

    try {
      await navigator.clipboard.writeText(backup);
      $("dataMessage").textContent = "Backup copied. Store it somewhere less chaotic than Discord chat.";
    } catch (error) {
      $("dataImportText").value = backup;
      $("dataMessage").textContent = "Clipboard access failed, so the backup is in the text box.";
    }
  }

  function importBelladonnaData() {
    try {
      const backup = JSON.parse($("dataImportText").value.trim());
      if (!backup.data || typeof backup.data !== "object") throw new Error("No data block found.");

      Object.entries(backup.data).forEach(([key, value]) => {
        if (key.startsWith(`${APP}:`)) localStorage.setItem(key, value);
      });

      $("dataMessage").textContent = "Backup imported. Belladonna remembers again.";
    } catch (error) {
      $("dataMessage").textContent = `Import failed: ${error.message}`;
    }
  }

  function clearBelladonnaData() {
    const keys = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith(`${APP}:`)) keys.push(key);
    }

    keys.forEach(key => localStorage.removeItem(key));
    $("dataMessage").textContent = "Belladonna data cleared. A clean slate, which is just a blank problem waiting to happen.";
  }

  // -------------------------
  // TRAVEL CALCULATOR
  // -------------------------

  async function getUserReport(key) {
    const report = {};

    try {
      report.basic = await torn("user", "", "basic", key);
    } catch (error) {
      report.basicError = error.message;
    }

    try {
      report.money = await torn("user", "", "money", key);
    } catch (error) {
      report.moneyError = error.message;
    }

    try {
      report.travel = await torn("user", "", "travel", key);
    } catch (error) {
      report.travelError = error.message;
    }

    return report;
  }

  async function getItemMap(key) {
    const cached = JSON.parse(load("travel:itemMap", "null"));
    const cachedAt = number(load("travel:itemMapAt", "0"));

    if (cached && Date.now() - cachedAt < 24 * 60 * 60 * 1000) {
      return cached;
    }

    const data = await torn("torn", "", "items", key);
    const itemMap = {};

    Object.entries(data.items || {}).forEach(([id, item]) => {
      itemMap[item.name] = { id: Number(id), name: item.name };
    });

    save("travel:itemMap", JSON.stringify(itemMap));
    save("travel:itemMapAt", Date.now());
    return itemMap;
  }

  async function getLowestMarketPrice(itemId, key) {
    const cacheKey = `travel:market:${itemId}`;
    const cached = JSON.parse(load(cacheKey, "null"));

    if (cached && Date.now() - cached.at < 5 * 60 * 1000) {
      return cached.price;
    }

    const url = `${TORN_API}/v2/market/${itemId}/itemmarket?limit=1&offset=0&key=${encodeURIComponent(key)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.error || JSON.stringify(data.error));
    }

    const listings = data.itemmarket?.listings || [];
    if (!listings.length) return null;

    const price = number(listings[0].price);
    save(cacheKey, JSON.stringify({ price, at: Date.now() }));
    return price;
  }

  function openTravelCalculator() {
    const body = makePanel(
      "belladonnaTravelPanel",
      "✈ TBN Voyage Profit Nerd",
      "Better information. Fewer terrible decisions. Allegedly."
    );

    body.innerHTML = `
      <label>API Key</label>
      <input id="travelApiKey" value="${load("apiKey")}" placeholder="Your Torn API key" style="${sharedInputStyle}">

      <button id="travelReadUser" style="${sharedButtonStyle}margin-bottom:9px;">Pull Wallet Info</button>

      <label>Cash to spend</label>
      <input id="travelCash" type="number" value="${load("travel:cash")}" placeholder="Pulled from wallet if your key allows it" style="${sharedInputStyle}">

      <label>Flight setup</label>
      <select id="travelFlight" style="${sharedInputStyle}">
        <option value="standard">Standard</option>
        <option value="airstrip">Airstrip / PI</option>
        <option value="business">Business Class</option>
      </select>

      <label>Extra carry capacity</label>
      <input id="travelExtra" type="number" value="${load("travel:extra", "4")}" style="${sharedInputStyle}">

      <button id="travelCalculate" style="${sharedButtonStyle}background:#2f6fed;border:0;">Find Best Route</button>
      <div id="travelOutput" style="font-size:13px;line-height:1.4;margin-top:12px;"></div>
    `;

    $("travelFlight").value = load("travel:flight", "airstrip");
    $("travelReadUser").onclick = handleTravelUserPull;
    $("travelCalculate").onclick = handleTravelCalculation;
  }

  async function handleTravelUserPull() {
    const output = $("travelOutput");
    const key = $("travelApiKey").value.trim();

    if (!key) {
      output.innerHTML = "No key, no magic. This is organized crime, not organized guessing.";
      return;
    }

    save("apiKey", key);
    output.innerHTML = "Checking your wallet. Very respectfully. Mostly.";

    try {
      const report = await getUserReport(key);
      let message = "API key works. Look at us being functional.<br>";

      if (report.basic?.name) message += `Player: <b>${report.basic.name}</b><br>`;

      if (report.money?.money_onhand !== undefined) {
        $("travelCash").value = report.money.money_onhand;
        save("travel:cash", report.money.money_onhand);
        message += `Wallet cash: <b>${money(report.money.money_onhand)}</b><br>`;
      }

      if (report.travel?.destination) {
        message += `Current travel status: ${report.travel.destination}<br>`;
      }

      if (report.moneyError) message += `<br>Wallet access issue: ${report.moneyError}`;
      if (report.travelError) message += `<br>Travel access issue: ${report.travelError}`;

      output.innerHTML = message;
    } catch (error) {
      output.innerHTML = "The API had feelings about that: " + error.message;
    }
  }

  async function handleTravelCalculation() {
    const output = $("travelOutput");
    const key = $("travelApiKey").value.trim();
    const cash = number($("travelCash").value);
    const flightKey = $("travelFlight").value;
    const extra = number($("travelExtra").value);

    if (!key) {
      output.innerHTML = "Add your API key first. I am talented, not psychic.";
      return;
    }

    if (cash <= 0) {
      output.innerHTML = "Add cash to spend. Dreams remain tragically non-liquid.";
      return;
    }

    save("apiKey", key);
    save("travel:cash", cash);
    save("travel:flight", flightKey);
    save("travel:extra", extra);

    const flight = FLIGHTS[flightKey];
    const capacity = flight.capacity + extra;
    output.innerHTML = "Running the numbers because apparently someone had to.";

    try {
      const itemMap = await getItemMap(key);
      const results = [];

      for (const route of ROUTES) {
        for (const itemName of route.items) {
          const item = itemMap[itemName];
          const abroadPrice = ABROAD_PRICES[itemName];
          if (!item || !abroadPrice) continue;

          const marketPrice = await getLowestMarketPrice(item.id, key);
          if (!marketPrice) continue;

          const quantity = Math.min(capacity, Math.floor(cash / abroadPrice));
          if (quantity <= 0) continue;

          const roundTrip = route.minutes * flight.speed * 2;
          const cost = quantity * abroadPrice;
          const revenue = quantity * marketPrice;
          const profit = revenue - cost;
          const profitPerHour = profit / (roundTrip / 60);
          const roi = cost > 0 ? (profit / cost) * 100 : 0;

          results.push({
            country: route.country,
            itemName,
            abroadPrice,
            marketPrice,
            quantity,
            roundTrip,
            profit,
            profitPerHour,
            roi
          });
        }
      }

      results.sort((a, b) => b.profitPerHour - a.profitPerHour);

      if (!results.length) {
        output.innerHTML = "No profitable route found. Rare. Suspicious. Deeply inconvenient.";
        return;
      }

      const best = results[0];

      output.innerHTML = `
        <div style="${cardStyle}">
          <b>Best Route: ${best.country}</b><br>
          Buy: <b>${best.quantity} × ${best.itemName}</b><br>
          Abroad cost: ${money(best.abroadPrice)} each<br>
          Market price: ${money(best.marketPrice)} each<br>
          Profit: <b>${money(best.profit)}</b><br>
          Profit/hr: <b>${money(best.profitPerHour)}</b><br>
          Round trip: ${Math.round(best.roundTrip)} min<br>
          ROI: ${best.roi.toFixed(1)}%
        </div>

        ${results.slice(0, 10).map((result, index) => `
          <div style="border-bottom:1px solid #333;padding:8px 0;">
            <b>${index + 1}. ${result.country}</b> — ${result.itemName}<br>
            Qty ${result.quantity} | Profit ${money(result.profit)} | ${money(result.profitPerHour)}/hr
          </div>
        `).join("")}

        <div style="opacity:.75;margin-top:10px;">
          This recommends. It does not click, buy, sell, travel, or save you from yourself.
        </div>
      `;
    } catch (error) {
      output.innerHTML = "Something broke. Very rude of it: " + error.message;
    }
  }

  // -------------------------
  // CHAIN COMMAND
  // -------------------------

  function openChainCommand() {
    const body = makePanel(
      "belladonnaChainPanel",
      "⛓ Chain Command",
      "Know the chain. Know your place in it. Try not to be the reason everyone starts yelling."
    );

    body.innerHTML = `
      <div id="chainTabs" style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:11px;">
        <button data-chain-tab="overview" style="${sharedButtonStyle}padding:8px 3px;font-size:11px;">Overview</button>
        <button data-chain-tab="planning" style="${sharedButtonStyle}padding:8px 3px;font-size:11px;">Planning</button>
        <button data-chain-tab="readiness" style="${sharedButtonStyle}padding:8px 3px;font-size:11px;">Readiness</button>
        <button data-chain-tab="orders" style="${sharedButtonStyle}padding:8px 3px;font-size:11px;">Orders</button>
      </div>
      <div id="chainContent"></div>
    `;

    body.querySelectorAll("[data-chain-tab]").forEach(button => {
      button.onclick = () => showChainTab(button.dataset.chainTab);
    });

    showChainTab("overview");
  }

  function showChainTab(tabName) {
    const content = $("chainContent");
    if (!content) return;

    document.querySelectorAll("[data-chain-tab]").forEach(button => {
      button.style.background = button.dataset.chainTab === tabName ? accentColour() : "#242424";
    });

    if (tabName === "overview") renderChainOverview();
    if (tabName === "planning") renderChainPlanning();
    if (tabName === "readiness") renderChainReadiness();
    if (tabName === "orders") renderChainOrders();
  }

  function renderChainOverview() {
    const content = $("chainContent");

    content.innerHTML = `
      <label>API Key</label>
      <input id="chainApiKey" value="${load("apiKey")}" placeholder="Your Torn API key" style="${sharedInputStyle}">

      <button id="chainPullLive" style="${sharedButtonStyle}background:#5b244b;border:0;margin-bottom:10px;">
        Pull Live Chain Status
      </button>

      <div style="${cardStyle}">
        <b>Manual fallback</b><br>
        <span style="opacity:.78;font-size:12px;">
          If faction API access refuses to cooperate, enter the numbers yourself. We adapt. We complain, but we adapt.
        </span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div>
          <label>Current chain</label>
          <input id="chainCurrent" type="number" value="${load("chain:current", "0")}" style="${sharedInputStyle}">
        </div>
        <div>
          <label>Chain goal</label>
          <input id="chainGoal" type="number" value="${load("chain:goal", chainCommandSettings.defaultGoal)}" style="${sharedInputStyle}">
        </div>
        <div>
          <label>Timer seconds</label>
          <input id="chainTimer" type="number" value="${load("chain:timer", "300")}" style="${sharedInputStyle}">
        </div>
        <div>
          <label>Your energy</label>
          <input id="chainEnergy" type="number" value="${load("chain:energy", "0")}" style="${sharedInputStyle}">
        </div>
      </div>

      <button id="chainAnalyze" style="${sharedButtonStyle}">Analyze What We Have</button>
      <div id="chainOverviewOutput" style="font-size:13px;line-height:1.45;margin-top:12px;"></div>
    `;

    $("chainPullLive").onclick = pullLiveChainStatus;
    $("chainAnalyze").onclick = analyzeManualChain;
  }

  async function pullLiveChainStatus() {
    const output = $("chainOverviewOutput");
    const key = $("chainApiKey").value.trim();

    if (!key) {
      output.innerHTML = "Add your API key first. Chain Command has many talents. Telepathy remains unfunded.";
      return;
    }

    save("apiKey", key);
    output.innerHTML = "Pulling the chain status. Nobody touch anything important.";

    const liveReport = {
      chain: null,
      bars: null,
      chainError: "",
      barsError: ""
    };

    try {
      const factionData = await torn("faction", "", "chain", key);
      liveReport.chain = factionData.chain || factionData;
    } catch (error) {
      liveReport.chainError = error.message;
    }

    try {
      const userData = await torn("user", "", "bars", key);
      liveReport.bars = userData;
    } catch (error) {
      liveReport.barsError = error.message;
    }

    if (liveReport.chain) {
      const chain = liveReport.chain;
      const currentChain = number(chain.current);
      const timerSeconds = number(chain.timeout);
      const chainMax = number(chain.max);

      $("chainCurrent").value = currentChain;
      $("chainTimer").value = timerSeconds;

      save("chain:current", currentChain);
      save("chain:timer", timerSeconds);

      if (chainMax > number($("chainGoal").value)) {
        $("chainGoal").value = chainMax;
        save("chain:goal", chainMax);
      }
    }

    const energy = liveReport.bars?.energy?.current;
    if (energy !== undefined) {
      $("chainEnergy").value = energy;
      save("chain:energy", energy);
    }

    if (!liveReport.chain && !liveReport.bars) {
      output.innerHTML = `
        <div style="${cardStyle}">
          <b>The API gave us nothing useful.</b><br><br>
          Chain: ${liveReport.chainError || "Unavailable"}<br>
          Energy: ${liveReport.barsError || "Unavailable"}<br><br>
          Use the manual fields below. Not elegant, but neither is getting mugged in Switzerland.
        </div>
      `;
      return;
    }

    analyzeManualChain();

    const notes = [];
    if (liveReport.chainError) notes.push(`Chain access: ${liveReport.chainError}`);
    if (liveReport.barsError) notes.push(`Energy access: ${liveReport.barsError}`);

    if (notes.length) {
      output.innerHTML += `<div style="opacity:.72;margin-top:8px;">Partial API access: ${notes.join(" | ")}</div>`;
    }
  }

  function analyzeManualChain() {
    const currentChain = number($("chainCurrent").value);
    const chainGoal = Math.max(1, number($("chainGoal").value));
    const timerSeconds = number($("chainTimer").value);
    const yourEnergy = number($("chainEnergy").value);

    save("chain:current", currentChain);
    save("chain:goal", chainGoal);
    save("chain:timer", timerSeconds);
    save("chain:energy", yourEnergy);

    const hitsStillNeeded = Math.max(0, chainGoal - currentChain);
    const expectedHits = Math.floor(yourEnergy / chainCommandSettings.energyPerAttack);
    const chainHealth = getChainHealth(timerSeconds, currentChain);
    const advice = getChainAdvice({
      currentChain,
      chainGoal,
      timerSeconds,
      yourEnergy,
      expectedHits,
      hitsStillNeeded
    });

    const progressPercent = Math.min(100, (currentChain / chainGoal) * 100);
    const output = $("chainOverviewOutput");

    output.innerHTML = `
      <div style="${cardStyle}">
        <div style="display:flex;justify-content:space-between;gap:10px;">
          <div><b>Chain</b><br>${currentChain.toLocaleString()} / ${chainGoal.toLocaleString()}</div>
          <div><b>Timer</b><br>${formatChainTime(timerSeconds)}</div>
          <div><b>Status</b><br>${chainHealth.label}</div>
        </div>

        <div style="height:10px;background:#333;border-radius:999px;overflow:hidden;margin:12px 0 6px;">
          <div style="height:100%;width:${progressPercent}%;background:${chainHealth.bar};"></div>
        </div>
        <div style="opacity:.75;font-size:11px;">${progressPercent.toFixed(1)}% of the selected goal</div>
      </div>

      <div style="${cardStyle}">
        <b>Your position</b><br>
        Energy: ${yourEnergy}<br>
        Estimated attacks: <b>${expectedHits}</b><br>
        Hits still needed: <b>${hitsStillNeeded}</b>
      </div>

      <div style="${cardStyle}">
        <b>Belladonna recommendation</b><br><br>
        ${advice}
      </div>
    `;
  }

  function getChainHealth(timerSeconds, currentChain) {
    if (currentChain <= 0) {
      return { label: "Quiet", bar: "#666", tone: "No active chain detected." };
    }

    if (timerSeconds <= chainCommandSettings.dangerTimeSeconds) {
      return { label: "DANGER", bar: "#b3261e", tone: "The timer is getting ugly." };
    }

    if (timerSeconds <= chainCommandSettings.warningTimeSeconds) {
      return { label: "Warning", bar: "#b86b16", tone: "Someone should hit something soon." };
    }

    return { label: "Healthy", bar: "#3f8f62", tone: "The chain is breathing normally." };
  }

  function getChainAdvice(chainState) {
    const {
      currentChain,
      chainGoal,
      timerSeconds,
      yourEnergy,
      expectedHits,
      hitsStillNeeded
    } = chainState;

    if (currentChain <= 0) {
      if (yourEnergy >= 100) {
        return "No active chain is showing. Your energy is getting high, though, so decide whether you're training or waiting for orders before natural regeneration starts going to waste.";
      }

      return "No active chain is showing. Nothing is on fire. Enjoy this deeply suspicious moment of peace.";
    }

    if (hitsStillNeeded <= 0) {
      return "The selected goal is complete. Nicely done. Check faction orders before spending anything else; leadership may be extending the chain.";
    }

    if (timerSeconds <= 60) {
      return "<b>This is no longer a planning exercise. Hit something.</b>";
    }

    if (timerSeconds <= chainCommandSettings.dangerTimeSeconds) {
      if (expectedHits > 0) {
        return "The timer is under two minutes and you have energy. Make a safe hit now. Heroics are how people end up staring at a failed attack screen while everyone else screams.";
      }

      return "The timer is under two minutes and you do not have enough natural energy for a hit. Call it out immediately so someone who can act actually does.";
    }

    if (timerSeconds <= chainCommandSettings.warningTimeSeconds) {
      if (expectedHits > 0) {
        return "The timer is slipping. Make one clean hit, then reassess. We need movement, not interpretive violence.";
      }

      return "The timer is below three minutes. You cannot cover it right now, so warn the faction instead of silently watching the clock die.";
    }

    if (expectedHits >= 5 && hitsStillNeeded > 20) {
      return `You have roughly ${expectedHits} attacks available. The chain is healthy, so do not dump everything without a reason. Make a hit, keep some energy in reserve, and follow the current orders.`;
    }

    if (expectedHits > 0) {
      return "The chain is healthy and you can contribute. Make a clean hit when the pace needs it, then keep enough energy available in case the timer suddenly develops a personality.";
    }

    return "The chain is healthy, but you do not currently have enough energy for an attack. Stay aware, check your refill and cooldown options, and do not pretend you did not see the timer.";
  }

  function formatChainTime(totalSeconds) {
    const seconds = Math.max(0, Math.floor(number(totalSeconds)));
    const minutes = Math.floor(seconds / 60);
    const leftoverSeconds = seconds % 60;
    return `${minutes}:${String(leftoverSeconds).padStart(2, "0")}`;
  }

  function renderChainPlanning() {
    const content = $("chainContent");

    content.innerHTML = `
      <div style="${cardStyle}">
        <b>Chain planner</b><br>
        <span style="opacity:.78;font-size:12px;">
          This tells us what the goal requires. It cannot make people stop flying five minutes before a chain.
        </span>
      </div>

      <label>Current chain</label>
      <input id="planCurrent" type="number" value="${load("chain:current", "0")}" style="${sharedInputStyle}">

      <label>Target</label>
      <input id="planGoal" type="number" value="${load("chain:goal", chainCommandSettings.defaultGoal)}" style="${sharedInputStyle}">

      <label>Minutes available</label>
      <input id="planMinutes" type="number" value="${load("chain:planMinutes", "60")}" style="${sharedInputStyle}">

      <label>Members expected to hit</label>
      <input id="planMembers" type="number" value="${load("chain:planMembers", "10")}" style="${sharedInputStyle}">

      <button id="planCalculate" style="${sharedButtonStyle}background:#5b244b;border:0;">Calculate the Pace</button>
      <div id="planOutput" style="font-size:13px;line-height:1.45;margin-top:12px;"></div>
    `;

    $("planCalculate").onclick = calculateChainPlan;
  }

  function calculateChainPlan() {
    const currentChain = number($("planCurrent").value);
    const chainGoal = Math.max(1, number($("planGoal").value));
    const minutesAvailable = Math.max(1, number($("planMinutes").value));
    const membersExpected = Math.max(1, number($("planMembers").value));

    save("chain:current", currentChain);
    save("chain:goal", chainGoal);
    save("chain:planMinutes", minutesAvailable);
    save("chain:planMembers", membersExpected);

    const hitsStillNeeded = Math.max(0, chainGoal - currentChain);
    const factionHitsPerMinute = hitsStillNeeded / minutesAvailable;
    const minutesPerFactionHit = hitsStillNeeded > 0 ? minutesAvailable / hitsStillNeeded : 0;
    const hitsPerMember = hitsStillNeeded / membersExpected;
    const energyPerMember = hitsPerMember * chainCommandSettings.energyPerAttack;

    let verdict = "";

    if (hitsStillNeeded === 0) {
      verdict = "Goal already reached. Either celebrate or discover that leadership has quietly moved the finish line.";
    } else if (factionHitsPerMinute >= 2) {
      verdict = "Aggressive pace. Possible with a coordinated push, but this is not the time for people to vanish into the casino.";
    } else if (factionHitsPerMinute >= 0.75) {
      verdict = "Solid working pace. Very manageable if the expected members actually exist outside the spreadsheet.";
    } else {
      verdict = "Comfortable pace. Keep it moving and avoid the classic mistake of relaxing until the timer starts screaming.";
    }

    $("planOutput").innerHTML = `
      <div style="${cardStyle}">
        <b>Hits needed:</b> ${Math.ceil(hitsStillNeeded)}<br>
        <b>Faction pace:</b> ${factionHitsPerMinute.toFixed(2)} hits/minute<br>
        <b>Average gap:</b> ${minutesPerFactionHit.toFixed(2)} minutes per hit<br>
        <b>Average per member:</b> ${hitsPerMember.toFixed(1)} hits<br>
        <b>Energy per member:</b> about ${Math.ceil(energyPerMember)}
      </div>
      <div style="${cardStyle}"><b>Assessment</b><br><br>${verdict}</div>
    `;
  }

  function renderChainReadiness() {
    const content = $("chainContent");
    const currentReadiness = load("chain:readiness", "ready");
    const availableLater = load("chain:availableLater", "");

    content.innerHTML = `
      <div style="${cardStyle}">
        <b>My readiness</b><br>
        <span style="opacity:.78;font-size:12px;">
          Stored only on this device for now. Later, the bot can collect it without us rebuilding the room.
        </span>
      </div>

      <label>Status</label>
      <select id="readinessStatus" style="${sharedInputStyle}">
        <option value="ready">Ready</option>
        <option value="travelling">Travelling</option>
        <option value="busy">Busy</option>
        <option value="later">Available later</option>
        <option value="unavailable">Unavailable</option>
      </select>

      <label>Available later / note</label>
      <input id="readinessLater" value="${availableLater}" placeholder="Example: Back by 21:00 TT" style="${sharedInputStyle}">

      <button id="saveReadiness" style="${sharedButtonStyle}background:#5b244b;border:0;">Save My Status</button>
      <div id="readinessOutput" style="font-size:13px;line-height:1.45;margin-top:12px;"></div>
    `;

    $("readinessStatus").value = currentReadiness;
    $("saveReadiness").onclick = saveReadinessStatus;
  }

  function saveReadinessStatus() {
    const readinessStatus = $("readinessStatus").value;
    const availableLater = $("readinessLater").value.trim();

    save("chain:readiness", readinessStatus);
    save("chain:availableLater", availableLater);

    const statusLabels = {
      ready: "Ready",
      travelling: "Travelling",
      busy: "Busy",
      later: "Available later",
      unavailable: "Unavailable"
    };

    $("readinessOutput").innerHTML = `
      <div style="${cardStyle}">
        <b>Status saved:</b> ${statusLabels[readinessStatus]}<br>
        ${availableLater ? `<b>Note:</b> ${availableLater}<br>` : ""}
        <br>
        This stays on your device for now. Private, useful, and unable to gossip.
      </div>
    `;
  }

  function renderChainOrders() {
    const content = $("chainContent");
    const savedOrders = load("chain:orders", chainCommandSettings.defaultOrders.join("\n"));

    content.innerHTML = `
      <div style="${cardStyle}">
        <b>Faction orders</b><br>
        <span style="opacity:.78;font-size:12px;">
          Manual for now. Paste the current orders here and every part of Chain Command can reference the same instructions.
        </span>
      </div>

      <textarea id="chainOrdersText" rows="7" style="${sharedInputStyle}resize:vertical;">${savedOrders}</textarea>

      <button id="saveChainOrders" style="${sharedButtonStyle}background:#5b244b;border:0;">Save Orders</button>
      <button id="resetChainOrders" style="${sharedButtonStyle}margin-top:7px;">Reset to Defaults</button>

      <div id="ordersOutput" style="font-size:13px;line-height:1.45;margin-top:12px;"></div>
    `;

    $("saveChainOrders").onclick = saveChainOrders;
    $("resetChainOrders").onclick = resetChainOrders;
    showSavedOrders();
  }

  function saveChainOrders() {
    const orders = $("chainOrdersText").value.trim();

    if (!orders) {
      $("ordersOutput").innerHTML = "No orders entered. Anarchy is technically a management style, but not a good one.";
      return;
    }

    save("chain:orders", orders);
    showSavedOrders("Orders saved. The faction may now ignore them with greater accuracy.");
  }

  function resetChainOrders() {
    const defaults = chainCommandSettings.defaultOrders.join("\n");
    $("chainOrdersText").value = defaults;
    save("chain:orders", defaults);
    showSavedOrders("Defaults restored.");
  }

  function showSavedOrders(message = "") {
    const orders = load("chain:orders", chainCommandSettings.defaultOrders.join("\n"));
    const lines = orders.split("\n").map(line => line.trim()).filter(Boolean);

    $("ordersOutput").innerHTML = `
      ${message ? `<div style="margin-bottom:8px;opacity:.85;">${message}</div>` : ""}
      <div style="${cardStyle}">
        <b>Current orders</b><br><br>
        ${lines.map(line => `• ${line}`).join("<br>")}
      </div>
    `;
  }

  // -------------------------
  // TODAY'S LESSON
  // -------------------------

  const belladonnaLessons = [
    {
      title: "Energy Is a Clock",
      level: "Foundation",
      lesson: "Natural energy only helps while it has somewhere to go. Sitting at the cap means the clock is still ticking, but you are getting nothing from it.",
      move: "Before logging off, decide whether that energy belongs in the gym, a chain, or a planned stack."
    },
    {
      title: "A Safe Hit Beats a Glorious Failure",
      level: "Chains",
      lesson: "When the chain timer is low, your job is not to prove anything. Your job is to land a clean hit and keep the chain alive.",
      move: "Keep a few reliable targets ready before the timer becomes everyone’s emergency."
    },
    {
      title: "Travel Profit Is More Than One Trip",
      level: "Money",
      lesson: "The biggest profit number is not always the best route. Time, capacity, cash tied up, and return timing all matter.",
      move: "Compare profit per hour and make sure the trip does not collide with faction activity."
    },
    {
      title: "Do Not Carry a Mugging Invitation",
      level: "Travel",
      lesson: "Returning with valuable items is already noticeable. Returning with unnecessary cash makes the greeting committee more enthusiastic.",
      move: "Secure spare cash before flying and sell with a plan instead of improvising in public."
    },
    {
      title: "Your Cooldowns Are a Schedule",
      level: "Efficiency",
      lesson: "Drug, booster, and medical cooldowns are not just timers. Together they tell you what kind of session you can actually have.",
      move: "Check cooldowns before committing to a chain, happy jump, flight, or training block."
    },
    {
      title: "A Chain Starts Before the First Hit",
      level: "Chains",
      lesson: "Preparation decides whether a chain feels controlled or becomes thirty people asking the same question in Discord.",
      move: "Be in Torn, know the goal, have targets ready, and understand whether you are holding or spending energy."
    },
    {
      title: "Cash Has a Job",
      level: "Money",
      lesson: "Money without a purpose quietly becomes casino money, impulse money, or mugging money. None of those are investment strategies.",
      move: "Give every large amount a job: travel stock, bank investment, gear, education, or a defined savings target."
    },
    {
      title: "Know What You Can Actually Finish",
      level: "Planning",
      lesson: "A plan built around perfect timing, perfect attendance, and nobody making a mistake is not a plan. It is fan fiction.",
      move: "Leave room for missed hits, API delays, travel mistakes, and real life."
    },
    {
      title: "Easy Targets Are Infrastructure",
      level: "Chains",
      lesson: "Reliable targets keep chains alive and allow newer members to contribute. Burning every easy target early removes your safety net.",
      move: "Use targets according to the pace and orders, not simply because they are there."
    },
    {
      title: "Read the Room Before You Fly",
      level: "Faction",
      lesson: "A profitable flight can still be a bad decision when a chain, war push, revive call, or faction event is close.",
      move: "Check the faction schedule and your return time before leaving Torn."
    },
    {
      title: "Public Data Is Not Certainty",
      level: "Recon",
      lesson: "Status, level, faction, and last action can support a decision, but they do not reveal hidden battle stats or guarantee someone is safe.",
      move: "Separate confirmed facts from estimates and never let confidence outrun evidence."
    },
    {
      title: "Notes Beat Memory",
      level: "Recon",
      lesson: "Useful intelligence disappears when it only lives in chat history or someone’s head.",
      move: "Record why a target, trader, or contact matters—and date the note when the information may expire."
    },
    {
      title: "Do Not Spend the Emergency Hit",
      level: "Chains",
      lesson: "Using every available attack while the timer is healthy may leave nobody ready when the timer suddenly drops.",
      move: "Unless orders say otherwise, preserve enough energy for one clean emergency hit."
    },
    {
      title: "The Goal Needs a Pace",
      level: "Planning",
      lesson: "A target number means very little until you know the time available and the hits required per member.",
      move: "Turn the goal into hits per minute and average contribution before declaring it easy."
    },
    {
      title: "A Tool Should Explain Itself",
      level: "Belladonna",
      lesson: "A recommendation is only useful when you can see what caused it. Blind trust is not intelligence; it is delegation with better branding.",
      move: "Check the facts and reasons behind every Oracle recommendation."
    }
  ];

  function getLessonIndexForToday(extra = 0) {
    const today = new Date();
    const dateSeed = Number(
      `${today.getUTCFullYear()}${String(today.getUTCMonth() + 1).padStart(2, "0")}${String(today.getUTCDate()).padStart(2, "0")}`
    );
    return (dateSeed + extra) % belladonnaLessons.length;
  }

  function openTodaysLesson() {
    const body = makePanel(
      "belladonnaLessonPanel",
      "📖 Today's Lesson",
      "One useful thing. No lecture hall. No exam. No excuse."
    );

    body.innerHTML = `
      <div id="lessonContent"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
        <button id="lessonComplete" style="${sharedButtonStyle}background:#5b244b;border:0;">Mark Complete</button>
        <button id="lessonAnother" style="${sharedButtonStyle}">Show Another</button>
      </div>
      <div id="lessonMessage" style="margin-top:10px;font-size:12px;opacity:.82;"></div>
    `;

    const savedExtra = number(load("lesson:extra", "0"));
    renderLesson(getLessonIndexForToday(savedExtra));

    $("lessonComplete").onclick = markLessonComplete;
    $("lessonAnother").onclick = showAnotherLesson;
  }

  function renderLesson(index) {
    const lesson = belladonnaLessons[index];
    const completed = JSON.parse(load("lesson:completed", "[]"));
    const isComplete = completed.includes(lesson.title);

    $("lessonContent").innerHTML = `
      <div style="${cardStyle}">
        <div style="font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.08em;">${lesson.level}</div>
        <h3 style="margin:5px 0 10px;">${lesson.title}</h3>
        <div style="line-height:1.5;">${lesson.lesson}</div>
      </div>

      <div style="${cardStyle}">
        <b>Your move</b><br><br>
        ${lesson.move}
      </div>

      ${isComplete ? `<div style="${cardStyle}"><b>✓ Already completed</b><br>Apparently you do listen. Disturbing, but appreciated.</div>` : ""}
    `;

    save("lesson:currentTitle", lesson.title);
  }

  function markLessonComplete() {
    const title = load("lesson:currentTitle");
    const completed = JSON.parse(load("lesson:completed", "[]"));

    if (title && !completed.includes(title)) completed.push(title);
    save("lesson:completed", JSON.stringify(completed));

    $("lessonMessage").innerHTML = `✓ Lesson recorded. Knowledge has occurred. Nobody make it weird.`;
    renderLesson(belladonnaLessons.findIndex(lesson => lesson.title === title));
  }

  function showAnotherLesson() {
    const nextExtra = number(load("lesson:extra", "0")) + 1;
    save("lesson:extra", nextExtra);
    renderLesson(getLessonIndexForToday(nextExtra));
    $("lessonMessage").innerHTML = "";
  }

  // -------------------------
  // FACTION COVERAGE
  // -------------------------

  const coverageStarterData = factionMembersToCoverageText();

  function openFactionCoverage() {
    const body = makePanel(
      "belladonnaCoveragePanel",
      "🌐 Faction Coverage",
      "See when Belladonna is awake, when it is thin, and when everyone has apparently agreed to vanish."
    );

    const savedData = load("coverage:data", coverageStarterData);

    body.innerHTML = `
      <div style="${cardStyle}">
        <b>Manual faction roster</b><br>
        <span style="opacity:.78;font-size:12px;">
          One member per line: Name | UTC offset | local active hours | roles. This stays on this device.
        </span>
      </div>

      <textarea id="coverageData" rows="9" style="${sharedInputStyle}resize:vertical;">${savedData}</textarea>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
        <button id="coverageBuild" style="${sharedButtonStyle}background:#5b244b;border:0;">Build Coverage Map</button>
        <button id="coverageSave" style="${sharedButtonStyle}">Save Roster</button>
      </div>

      <div id="coverageOutput" style="font-size:13px;line-height:1.45;margin-top:12px;"></div>
    `;

    $("coverageBuild").onclick = buildCoverageMap;
    $("coverageSave").onclick = () => {
      save("coverage:data", $("coverageData").value);
      $("coverageOutput").innerHTML = `<div style="${cardStyle}">Roster saved locally. The spreadsheet has been contained.</div>`;
    };
  }

  function parseCoverageRoster(rawData) {
    const members = [];
    const errors = [];

    rawData.split("\n").forEach((rawLine, lineIndex) => {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) return;

      const parts = line.split("|").map(part => part.trim());
      if (parts.length < 3) {
        errors.push(`Line ${lineIndex + 1}: missing fields`);
        return;
      }

      const name = parts[0];
      const utcOffset = Number(parts[1]);
      const ranges = parts[2].split(",").map(range => range.trim()).filter(Boolean);
      const roles = (parts[3] || "").split(",").map(role => role.trim()).filter(Boolean);

      if (!name || Number.isNaN(utcOffset) || !ranges.length) {
        errors.push(`Line ${lineIndex + 1}: invalid name, offset, or hours`);
        return;
      }

      const activeRanges = [];

      ranges.forEach(range => {
        const match = range.match(/^(\d{1,2})(?::(\d{2}))?-(\d{1,2})(?::(\d{2}))?$/);
        if (!match) {
          errors.push(`Line ${lineIndex + 1}: could not read "${range}"`);
          return;
        }

        const start = Number(match[1]) + Number(match[2] || 0) / 60;
        const end = Number(match[3]) + Number(match[4] || 0) / 60;

        if (start >= 24 || end > 24) {
          errors.push(`Line ${lineIndex + 1}: hours must use 00:00-24:00`);
          return;
        }

        activeRanges.push({ start, end });
      });

      if (activeRanges.length) members.push({ name, utcOffset, activeRanges, roles });
    });

    return { members, errors };
  }

  function isMemberActiveAtTornHour(member, tornHour) {
    const localHour = ((tornHour + member.utcOffset) % 24 + 24) % 24;

    return member.activeRanges.some(range => {
      if (range.start === range.end) return true;
      if (range.end > range.start) return localHour >= range.start && localHour < range.end;
      return localHour >= range.start || localHour < range.end;
    });
  }

  function buildCoverageMap() {
    const rawData = $("coverageData").value;
    const { members, errors } = parseCoverageRoster(rawData);
    const output = $("coverageOutput");

    save("coverage:data", rawData);

    if (!members.length) {
      output.innerHTML = `
        <div style="${cardStyle}">
          <b>No usable members yet.</b><br><br>
          Add lines using this format:<br>
          Eshara | -4 | 18:00-23:30 | Chain Support, Leadership
        </div>
        ${errors.length ? `<div style="${cardStyle}">${errors.join("<br>")}</div>` : ""}
      `;
      return;
    }

    const coverage = Array.from({ length: 24 }, (_, hour) => {
      const activeMembers = members.filter(member => isMemberActiveAtTornHour(member, hour));
      return { hour, activeMembers };
    });

    const currentTornHour = new Date().getUTCHours();
    const maximumCoverage = Math.max(...coverage.map(slot => slot.activeMembers.length), 1);
    const weakHours = coverage.filter(slot => slot.activeMembers.length <= Math.max(1, Math.floor(members.length * 0.2)));

    output.innerHTML = `
      <div style="${cardStyle}">
        <b>Coverage summary</b><br>
        Members mapped: ${members.length}<br>
        Current Torn hour: ${String(currentTornHour).padStart(2, "0")}:00<br>
        Weakest coverage: ${Math.min(...coverage.map(slot => slot.activeMembers.length))} member(s)<br>
        Strongest coverage: ${maximumCoverage} member(s)
      </div>

      <div style="${cardStyle}">
        ${coverage.map(slot => {
          const width = Math.max(3, (slot.activeMembers.length / maximumCoverage) * 100);
          const isCurrent = slot.hour === currentTornHour;
          const names = slot.activeMembers.map(member => member.name).join(", ") || "Nobody expected";
          return `
            <div style="margin-bottom:8px;${isCurrent ? "padding:6px;border:1px solid #7c3f69;border-radius:8px;" : ""}">
              <div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;">
                <b>${String(slot.hour).padStart(2, "0")}:00 TT${isCurrent ? " ← now" : ""}</b>
                <span>${slot.activeMembers.length}</span>
              </div>
              <div style="height:8px;background:#333;border-radius:999px;overflow:hidden;margin:4px 0;">
                <div style="height:100%;width:${width}%;background:${slot.activeMembers.length <= 1 ? "#9d3d3d" : slot.activeMembers.length < maximumCoverage / 2 ? "#a46a2a" : "#477c62"};"></div>
              </div>
              <div style="opacity:.7;font-size:10px;">${names}</div>
            </div>
          `;
        }).join("")}
      </div>

      <div style="${cardStyle}">
        <b>Thin windows</b><br><br>
        ${weakHours.map(slot => `${String(slot.hour).padStart(2, "0")}:00 TT — ${slot.activeMembers.length} expected`).join("<br>")}
      </div>

      ${errors.length ? `<div style="${cardStyle}"><b>Lines I could not read</b><br><br>${errors.join("<br>")}</div>` : ""}
    `;
  }

  // -------------------------
  // RECON SCANNER
  // -------------------------

  function findPlayerIdOnPage() {
    const url = new URL(window.location.href);
    const queryId = url.searchParams.get("XID") || url.searchParams.get("user2ID") || url.searchParams.get("ID");

    if (queryId && /^\d+$/.test(queryId)) return queryId;

    const pathMatch = window.location.pathname.match(/profiles\/(\d+)/i);
    return pathMatch ? pathMatch[1] : "";
  }

  function openReconScanner() {
    const body = makePanel(
      "belladonnaReconPanel",
      "🔍 Recon Scanner",
      "Facts first. Estimates second. Wild confidence never."
    );

    const detectedPlayerId = findPlayerIdOnPage();

    body.innerHTML = `
      <label>API Key</label>
      <input id="reconApiKey" value="${load("apiKey")}" placeholder="Your Torn API key" style="${sharedInputStyle}">

      <label>Player ID</label>
      <input id="reconPlayerId" value="${detectedPlayerId}" placeholder="Open a profile or enter an ID" inputmode="numeric" style="${sharedInputStyle}">

      <button id="reconScan" style="${sharedButtonStyle}background:#5b244b;border:0;">Scan Public Profile</button>

      <div id="reconOutput" style="font-size:13px;line-height:1.45;margin-top:12px;"></div>
    `;

    $("reconScan").onclick = runReconScan;
  }

  async function runReconScan() {
    const key = $("reconApiKey").value.trim();
    const playerId = $("reconPlayerId").value.trim();
    const output = $("reconOutput");

    if (!key) {
      output.innerHTML = "Add your API key. Recon without information is just staring.";
      return;
    }

    if (!/^\d+$/.test(playerId)) {
      output.innerHTML = "Enter a valid Torn player ID. Numbers only; dramatic aliases can wait.";
      return;
    }

    save("apiKey", key);
    output.innerHTML = "Reading what Torn is willing to tell us. Nothing hidden, nothing invented.";

    try {
      const data = await torn("user", playerId, "basic,profile", key);
      renderReconReport(playerId, data);
    } catch (firstError) {
      try {
        const data = await torn("user", playerId, "profile", key);
        renderReconReport(playerId, data);
      } catch (secondError) {
        output.innerHTML = `
          <div style="${cardStyle}">
            <b>Recon failed.</b><br><br>
            ${secondError.message || firstError.message}<br><br>
            The ID may be wrong, the key may lack public access, or Torn may simply be having a moment.
          </div>
        `;
      }
    }
  }

  function renderReconReport(playerId, data) {
    const output = $("reconOutput");
    const notesKey = `recon:notes:${playerId}`;
    const savedNotes = load(notesKey, "");

    const playerName = data.name || data.player_name || `Player ${playerId}`;
    const level = data.level ?? "Unknown";
    const factionName = data.faction?.faction_name || data.faction?.name || data.faction_name || "No faction shown";
    const statusDescription = data.status?.description || data.status?.state || data.status || "Unknown";
    const lastAction = data.last_action?.relative || data.last_action?.status || data.last_action || "Not provided";
    const age = data.age ?? "Unknown";
    const rank = data.rank || "Unknown";

    const observations = [];

    if (/okay/i.test(String(statusDescription))) observations.push("Currently appears attackable.");
    if (/hospital/i.test(String(statusDescription))) observations.push("Currently in hospital.");
    if (/travel|abroad|flying/i.test(String(statusDescription))) observations.push("Currently away from Torn or travelling.");
    if (/online/i.test(String(lastAction))) observations.push("Recent activity is showing.");
    if (!observations.length) observations.push("No strong tactical conclusion from the public data alone.");

    output.innerHTML = `
      <div style="${cardStyle}">
        <div style="font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.08em;">Confirmed public information</div>
        <h3 style="margin:5px 0;">${playerName} [${playerId}]</h3>
        Level: ${level}<br>
        Rank: ${rank}<br>
        Age: ${age} days<br>
        Faction: ${factionName}<br>
        Status: ${typeof statusDescription === "object" ? JSON.stringify(statusDescription) : statusDescription}<br>
        Last action: ${typeof lastAction === "object" ? JSON.stringify(lastAction) : lastAction}
      </div>

      <div style="${cardStyle}">
        <b>Observations</b><br><br>
        ${observations.map(note => `• ${note}`).join("<br>")}
        <br><br>
        <span style="opacity:.72;font-size:11px;">
          These are observations, not hidden-stat claims. Belladonna does not put a tactical hat on a guess and call it intelligence.
        </span>
      </div>

      <label>Private notes for this player</label>
      <textarea id="reconNotes" rows="5" style="${sharedInputStyle}resize:vertical;" placeholder="Trusted trader, war target notes, known habits, date-sensitive observations...">${savedNotes}</textarea>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
        <button id="reconSaveNotes" style="${sharedButtonStyle}background:#5b244b;border:0;">Save Notes</button>
        <button id="reconCopyReport" style="${sharedButtonStyle}">Copy Report</button>
      </div>

      <div id="reconMessage" style="font-size:12px;opacity:.8;margin-top:10px;"></div>
    `;

    $("reconSaveNotes").onclick = () => {
      save(notesKey, $("reconNotes").value.trim());
      $("reconMessage").textContent = "Notes saved locally. Quietly. As notes should be.";
    };

    $("reconCopyReport").onclick = async () => {
      const report = [
        `Belladonna Recon — ${playerName} [${playerId}]`,
        `Level: ${level}`,
        `Rank: ${rank}`,
        `Faction: ${factionName}`,
        `Status: ${typeof statusDescription === "object" ? JSON.stringify(statusDescription) : statusDescription}`,
        `Last action: ${typeof lastAction === "object" ? JSON.stringify(lastAction) : lastAction}`,
        "",
        "Observations:",
        ...observations.map(note => `- ${note}`),
        "",
        `Notes: ${$("reconNotes").value.trim() || "None"}`
      ].join("\n");

      try {
        await navigator.clipboard.writeText(report);
        $("reconMessage").textContent = "Report copied. Try to look appropriately mysterious.";
      } catch (error) {
        $("reconMessage").textContent = "Clipboard access failed. Torn PDA may be protecting the world from our formatting.";
      }
    };
  }

  // -------------------------
  // BELLADONNA ORACLE
  // -------------------------

  function openBelladonnaOracle() {
    const body = makePanel(
      "belladonnaOraclePanel",
      "🔮 Belladonna Oracle",
      "It does not predict the future. It notices the present before you waste it."
    );

    body.innerHTML = `
      <label>API Key</label>
      <input id="oracleApiKey" value="${load("apiKey")}" placeholder="Your Torn API key" style="${sharedInputStyle}">

      <label>What are you trying to decide?</label>
      <select id="oracleQuestion" style="${sharedInputStyle}">
        <option value="next">What should I do next?</option>
        <option value="travel">Should I travel?</option>
        <option value="chain">Am I ready for the chain?</option>
        <option value="efficiency">What am I wasting?</option>
      </select>

      <button id="oracleConsult" style="${sharedButtonStyle}background:#5b244b;border:0;">Consult the Oracle</button>

      <div id="oracleOutput" style="font-size:13px;line-height:1.45;margin-top:12px;"></div>
    `;

    $("oracleQuestion").value = load("oracle:question", "next");
    $("oracleConsult").onclick = consultOracle;
  }

  async function consultOracle() {
    const key = $("oracleApiKey").value.trim();
    const question = $("oracleQuestion").value;
    const output = $("oracleOutput");

    if (!key) {
      output.innerHTML = "The Oracle requires an API key. Incense was considered, but the documentation was poor.";
      return;
    }

    save("apiKey", key);
    save("oracle:question", question);
    output.innerHTML = "Gathering the facts. The veil is mostly just several API calls.";

    const state = {
      energy: null,
      maxEnergy: null,
      nerve: null,
      maxNerve: null,
      happy: null,
      maxHappy: null,
      life: null,
      maxLife: null,
      drugCooldown: null,
      boosterCooldown: null,
      medicalCooldown: null,
      travelDestination: "",
      travelTimestamp: null,
      chainCurrent: number(load("chain:current", "0")),
      chainGoal: number(load("chain:goal", chainCommandSettings.defaultGoal)),
      chainTimer: number(load("chain:timer", "0")),
      readiness: load("chain:readiness", "ready"),
      errors: []
    };

    try {
      const bars = await torn("user", "", "bars", key);
      state.energy = bars.energy?.current ?? null;
      state.maxEnergy = bars.energy?.maximum ?? null;
      state.nerve = bars.nerve?.current ?? null;
      state.maxNerve = bars.nerve?.maximum ?? null;
      state.happy = bars.happy?.current ?? null;
      state.maxHappy = bars.happy?.maximum ?? null;
      state.life = bars.life?.current ?? null;
      state.maxLife = bars.life?.maximum ?? null;
    } catch (error) {
      state.errors.push(`Bars: ${error.message}`);
    }

    try {
      const cooldowns = await torn("user", "", "cooldowns", key);
      state.drugCooldown = cooldowns.cooldowns?.drug ?? cooldowns.drug ?? null;
      state.boosterCooldown = cooldowns.cooldowns?.booster ?? cooldowns.booster ?? null;
      state.medicalCooldown = cooldowns.cooldowns?.medical ?? cooldowns.medical ?? null;
    } catch (error) {
      state.errors.push(`Cooldowns: ${error.message}`);
    }

    try {
      const travel = await torn("user", "", "travel", key);
      state.travelDestination = travel.travel?.destination || travel.destination || "";
      state.travelTimestamp = travel.travel?.timestamp || travel.timestamp || null;
    } catch (error) {
      state.errors.push(`Travel: ${error.message}`);
    }

    try {
      const faction = await torn("faction", "", "chain", key);
      const chain = faction.chain || faction;
      if (chain && chain.current !== undefined) {
        state.chainCurrent = number(chain.current);
        state.chainTimer = number(chain.timeout);
        state.chainGoal = Math.max(state.chainGoal, number(chain.max));
        save("chain:current", state.chainCurrent);
        save("chain:timer", state.chainTimer);
      }
    } catch (error) {
      state.errors.push(`Chain: ${error.message}`);
    }

    renderOracleReading(question, state);
  }

  function renderOracleReading(question, state) {
    const output = $("oracleOutput");
    const facts = [];
    const warnings = [];
    const opportunities = [];

    if (state.energy !== null) {
      facts.push(`Energy: ${state.energy}/${state.maxEnergy ?? "?"}`);
      if (state.maxEnergy && state.energy >= state.maxEnergy * 0.9) {
        warnings.push("Your energy is near the cap. Natural regeneration is about to become decorative.");
      } else if (state.energy >= chainCommandSettings.energyPerAttack) {
        opportunities.push(`You have roughly ${Math.floor(state.energy / chainCommandSettings.energyPerAttack)} attacks available.`);
      }
    }

    if (state.nerve !== null) {
      facts.push(`Nerve: ${state.nerve}/${state.maxNerve ?? "?"}`);
      if (state.maxNerve && state.nerve >= state.maxNerve * 0.9) {
        warnings.push("Your nerve is near the cap. Crime does not commit itself, tragically.");
      }
    }

    if (state.happy !== null) facts.push(`Happy: ${state.happy}/${state.maxHappy ?? "?"}`);
    if (state.life !== null) facts.push(`Life: ${state.life}/${state.maxLife ?? "?"}`);

    if (state.drugCooldown !== null) facts.push(`Drug cooldown: ${formatDuration(state.drugCooldown)}`);
    if (state.boosterCooldown !== null) facts.push(`Booster cooldown: ${formatDuration(state.boosterCooldown)}`);
    if (state.medicalCooldown !== null) facts.push(`Medical cooldown: ${formatDuration(state.medicalCooldown)}`);

    const travelling = Boolean(state.travelDestination && !/torn/i.test(state.travelDestination));
    if (state.travelDestination) facts.push(`Travel: ${state.travelDestination}`);

    if (state.chainCurrent > 0) {
      facts.push(`Chain: ${state.chainCurrent}/${state.chainGoal} — ${formatChainTime(state.chainTimer)}`);

      if (state.chainTimer <= 60) {
        warnings.unshift("The chain timer is under one minute.");
      } else if (state.chainTimer <= chainCommandSettings.dangerTimeSeconds) {
        warnings.unshift("The chain timer is in danger.");
      } else if (state.chainTimer <= chainCommandSettings.warningTimeSeconds) {
        warnings.push("The chain timer is below three minutes.");
      }
    }

    let verdict = "";

    if (question === "travel") {
      if (travelling) {
        verdict = `You are already travelling toward ${state.travelDestination}. The decision has escaped containment. Check your return time against the chain and current orders.`;
      } else if (state.chainCurrent > 0 && state.chainTimer <= 300) {
        verdict = "Do not travel. An active chain with a short timer outranks flowers, plushies, and whatever Switzerland is whispering to you.";
      } else if (state.readiness === "ready" && state.chainCurrent > 0) {
        verdict = "Stay in Torn unless faction orders clearly release you. You marked yourself ready, and the chain is active.";
      } else if (state.energy !== null && state.maxEnergy && state.energy >= state.maxEnergy * 0.9) {
        verdict = "Use the energy first, then reconsider travel. Flying at the cap turns regeneration into wasted time.";
      } else {
        verdict = "Travel looks reasonable from the information available. Check the route in Voyage Profit Nerd and compare the return time with faction plans before leaving.";
      }
    } else if (question === "chain") {
      if (travelling) {
        verdict = "You are not chain-ready while abroad. Return timing is now the main problem.";
      } else if (state.chainCurrent <= 0) {
        verdict = "No active chain is showing. Prepare targets and energy, but do not start spending resources based on imaginary urgency.";
      } else if (state.chainTimer <= 60 && state.energy !== null && state.energy >= 25) {
        verdict = "You are ready and the chain is not. Make a safe hit now.";
      } else if (state.chainTimer <= 120 && (state.energy === null || state.energy < 25)) {
        verdict = "The timer is dangerous and you cannot cover a hit with natural energy. Call it out immediately.";
      } else if (state.energy !== null && state.energy >= 25) {
        verdict = `You are in Torn with roughly ${Math.floor(state.energy / 25)} attack(s) available. Keep a safe target ready and follow the current orders.`;
      } else {
        verdict = "You are in Torn, but natural energy is low. Check refills and cooldowns, then stay available rather than silently disappearing.";
      }
    } else if (question === "efficiency") {
      if (warnings.length) {
        verdict = warnings[0] + " Fix that first; the rest can wait.";
      } else if (state.energy !== null && state.energy >= 25) {
        verdict = "Nothing critical is being wasted right now. Your clearest available resource is energy, so give it a deliberate job instead of letting indecision spend it for you.";
      } else {
        verdict = "No major waste is visible from the data available. Check Today’s Lesson or your current goal rather than inventing busywork.";
      }
    } else {
      if (state.chainCurrent > 0 && state.chainTimer <= 60 && state.energy !== null && state.energy >= 25) {
        verdict = "Protect the chain. Make one safe hit now. Everything else has temporarily become background scenery.";
      } else if (state.chainCurrent > 0 && state.chainTimer <= 120) {
        verdict = state.energy !== null && state.energy >= 25
          ? "Make a clean chain hit, then reassess."
          : "Warn the faction that the timer is low. You cannot cover it with natural energy.";
      } else if (travelling) {
        verdict = `You are travelling toward ${state.travelDestination}. Use the downtime to review chain timing, cooldowns, and your next action on landing.`;
      } else if (state.energy !== null && state.maxEnergy && state.energy >= state.maxEnergy * 0.9) {
        verdict = "Use your energy before natural regeneration is wasted. Train unless an active chain or faction order gives it a better job.";
      } else if (state.nerve !== null && state.maxNerve && state.nerve >= state.maxNerve * 0.9) {
        verdict = "Use your nerve. It is near the cap and currently accomplishing nothing except looking full.";
      } else if (state.energy !== null && state.energy >= 25) {
        verdict = "No emergency is showing. Use your available energy deliberately, then check the travel calculator or your current faction orders.";
      } else {
        verdict = "No urgent move is visible. Review Today’s Lesson, update your goals, or step away until a resource or faction need changes.";
      }
    }

    output.innerHTML = `
      <div style="${cardStyle}">
        <div style="font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.08em;">Oracle verdict</div>
        <h3 style="margin:6px 0 10px;">${verdict}</h3>
      </div>

      <div style="${cardStyle}">
        <b>Facts used</b><br><br>
        ${facts.length ? facts.map(fact => `• ${fact}`).join("<br>") : "No live facts were available. The Oracle dislikes this nearly as much as you should."}
      </div>

      ${warnings.length ? `
        <div style="${cardStyle}">
          <b>Warnings</b><br><br>
          ${warnings.map(item => `• ${item}`).join("<br>")}
        </div>
      ` : ""}

      ${opportunities.length ? `
        <div style="${cardStyle}">
          <b>Available options</b><br><br>
          ${opportunities.map(item => `• ${item}`).join("<br>")}
        </div>
      ` : ""}

      ${state.errors.length ? `
        <div style="${cardStyle}">
          <b>Information the API withheld</b><br><br>
          ${state.errors.join("<br>")}
          <br><br>
          <span style="opacity:.72;font-size:11px;">The recommendation used what it could verify and ignored what it could not.</span>
        </div>
      ` : ""}

      <div style="opacity:.72;font-size:11px;margin-top:8px;">
        The Oracle recommends. You decide. Blaming a purple button remains legally and spiritually weak.
      </div>
    `;
  }

  function formatDuration(secondsValue) {
    const totalSeconds = Math.max(0, Math.floor(number(secondsValue)));
    if (totalSeconds < 60) return `${totalSeconds}s`;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  // -------------------------
  // ABOUT
  // -------------------------

  function openAboutPanel() {
    const body = makePanel(
      "belladonnaPlaceholderPanel",
      "⚙ Belladonna Tools",
      "One interface. Several questionable decisions prevented."
    );

    body.innerHTML = `
      <div style="${cardStyle}">
        <b>Belladonna OS Alpha 1.0</b><br><br>

        Alpha 1.0 foundation:<br>
        • Home Dashboard<br>
        • Player Profile & Goals<br>
        • API Health Check<br>
        • Appearance Settings<br>
        • Local Data Backup & Restore<br>
        • TBN Voyage Profit Nerd<br>
        • Chain Command<br>
        • Academy<br>
        • Faction Coverage<br>
        • Recon Scanner<br>
        • Belladonna Oracle<br><br>

        The script uses your own Torn API key and stores it locally on your device.
        It does not upload your key to Belladonna, Discord, GitHub, a mysterious warehouse,
        or anything else with ambitions.<br><br>

        It calculates, organizes, and recommends. It does not click, attack, travel, buy,
        sell, train, or play Torn for you.<br><br>

        More rooms are being built. Please ignore the noise from the basement.<br><br>

        — <b>Eshara</b>
      </div>
    `;
  }

  createLauncher();
})();
