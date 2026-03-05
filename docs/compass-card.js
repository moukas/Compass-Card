const COMPASS_DIRECTIONS = {
  en: [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ],
  cs: [
    "S",
    "SSV",
    "SV",
    "VSV",
    "V",
    "VJV",
    "JV",
    "JJV",
    "J",
    "JJZ",
    "JZ",
    "ZJZ",
    "Z",
    "ZSZ",
    "SZ",
    "SSZ",
  ],
};

const DIRECTION_ALIASES = {
  n: 0,
  north: 0,
  sever: 0,
  nne: 22.5,
  ne: 45,
  northeast: 45,
  north_east: 45,
  severovychod: 45,
  ene: 67.5,
  e: 90,
  east: 90,
  vychod: 90,
  ese: 112.5,
  se: 135,
  southeast: 135,
  south_east: 135,
  jihovychod: 135,
  sse: 157.5,
  s: 180,
  south: 180,
  jih: 180,
  ssw: 202.5,
  sw: 225,
  southwest: 225,
  south_west: 225,
  jihozapad: 225,
  wsw: 247.5,
  w: 270,
  west: 270,
  zapad: 270,
  wnw: 292.5,
  nw: 315,
  northwest: 315,
  north_west: 315,
  severozapad: 315,
  nnw: 337.5,
};

const MOON_PHASE_LABELS = {
  en: {
    new_moon: "New moon",
    waxing_crescent: "Waxing crescent",
    first_quarter: "First quarter",
    waxing_gibbous: "Waxing gibbous",
    full_moon: "Full moon",
    waning_gibbous: "Waning gibbous",
    last_quarter: "Last quarter",
    waning_crescent: "Waning crescent",
  },
  cs: {
    new_moon: "Nov",
    waxing_crescent: "Dorustajici srpek",
    first_quarter: "Prvni ctvrt",
    waxing_gibbous: "Dorustajici mesic",
    full_moon: "Uplnek",
    waning_gibbous: "Couvajici mesic",
    last_quarter: "Posledni ctvrt",
    waning_crescent: "Couvajici srpek",
  },
};

const MOON_PHASE_ALIASES = {
  new_moon: "new_moon",
  newmoon: "new_moon",
  nov: "new_moon",
  waxing_crescent: "waxing_crescent",
  waxingcrescent: "waxing_crescent",
  dorustajici_srpek: "waxing_crescent",
  dorustajici_srp: "waxing_crescent",
  first_quarter: "first_quarter",
  firstquarter: "first_quarter",
  prvni_ctvrt: "first_quarter",
  waxing_gibbous: "waxing_gibbous",
  waxinggibbous: "waxing_gibbous",
  dorustajici_mesic: "waxing_gibbous",
  full_moon: "full_moon",
  fullmoon: "full_moon",
  uplnek: "full_moon",
  waning_gibbous: "waning_gibbous",
  waninggibbous: "waning_gibbous",
  couvajici_mesic: "waning_gibbous",
  last_quarter: "last_quarter",
  lastquarter: "last_quarter",
  posledni_ctvrt: "last_quarter",
  third_quarter: "last_quarter",
  thirdquarter: "last_quarter",
  waning_crescent: "waning_crescent",
  waningcrescent: "waning_crescent",
  couvajici_srpek: "waning_crescent",
};

const RAD = Math.PI / 180;
const DAY_MS = 1000 * 60 * 60 * 24;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = RAD * 23.4397;
const VIRTUAL_COMPASS_ENTITY_ID = "__device_compass__";
const COMPASS_HEADING_ATTRIBUTE_CANDIDATES = [
  "heading",
  "compass_heading",
  "magnetic_heading",
  "bearing",
  "azimuth",
  "direction",
];

function normalizeDirectionValue(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.\s/-]+/g, "_");
}

function parseDirectionDegrees(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return ((value % 360) + 360) % 360;
  }

  const cleaned = String(value).trim();
  if (!cleaned) {
    return null;
  }

  const numeric = Number.parseFloat(cleaned.replace(",", "."));
  if (Number.isFinite(numeric)) {
    return ((numeric % 360) + 360) % 360;
  }

  const alias = DIRECTION_ALIASES[normalizeDirectionValue(cleaned)];
  if (alias !== undefined) {
    return alias;
  }

  return null;
}

function normalizeDirectionLanguage(value) {
  return value === "cs" ? "cs" : "en";
}

function normalizeCompassMode(value) {
  return value === "follow_compass" ? "follow_compass" : "north_locked";
}

function normalizeDegrees(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return ((value % 360) + 360) % 360;
}

function toJulian(date) {
  return date.valueOf() / DAY_MS - 0.5 + J1970;
}

function toDays(date) {
  return toJulian(date) - J2000;
}

function rightAscension(lambda, beta) {
  return Math.atan2(
    Math.sin(lambda) * Math.cos(OBLIQUITY) -
      Math.tan(beta) * Math.sin(OBLIQUITY),
    Math.cos(lambda)
  );
}

function declination(lambda, beta) {
  return Math.asin(
    Math.sin(beta) * Math.cos(OBLIQUITY) +
      Math.cos(beta) * Math.sin(OBLIQUITY) * Math.sin(lambda)
  );
}

function siderealTime(days, lw) {
  return RAD * (280.16 + 360.9856235 * days) - lw;
}

function altitude(hourAngle, latitude, dec) {
  return Math.asin(
    Math.sin(latitude) * Math.sin(dec) +
      Math.cos(latitude) * Math.cos(dec) * Math.cos(hourAngle)
  );
}

function azimuth(hourAngle, latitude, dec) {
  return Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(latitude) -
      Math.tan(dec) * Math.cos(latitude)
  );
}

function getMoonCoordinates(days) {
  const longitude = RAD * (218.316 + 13.176396 * days);
  const meanAnomaly = RAD * (134.963 + 13.064993 * days);
  const meanDistance = RAD * (93.272 + 13.22935 * days);
  const lambda = longitude + RAD * 6.289 * Math.sin(meanAnomaly);
  const beta = RAD * 5.128 * Math.sin(meanDistance);

  return {
    ra: rightAscension(lambda, beta),
    dec: declination(lambda, beta),
  };
}

function getMoonPosition(date, latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const lw = RAD * -longitude;
  const phi = RAD * latitude;
  const days = toDays(date);
  const coords = getMoonCoordinates(days);
  const hourAngle = siderealTime(days, lw) - coords.ra;
  const alt = altitude(hourAngle, phi, coords.dec);
  const az = azimuth(hourAngle, phi, coords.dec);

  return {
    azimuth: ((az / RAD) + 180 + 360) % 360,
    elevation: alt / RAD,
  };
}

function normalizeMoonPhase(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = normalizeDirectionValue(value);
  return MOON_PHASE_ALIASES[normalized] || null;
}

function getDirectionLabel(degrees, fallbackValue, language) {
  if (degrees === null) {
    return fallbackValue ? String(fallbackValue).trim() : "N/A";
  }

  const index = Math.round(degrees / 22.5) % 16;
  const labels = COMPASS_DIRECTIONS[normalizeDirectionLanguage(language)];
  return labels[index];
}

function getMoonPhaseLabel(phase, language) {
  if (!phase) {
    return "";
  }

  const labels = MOON_PHASE_LABELS[normalizeDirectionLanguage(language)];
  return labels[phase] || "";
}

function getObserverCoordinates(hass, config) {
  const observerState = getEntityState(
    hass,
    config.observer_entity || "zone.home"
  );

  const latitude = Number.isFinite(parseNumericValue(config.observer_latitude))
    ? parseNumericValue(config.observer_latitude)
    : parseNumericValue(
        observerState?.attributes?.latitude ?? hass?.config?.latitude
      );
  const longitude = Number.isFinite(parseNumericValue(config.observer_longitude))
    ? parseNumericValue(config.observer_longitude)
    : parseNumericValue(
        observerState?.attributes?.longitude ?? hass?.config?.longitude
      );

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function formatSpeed(state, decimals) {
  if (state === undefined || state === null) {
    return "N/A";
  }

  const text = String(state).trim();
  if (!text) {
    return "N/A";
  }

  const numeric = Number.parseFloat(text.replace(",", "."));
  if (!Number.isFinite(numeric)) {
    return text;
  }

  return numeric.toFixed(decimals);
}

function formatDegrees(degrees, decimals) {
  if (degrees === null) {
    return "N/A";
  }

  return `${degrees.toFixed(decimals)}°`;
}

function getEntityState(hass, entityId) {
  if (!entityId || !hass?.states) {
    return null;
  }

  return hass.states[entityId] ?? null;
}

function parseNumericValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const numeric = Number.parseFloat(String(value).trim().replace(",", "."));
  return Number.isFinite(numeric) ? numeric : null;
}

function getEntityNumericValue(hass, entityId, attribute) {
  const entityState = getEntityState(hass, entityId);
  if (!entityState) {
    return null;
  }

  const sourceValue = attribute
    ? entityState.attributes?.[attribute]
    : entityState.state;

  return parseDirectionDegrees(sourceValue);
}

function getCompassHeadingFromEntityState(entityState, preferredAttribute) {
  if (!entityState) {
    return null;
  }

  if (preferredAttribute) {
    const fromPreferred = parseDirectionDegrees(
      entityState.attributes?.[preferredAttribute]
    );
    if (fromPreferred !== null) {
      return fromPreferred;
    }
  }

  const fromState = parseDirectionDegrees(entityState.state);
  if (fromState !== null) {
    return fromState;
  }

  for (const attributeName of COMPASS_HEADING_ATTRIBUTE_CANDIDATES) {
    const headingValue = parseDirectionDegrees(
      entityState.attributes?.[attributeName]
    );
    if (headingValue !== null) {
      return headingValue;
    }
  }

  return null;
}

function getCompassHeadingFromEntity(hass, entityId, preferredAttribute) {
  const entityState = getEntityState(hass, entityId);
  return getCompassHeadingFromEntityState(entityState, preferredAttribute);
}

function getCompassEntityScore(entityId, stateObj) {
  if (!entityId || !stateObj) {
    return -1;
  }

  const domain = entityId.split(".")[0];
  if (!["sensor", "input_number", "input_text"].includes(domain)) {
    return -1;
  }

  let score = 0;
  if (/compass/i.test(entityId)) {
    score += 10;
  }
  if (/heading/i.test(entityId)) {
    score += 8;
  }
  if (/bearing|azimuth|orientation/i.test(entityId)) {
    score += 6;
  }
  if (/direction/i.test(entityId)) {
    score += 2;
  }
  if (/compass/i.test(stateObj?.attributes?.icon || "")) {
    score += 5;
  }

  const headingFromState = parseDirectionDegrees(stateObj.state);
  if (headingFromState !== null) {
    score += 2;
  }

  for (const attributeName of COMPASS_HEADING_ATTRIBUTE_CANDIDATES) {
    const headingFromAttribute = parseDirectionDegrees(
      stateObj?.attributes?.[attributeName]
    );
    if (headingFromAttribute !== null) {
      score += 3;
      break;
    }
  }

  return score > 0 ? score : -1;
}

function discoverCompassEntityId(hass, preferredEntityId = "") {
  const states = Object.entries(hass?.states || {});
  if (!states.length) {
    return preferredEntityId || "";
  }

  const scored = states
    .map(([entityId, stateObj]) => ({
      entityId,
      score: getCompassEntityScore(entityId, stateObj),
      name: getEntityName(entityId, stateObj).toLowerCase(),
    }))
    .filter((item) => item.score >= 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.name.localeCompare(right.name) ||
        left.entityId.localeCompare(right.entityId)
    );

  if (preferredEntityId) {
    const preferredEntry = scored.find((entry) => entry.entityId === preferredEntityId);
    if (preferredEntry) {
      return preferredEntry.entityId;
    }
  }

  return scored[0]?.entityId || preferredEntityId || "";
}

function getSunPhase(elevation, rising) {
  if (!Number.isFinite(elevation)) {
    return "day";
  }

  if (elevation < -6) {
    return "night";
  }

  if (rising && elevation <= 10) {
    return "sunrise";
  }

  if (!rising && elevation <= 10) {
    return "sunset";
  }

  return "day";
}

function getSpeedUnit(entityState, config) {
  return (
    config.speed_unit ||
    entityState?.attributes?.unit_of_measurement ||
    ""
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getEntityName(entityId, stateObj) {
  return stateObj?.attributes?.friendly_name || entityId;
}

function buildEntityOptions(hass, domains, selectedValue, placeholder) {
  const entries = Object.entries(hass?.states || {})
    .filter(([entityId]) => domains.includes(entityId.split(".")[0]))
    .sort((left, right) => {
      const leftName = getEntityName(left[0], left[1]).toLowerCase();
      const rightName = getEntityName(right[0], right[1]).toLowerCase();
      return leftName.localeCompare(rightName) || left[0].localeCompare(right[0]);
    });

  const options = [
    `<option value="">${escapeHtml(placeholder)}</option>`,
    ...entries.map(([entityId, stateObj]) => {
      const selected = entityId === selectedValue ? " selected" : "";
      const label = `${getEntityName(entityId, stateObj)} (${entityId})`;
      return `<option value="${escapeHtml(entityId)}"${selected}>${escapeHtml(label)}</option>`;
    }),
  ];

  return options.join("");
}

function buildDirectionLanguageOptions(selectedValue) {
  const language = normalizeDirectionLanguage(selectedValue);

  return [
    `<option value="en"${language === "en" ? " selected" : ""}>English</option>`,
    `<option value="cs"${language === "cs" ? " selected" : ""}>Cestina</option>`,
  ].join("");
}

function buildBooleanOptions(selectedValue) {
  return [
    `<option value="true"${selectedValue ? " selected" : ""}>Ano</option>`,
    `<option value="false"${!selectedValue ? " selected" : ""}>Ne</option>`,
  ].join("");
}

function buildCompassModeOptions(selectedValue) {
  const mode = normalizeCompassMode(selectedValue);

  return [
    `<option value="north_locked"${mode === "north_locked" ? " selected" : ""}>Lock north</option>`,
    `<option value="follow_compass"${mode === "follow_compass" ? " selected" : ""}>Rotate by compass</option>`,
  ].join("");
}

function buildCompassEntityOptions(hass, selectedValue, autoSuggestedEntityId) {
  const selected = selectedValue || "";
  const entries = Object.entries(hass?.states || {})
    .filter(([entityId, stateObj]) => {
      if (entityId === selected) {
        return true;
      }
      return getCompassEntityScore(entityId, stateObj) >= 0;
    })
    .sort((left, right) => {
      const leftName = getEntityName(left[0], left[1]).toLowerCase();
      const rightName = getEntityName(right[0], right[1]).toLowerCase();
      return leftName.localeCompare(rightName) || left[0].localeCompare(right[0]);
    });

  const autoLabel = autoSuggestedEntityId
    ? `Auto (${autoSuggestedEntityId} or phone compass)`
    : "Auto (phone compass)";
  const options = [
    `<option value=""${selected === "" ? " selected" : ""}>${escapeHtml(autoLabel)}</option>`,
    `<option value="${VIRTUAL_COMPASS_ENTITY_ID}"${selected === VIRTUAL_COMPASS_ENTITY_ID ? " selected" : ""}>Phone compass (virtual entity)</option>`,
    ...entries.map(([entityId, stateObj]) => {
      const isSelected = entityId === selected ? " selected" : "";
      const label = `${getEntityName(entityId, stateObj)} (${entityId})`;
      return `<option value="${escapeHtml(entityId)}"${isSelected}>${escapeHtml(label)}</option>`;
    }),
  ];

  if (
    selected &&
    selected !== VIRTUAL_COMPASS_ENTITY_ID &&
    !entries.some(([entityId]) => entityId === selected)
  ) {
    options.push(
      `<option value="${escapeHtml(selected)}" selected>${escapeHtml(selected)} (missing)</option>`
    );
  }

  return options.join("");
}

function buildMoonPhaseMarkup(phase, clipId) {
  const baseClip = `url(#${clipId})`;

  switch (phase) {
    case "new_moon":
      return `<circle class="moon-shadow" cx="140" cy="50" r="9.5"></circle>`;
    case "waxing_crescent":
      return `<ellipse class="moon-shadow" cx="135.5" cy="50" rx="8.1" ry="9.5" clip-path="${baseClip}"></ellipse>`;
    case "first_quarter":
      return `<rect class="moon-shadow" x="130.5" y="40.5" width="9.5" height="19" clip-path="${baseClip}"></rect>`;
    case "waxing_gibbous":
      return `<ellipse class="moon-shadow moon-shadow--sliver" cx="133" cy="50" rx="3.5" ry="9.5" clip-path="${baseClip}"></ellipse>`;
    case "waning_gibbous":
      return `<ellipse class="moon-shadow moon-shadow--sliver" cx="147" cy="50" rx="3.5" ry="9.5" clip-path="${baseClip}"></ellipse>`;
    case "last_quarter":
      return `<rect class="moon-shadow" x="140" y="40.5" width="9.5" height="19" clip-path="${baseClip}"></rect>`;
    case "waning_crescent":
      return `<ellipse class="moon-shadow" cx="144.5" cy="50" rx="8.1" ry="9.5" clip-path="${baseClip}"></ellipse>`;
    case "full_moon":
    default:
      return "";
  }
}

function fireConfigChanged(target, config) {
  target.dispatchEvent(
    new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true,
    })
  );
}

class CompassCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._boundInput = this._onInput.bind(this);
  }

  setConfig(config) {
    this._config = {
      type: "custom:compass-card",
      title: "",
      direction_language: "en",
      compass_mode: "north_locked",
      compass_entity: "",
      compass_attribute: "",
      show_sun: false,
      show_moon: false,
      sun_entity: "sun.sun",
      sun_attribute: "azimuth",
      moon_phase_entity: "sensor.moon",
      moon_position_entity: "",
      moon_azimuth_attribute: "azimuth",
      moon_elevation_attribute: "elevation",
      observer_entity: "zone.home",
      observer_latitude: "",
      observer_longitude: "",
      speed_decimals: 1,
      degree_decimals: 0,
      show_degrees: true,
      ...config,
    };
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener("change", this._boundInput);
    this.shadowRoot.addEventListener("input", this._boundInput);
    this.render();
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener("change", this._boundInput);
    this.shadowRoot.removeEventListener("input", this._boundInput);
  }

  _onInput(event) {
    const target = event.target;
    if (!target?.dataset?.field) {
      return;
    }

    const config = {
      ...this._config,
      type: "custom:compass-card",
    };

    switch (target.dataset.field) {
      case "title":
        if (target.value.trim()) {
          config.title = target.value;
        } else {
          delete config.title;
        }
        break;
      case "direction_entity":
        config.direction_entity = target.value;
        break;
      case "speed_entity":
        config.speed_entity = target.value;
        break;
      case "speed_unit":
        if (target.value.trim()) {
          config.speed_unit = target.value.trim();
        } else {
          delete config.speed_unit;
        }
        break;
      case "direction_language":
        config.direction_language = normalizeDirectionLanguage(target.value);
        break;
      case "compass_mode":
        config.compass_mode = normalizeCompassMode(target.value);
        break;
      case "compass_entity":
        if (target.value.trim()) {
          config.compass_entity = target.value;
        } else {
          delete config.compass_entity;
        }
        break;
      case "compass_attribute":
        if (target.value.trim()) {
          config.compass_attribute = target.value.trim();
        } else {
          delete config.compass_attribute;
        }
        break;
      case "show_sun":
        config.show_sun = target.value === "true";
        break;
      case "show_moon":
        config.show_moon = target.value === "true";
        break;
      case "sun_entity":
        if (target.value.trim()) {
          config.sun_entity = target.value;
        } else {
          delete config.sun_entity;
        }
        break;
      case "sun_attribute":
        if (target.value.trim()) {
          config.sun_attribute = target.value.trim();
        } else {
          delete config.sun_attribute;
        }
        break;
      case "moon_phase_entity":
        if (target.value.trim()) {
          config.moon_phase_entity = target.value;
        } else {
          delete config.moon_phase_entity;
        }
        break;
      case "moon_position_entity":
        if (target.value.trim()) {
          config.moon_position_entity = target.value;
        } else {
          delete config.moon_position_entity;
        }
        break;
      case "moon_azimuth_attribute":
        if (target.value.trim()) {
          config.moon_azimuth_attribute = target.value.trim();
        } else {
          delete config.moon_azimuth_attribute;
        }
        break;
      case "moon_elevation_attribute":
        if (target.value.trim()) {
          config.moon_elevation_attribute = target.value.trim();
        } else {
          delete config.moon_elevation_attribute;
        }
        break;
      case "observer_entity":
        if (target.value.trim()) {
          config.observer_entity = target.value;
        } else {
          delete config.observer_entity;
        }
        break;
      case "observer_latitude":
        if (target.value.trim()) {
          config.observer_latitude = target.value.trim();
        } else {
          delete config.observer_latitude;
        }
        break;
      case "observer_longitude":
        if (target.value.trim()) {
          config.observer_longitude = target.value.trim();
        } else {
          delete config.observer_longitude;
        }
        break;
      case "speed_decimals": {
        const value = Number.parseInt(target.value, 10);
        config.speed_decimals = Number.isFinite(value) ? value : 1;
        break;
      }
      case "degree_decimals": {
        const value = Number.parseInt(target.value, 10);
        config.degree_decimals = Number.isFinite(value) ? value : 0;
        break;
      }
      case "show_degrees":
        config.show_degrees = Boolean(target.checked);
        break;
      default:
        return;
    }

    this._config = config;
    fireConfigChanged(this, this._config);
    this.render();
  }

  render() {
    const config = this._config || {};
    const hass = this._hass;
    const directionOptions = buildEntityOptions(
      hass,
      ["sensor", "input_number", "input_text"],
      config.direction_entity,
      "Select direction entity"
    );
    const speedOptions = buildEntityOptions(
      hass,
      ["sensor", "input_number"],
      config.speed_entity,
      "Select speed entity"
    );
    const sunOptions = buildEntityOptions(
      hass,
      ["sun", "sensor"],
      config.sun_entity || "sun.sun",
      "Select sun entity"
    );
    const directionLanguageOptions = buildDirectionLanguageOptions(
      config.direction_language
    );
    const autoCompassEntity = discoverCompassEntityId(
      hass,
      config.compass_entity || ""
    );
    const compassModeOptions = buildCompassModeOptions(config.compass_mode);
    const compassEntityOptions = buildCompassEntityOptions(
      hass,
      config.compass_entity || "",
      autoCompassEntity
    );
    const showSunOptions = buildBooleanOptions(config.show_sun === true);
    const showMoonOptions = buildBooleanOptions(config.show_moon === true);
    const moonPhaseOptions = buildEntityOptions(
      hass,
      ["sensor"],
      config.moon_phase_entity || "sensor.moon",
      "Select moon phase entity"
    );
    const moonPositionOptions = buildEntityOptions(
      hass,
      ["sensor"],
      config.moon_position_entity || "",
      "Select moon position entity"
    );
    const observerOptions = buildEntityOptions(
      hass,
      ["zone"],
      config.observer_entity || "zone.home",
      "Select observer entity"
    );

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: var(--primary-text-color);
          font-family: var(--paper-font-body1_-_font-family, "Segoe UI", sans-serif);
        }

        .editor {
          display: grid;
          gap: 16px;
        }

        .section {
          padding: 16px;
          border-radius: 20px;
          background: rgba(24, 129, 188, 0.06);
          border: 1px solid rgba(24, 129, 188, 0.12);
        }

        .section-title {
          margin: 0 0 12px;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.03em;
        }

        .grid {
          display: grid;
          gap: 12px;
        }

        .grid.compact {
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        }

        label {
          display: grid;
          gap: 6px;
          font-size: 0.88rem;
          font-weight: 600;
        }

        input,
        select {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(127, 140, 153, 0.38);
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color);
          font: inherit;
        }

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin: 0;
        }

        .toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
        }

        .hint {
          margin: 0;
          font-size: 0.82rem;
          color: var(--secondary-text-color);
          line-height: 1.45;
        }
      </style>

      <div class="editor">
        <div class="section">
          <div class="section-title">Entities</div>
          <div class="grid">
            <label>
              Direction entity
              <select data-field="direction_entity">
                ${directionOptions}
              </select>
            </label>
            <label>
              Speed entity
              <select data-field="speed_entity">
                ${speedOptions}
              </select>
            </label>
          </div>
          <p class="hint">Direction can be degrees or text like N, SW or Severovychod. Speed uses the entity unit unless you override it below.</p>
        </div>

        <div class="section">
          <div class="section-title">Display</div>
          <div class="grid">
            <label>
              Title
              <input data-field="title" type="text" value="${escapeHtml(config.title || "")}" placeholder="Wind Compass">
            </label>
            <label>
              Direction labels
              <select data-field="direction_language">
                ${directionLanguageOptions}
              </select>
            </label>
            <label>
              Speed unit override
              <input data-field="speed_unit" type="text" value="${escapeHtml(config.speed_unit || "")}" placeholder="km/h">
            </label>
            <label>
              Compass orientation
              <select data-field="compass_mode">
                ${compassModeOptions}
              </select>
            </label>
            <label>
              Compass entity
              <select data-field="compass_entity">
                ${compassEntityOptions}
              </select>
            </label>
            <label>
              Compass attribute
              <input data-field="compass_attribute" type="text" value="${escapeHtml(config.compass_attribute || "")}" placeholder="heading">
            </label>
            <label>
              Show sun position
              <select data-field="show_sun">
                ${showSunOptions}
              </select>
            </label>
            <label>
              Sun entity
              <select data-field="sun_entity">
                ${sunOptions}
              </select>
            </label>
            <label>
              Sun attribute
              <input data-field="sun_attribute" type="text" value="${escapeHtml(config.sun_attribute || "azimuth")}" placeholder="azimuth">
            </label>
            <label>
              Show moon
              <select data-field="show_moon">
                ${showMoonOptions}
              </select>
            </label>
            <label>
              Moon phase entity
              <select data-field="moon_phase_entity">
                ${moonPhaseOptions}
              </select>
            </label>
            <label>
              Moon position entity
              <select data-field="moon_position_entity">
                ${moonPositionOptions}
              </select>
            </label>
            <label>
              Moon azimuth attribute
              <input data-field="moon_azimuth_attribute" type="text" value="${escapeHtml(config.moon_azimuth_attribute || "azimuth")}" placeholder="azimuth">
            </label>
            <label>
              Moon elevation attribute
              <input data-field="moon_elevation_attribute" type="text" value="${escapeHtml(config.moon_elevation_attribute || "elevation")}" placeholder="elevation">
            </label>
            <label>
              Observer entity
              <select data-field="observer_entity">
                ${observerOptions}
              </select>
            </label>
            <label>
              Observer latitude override
              <input data-field="observer_latitude" type="text" value="${escapeHtml(config.observer_latitude || "")}" placeholder="49.1951">
            </label>
            <label>
              Observer longitude override
              <input data-field="observer_longitude" type="text" value="${escapeHtml(config.observer_longitude || "")}" placeholder="16.6068">
            </label>
          </div>
          <p class="hint">In rotate mode the card tries the selected compass entity first and falls back to the built-in phone compass.</p>
        </div>

        <div class="section">
          <div class="section-title">Formatting</div>
          <div class="grid compact">
            <label>
              Speed decimals
              <input data-field="speed_decimals" type="number" min="0" max="6" step="1" value="${escapeHtml(config.speed_decimals ?? 1)}">
            </label>
            <label>
              Degree decimals
              <input data-field="degree_decimals" type="number" min="0" max="3" step="1" value="${escapeHtml(config.degree_decimals ?? 0)}">
            </label>
          </div>
          <label class="toggle">
            <input data-field="show_degrees" type="checkbox"${config.show_degrees !== false ? " checked" : ""}>
            Show degrees in center
          </label>
        </div>
      </div>
    `;
  }
}

function buildTicks() {
  return Array.from({ length: 24 }, (_, index) => {
    const angle = index * 15;
    const isCardinal = angle % 90 === 0;
    const isIntercardinal = angle % 45 === 0;
    const start = isCardinal ? 22 : isIntercardinal ? 28 : 33;
    const end = 10;

    return `
      <line
        class="tick ${isCardinal ? "tick-cardinal" : ""}"
        x1="140"
        y1="${start}"
        x2="140"
        y2="${end}"
        transform="rotate(${angle} 140 140)"
      ></line>
    `;
  }).join("");
}

function buildLabels(language) {
  const labels = normalizeDirectionLanguage(language) === "cs"
    ? [
        ["S", 140, 24],
        ["V", 256, 144],
        ["J", 140, 264],
        ["Z", 24, 144],
      ]
    : [
        ["N", 140, 24],
        ["E", 256, 144],
        ["S", 140, 264],
        ["W", 24, 144],
      ];

  return labels
    .map(
      ([text, x, y]) => `
        <text class="cardinal-label" x="${x}" y="${y}">${text}</text>
      `
    )
    .join("");
}

class CompassCard extends HTMLElement {
  static async getConfigElement() {
    return document.createElement("compass-card-editor");
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._instanceId = Math.random().toString(36).slice(2, 10);
    this._deviceCompassHeading = null;
    this._orientationListening = false;
    this._orientationPermissionState = "unknown";
    this._boundDeviceOrientation = this._onDeviceOrientation.bind(this);
    this._boundEnableCompass = this._onEnableCompassClick.bind(this);
  }

  setConfig(config) {
    if (!config?.direction_entity) {
      throw new Error("Compass card requires direction_entity.");
    }

    if (!config?.speed_entity) {
      throw new Error("Compass card requires speed_entity.");
    }

    this._config = {
      ...config,
      title: config.title || "Wind Compass",
      direction_language: normalizeDirectionLanguage(config.direction_language),
      compass_mode: normalizeCompassMode(config.compass_mode),
      compass_entity: config.compass_entity || "",
      compass_attribute: config.compass_attribute || "",
      show_sun: config.show_sun === true,
      show_moon: config.show_moon === true,
      sun_entity: config.sun_entity || "sun.sun",
      sun_attribute: config.sun_attribute || "azimuth",
      moon_phase_entity: config.moon_phase_entity || "sensor.moon",
      moon_position_entity: config.moon_position_entity || "",
      moon_azimuth_attribute: config.moon_azimuth_attribute || "azimuth",
      moon_elevation_attribute: config.moon_elevation_attribute || "elevation",
      observer_entity: config.observer_entity || "zone.home",
      observer_latitude: config.observer_latitude ?? "",
      observer_longitude: config.observer_longitude ?? "",
      speed_decimals: Number.isFinite(config.speed_decimals)
        ? config.speed_decimals
        : 1,
      degree_decimals: Number.isFinite(config.degree_decimals)
        ? config.degree_decimals
        : 0,
      show_degrees: config.show_degrees !== false,
    };
  }

  connectedCallback() {
    this._startDeviceOrientationListener();
  }

  disconnectedCallback() {
    this._stopDeviceOrientationListener();
  }

  _startDeviceOrientationListener() {
    if (this._orientationListening || typeof window === "undefined") {
      return;
    }

    window.addEventListener("deviceorientationabsolute", this._boundDeviceOrientation, true);
    window.addEventListener("deviceorientation", this._boundDeviceOrientation, true);
    this._orientationListening = true;
  }

  _stopDeviceOrientationListener() {
    if (!this._orientationListening || typeof window === "undefined") {
      return;
    }

    window.removeEventListener("deviceorientationabsolute", this._boundDeviceOrientation, true);
    window.removeEventListener("deviceorientation", this._boundDeviceOrientation, true);
    this._orientationListening = false;
  }

  _extractHeadingFromOrientationEvent(event) {
    if (!event) {
      return null;
    }

    const webkitHeading = parseNumericValue(event.webkitCompassHeading);
    if (Number.isFinite(webkitHeading)) {
      return normalizeDegrees(webkitHeading);
    }

    const alpha = parseNumericValue(event.alpha);
    if (!Number.isFinite(alpha)) {
      return null;
    }

    return normalizeDegrees(360 - alpha);
  }

  _onDeviceOrientation(event) {
    const heading = this._extractHeadingFromOrientationEvent(event);
    if (heading === null) {
      return;
    }

    if (
      this._deviceCompassHeading !== null &&
      Math.abs(this._deviceCompassHeading - heading) < 0.4
    ) {
      return;
    }

    this._deviceCompassHeading = heading;
    if (normalizeCompassMode(this._config?.compass_mode) === "follow_compass") {
      this.render();
    }
  }

  _canRequestOrientationPermission() {
    return (
      typeof window !== "undefined" &&
      typeof window.DeviceOrientationEvent !== "undefined" &&
      typeof window.DeviceOrientationEvent.requestPermission === "function"
    );
  }

  async _onEnableCompassClick() {
    if (!this._canRequestOrientationPermission()) {
      return;
    }

    try {
      const permission = await window.DeviceOrientationEvent.requestPermission();
      this._orientationPermissionState = permission;
    } catch (error) {
      this._orientationPermissionState = "denied";
    }

    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  getCardSize() {
    return 4;
  }

  static getStubConfig() {
    return {
      type: "custom:compass-card",
      title: "Wind Compass",
      direction_entity: "sensor.wind_direction",
      speed_entity: "sensor.wind_speed",
      compass_mode: "north_locked",
      show_sun: true,
      sun_entity: "sun.sun",
      sun_attribute: "azimuth",
      show_moon: false,
      moon_phase_entity: "sensor.moon",
      observer_entity: "zone.home",
    };
  }

  render() {
    if (!this._config) {
      return;
    }

    const directionState = getEntityState(this._hass, this._config.direction_entity);
    const speedState = getEntityState(this._hass, this._config.speed_entity);
    const directionLanguage = normalizeDirectionLanguage(this._config.direction_language);
    const compassMode = normalizeCompassMode(this._config.compass_mode);
    const configuredCompassEntityId = this._config.compass_entity || "";
    const useVirtualCompassOnly =
      configuredCompassEntityId === VIRTUAL_COMPASS_ENTITY_ID;
    const autoCompassEntityId =
      compassMode === "follow_compass"
        ? discoverCompassEntityId(this._hass, configuredCompassEntityId)
        : "";
    const compassEntityId = useVirtualCompassOnly
      ? ""
      : configuredCompassEntityId || autoCompassEntityId;
    const compassHeadingFromEntity =
      compassMode === "follow_compass" && compassEntityId
        ? getCompassHeadingFromEntity(
            this._hass,
            compassEntityId,
            this._config.compass_attribute
          )
        : null;
    const compassHeadingFromPhone =
      compassMode === "follow_compass" ? this._deviceCompassHeading : null;
    const compassHeading =
      compassMode === "follow_compass"
        ? useVirtualCompassOnly
          ? compassHeadingFromPhone
          : compassHeadingFromEntity ?? compassHeadingFromPhone
        : null;
    const sceneRotation = compassHeading === null ? 0 : -compassHeading;
    const compassStatus =
      compassMode === "follow_compass"
        ? compassHeading !== null
          ? `Heading ${compassHeading.toFixed(0)}°`
          : "Compass unavailable"
        : "";
    const showCompassPermissionButton =
      compassMode === "follow_compass" &&
      compassHeading === null &&
      this._canRequestOrientationPermission() &&
      this._orientationPermissionState !== "granted";
    const sunState = this._config.show_sun
      ? getEntityState(this._hass, this._config.sun_entity)
      : null;
    const sunDegrees = this._config.show_sun
      ? getEntityNumericValue(
          this._hass,
          this._config.sun_entity,
          this._config.sun_attribute
        )
      : null;
    const sunElevation = parseNumericValue(sunState?.attributes?.elevation);
    const sunRising = Boolean(sunState?.attributes?.rising);
    const sunPhase = getSunPhase(sunElevation, sunRising);
    const sunVisible = this._config.show_sun && sunDegrees !== null;
    const observerCoordinates = getObserverCoordinates(this._hass, this._config);
    const moonPositionEntityId = this._config.moon_position_entity || "";
    const moonPhaseState = this._config.show_moon
      ? getEntityState(this._hass, this._config.moon_phase_entity)
      : null;
    const moonPositionState = this._config.show_moon && moonPositionEntityId
      ? getEntityState(this._hass, moonPositionEntityId)
      : null;
    const moonPhase = normalizeMoonPhase(moonPhaseState?.state);
    const moonDegreesFromEntity = this._config.show_moon && moonPositionEntityId
      ? getEntityNumericValue(
          this._hass,
          moonPositionEntityId,
          this._config.moon_azimuth_attribute
        )
      : null;
    const moonElevationFromEntity = parseNumericValue(
      moonPositionState?.attributes?.[this._config.moon_elevation_attribute]
    );
    const moonPositionComputed =
      this._config.show_moon &&
      moonDegreesFromEntity === null &&
      observerCoordinates
        ? getMoonPosition(
            new Date(),
            observerCoordinates.latitude,
            observerCoordinates.longitude
          )
        : null;
    const moonDegrees =
      moonDegreesFromEntity ?? moonPositionComputed?.azimuth ?? null;
    const moonElevation =
      moonElevationFromEntity ?? moonPositionComputed?.elevation ?? null;
    const moonVisible = this._config.show_moon && moonDegrees !== null;
    const moonBelowHorizon = Number.isFinite(moonElevation) && moonElevation < 0;
    const moonPhaseLabel =
      this._config.show_moon && moonPhase
        ? getMoonPhaseLabel(moonPhase, directionLanguage)
        : "";
    const moonClipId = `moon-clip-${this._instanceId}`;
    const moonCaption =
      !moonVisible && moonPhaseLabel ? moonPhaseLabel : "";

    const rawDirection = directionState?.state;
    const directionDegrees = parseDirectionDegrees(rawDirection);
    const directionLabel = getDirectionLabel(
      directionDegrees,
      rawDirection,
      directionLanguage
    );
    const speedValue = formatSpeed(
      speedState?.state,
      this._config.speed_decimals
    );
    const speedUnit = getSpeedUnit(speedState, this._config);
    const degreesLabel = formatDegrees(
      directionDegrees,
      this._config.degree_decimals
    );

    const unavailable =
      !directionState ||
      !speedState ||
      directionState.state === "unavailable" ||
      speedState.state === "unavailable" ||
      directionState.state === "unknown" ||
      speedState.state === "unknown";

    const rotation = directionDegrees ?? 0;
    let subtitle = "";
    if (unavailable) {
      subtitle = "Entity unavailable";
    } else {
      const subtitleParts = [];
      if (this._config.show_degrees) {
        subtitleParts.push(degreesLabel);
      }
      if (compassStatus) {
        subtitleParts.push(compassStatus);
      }
      subtitle = subtitleParts.join(" | ");
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --compass-card-bg:
            radial-gradient(circle at 50% 42%, rgba(57, 192, 181, 0.26), transparent 42%),
            linear-gradient(160deg, var(--ha-card-background, rgba(18, 30, 44, 0.96)) 0%, rgba(8, 18, 29, 0.98) 100%);
          --compass-ring: rgba(176, 229, 224, 0.18);
          --compass-ring-strong: rgba(176, 229, 224, 0.34);
          --compass-ink: var(--compass-card-text-color, #f3f8fb);
          --compass-muted: var(--compass-card-muted-color, rgba(243, 248, 251, 0.64));
          --compass-arrow: #ff8b5e;
          --compass-center: rgba(11, 28, 39, 0.92);
          --compass-chip-bg: rgba(255, 255, 255, 0.08);
          --compass-shell-border: rgba(255, 255, 255, 0.05);
          --compass-highlight: rgba(255, 255, 255, 0.08);
          --compass-shadow: rgba(0, 0, 0, 0.22);
          --compass-surface-shadow: rgba(0, 0, 0, 0.28);
          --compass-svg-shadow: rgba(0, 0, 0, 0.22);
          --compass-tick: rgba(230, 252, 249, 0.28);
          --compass-tick-strong: rgba(230, 252, 249, 0.54);
          --compass-cardinal: rgba(244, 251, 255, 0.96);
          --compass-cardinal-stroke: rgba(3, 12, 20, 0.96);
          --compass-moon: #edf2ff;
          --compass-moon-shadow: rgba(19, 29, 46, 0.88);
          --compass-moon-glow: rgba(196, 210, 255, 0.28);
          --compass-moon-crater: rgba(162, 178, 215, 0.34);
          display: block;
        }

        @media (prefers-color-scheme: light) {
          :host {
            --compass-card-bg:
              radial-gradient(circle at 50% 38%, rgba(39, 163, 190, 0.16), transparent 42%),
              linear-gradient(165deg, rgba(243, 250, 255, 0.98) 0%, rgba(221, 237, 247, 0.98) 100%);
            --compass-ring: rgba(34, 88, 112, 0.12);
            --compass-ring-strong: rgba(34, 88, 112, 0.24);
            --compass-ink: var(--compass-card-text-color, #173042);
            --compass-muted: var(--compass-card-muted-color, rgba(23, 48, 66, 0.62));
            --compass-center: rgba(255, 255, 255, 0.9);
            --compass-chip-bg: rgba(22, 58, 79, 0.08);
            --compass-shell-border: rgba(31, 92, 122, 0.1);
            --compass-highlight: rgba(255, 255, 255, 0.72);
            --compass-shadow: rgba(65, 104, 128, 0.18);
            --compass-surface-shadow: rgba(87, 125, 149, 0.18);
            --compass-svg-shadow: rgba(58, 93, 122, 0.12);
            --compass-tick: rgba(31, 92, 122, 0.32);
            --compass-tick-strong: rgba(23, 72, 98, 0.58);
            --compass-cardinal: rgba(25, 74, 100, 0.8);
            --compass-cardinal-stroke: rgba(245, 251, 255, 0.92);
            --compass-moon: #f9fbff;
            --compass-moon-shadow: rgba(94, 118, 153, 0.66);
            --compass-moon-glow: rgba(163, 184, 221, 0.28);
            --compass-moon-crater: rgba(142, 158, 188, 0.26);
          }
        }

        ha-card {
          position: relative;
          overflow: hidden;
          padding: 18px;
          border-radius: 28px;
          background: var(--compass-card-bg);
          color: var(--compass-ink);
          font-family: "Avenir Next", "Trebuchet MS", "Segoe UI", sans-serif;
          box-shadow:
            inset 0 1px 0 var(--compass-highlight),
            0 18px 42px var(--compass-shadow);
        }

        ha-card::before {
          content: "";
          position: absolute;
          inset: 14px;
          border-radius: 26px;
          border: 1px solid var(--compass-shell-border);
          pointer-events: none;
        }

        .header {
          display: flex;
          align-items: baseline;
          justify-content: flex-start;
          margin-bottom: 12px;
        }

        .title {
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .compass {
          position: relative;
          width: min(100%, 320px);
          margin: 0 auto;
          aspect-ratio: 1;
        }

        svg {
          width: 100%;
          height: 100%;
          display: block;
          filter: drop-shadow(0 18px 24px var(--compass-svg-shadow));
        }

        .ring {
          fill: none;
          stroke: var(--compass-ring);
          stroke-width: 1;
        }

        .ring-strong {
          stroke: var(--compass-ring-strong);
        }

        .tick {
          stroke: var(--compass-tick);
          stroke-width: 2;
          stroke-linecap: round;
        }

        .tick-cardinal {
          stroke: var(--compass-tick-strong);
          stroke-width: 3;
        }

        .cardinal-label {
          fill: var(--compass-cardinal);
          stroke: var(--compass-cardinal-stroke);
          stroke-width: 4.8px;
          paint-order: stroke fill;
          font-size: 18px;
          font-weight: 800;
          text-anchor: middle;
          dominant-baseline: middle;
          letter-spacing: 0.08em;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.34));
        }

        .arrow-glow {
          fill: rgba(255, 139, 94, 0.18);
        }

        .arrow-line {
          stroke: var(--compass-arrow);
          stroke-width: 6;
          stroke-linecap: round;
        }

        .arrow-head {
          fill: var(--compass-arrow);
        }

        .sun-orbit {
          opacity: ${sunVisible ? "1" : "0.28"};
        }

        .sun-marker {
          transform-origin: 140px 44px;
        }

        .sun-marker--day {
          animation: sun-pulse 4.8s ease-in-out infinite;
        }

        .sun-marker--sunrise {
          animation:
            sun-rise-drift 2.8s ease-in-out infinite,
            sun-flare 1.8s ease-in-out infinite;
        }

        .sun-marker--sunset {
          animation:
            sun-set-drift 3.2s ease-in-out infinite,
            sun-fade 2.2s ease-in-out infinite;
        }

        .sun-marker--night {
          animation: none;
          opacity: 0.2;
        }

        .sun-ray {
          stroke: #ffd36b;
          stroke-width: 2.2;
          stroke-linecap: round;
        }

        .sun-core {
          fill: #ffd15c;
          stroke: rgba(255, 255, 255, 0.32);
          stroke-width: 1;
        }

        .sun-glow {
          fill: rgba(255, 209, 92, 0.2);
        }

        .sun-halo {
          fill: none;
          stroke: rgba(255, 211, 107, 0.34);
          stroke-width: 1.4;
        }

        .sun-orbit--sunrise .sun-core,
        .sun-orbit--sunrise .sun-glow,
        .sun-orbit--sunrise .sun-ray {
          filter: drop-shadow(0 0 12px rgba(255, 198, 79, 0.55));
        }

        .sun-orbit--sunset .sun-core,
        .sun-orbit--sunset .sun-glow,
        .sun-orbit--sunset .sun-ray {
          filter: drop-shadow(0 0 10px rgba(255, 135, 94, 0.5));
        }

        .moon-orbit {
          opacity: ${moonVisible ? (moonBelowHorizon ? "0.34" : "1") : "0"};
        }

        .moon-marker {
          transform-origin: 140px 50px;
        }

        .moon-marker--visible {
          animation: moon-sway 6.4s ease-in-out infinite;
        }

        .moon-glow {
          fill: var(--compass-moon-glow);
        }

        .moon-disc {
          fill: var(--compass-moon);
          stroke: rgba(255, 255, 255, 0.36);
          stroke-width: 0.8;
        }

        .moon-shadow {
          fill: var(--compass-moon-shadow);
        }

        .moon-shadow--sliver {
          opacity: 0.92;
        }

        .moon-crater {
          fill: var(--compass-moon-crater);
        }

        @keyframes moon-sway {
          0%, 100% {
            transform: translateY(0) scale(0.98);
          }
          50% {
            transform: translateY(-1px) scale(1.03);
          }
        }

        @keyframes sun-pulse {
          0%, 100% {
            transform: scale(0.98);
            opacity: 0.92;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        @keyframes sun-rise-drift {
          0%, 100% {
            transform: translateY(11px) scale(0.86);
          }
          50% {
            transform: translateY(-1px) scale(1.16);
          }
        }

        @keyframes sun-set-drift {
          0%, 100% {
            transform: translateY(0) scale(1.08);
          }
          50% {
            transform: translateY(13px) scale(0.8);
          }
        }

        @keyframes sun-flare {
          0%, 100% {
            opacity: 0.78;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes sun-fade {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.46;
          }
        }

        .center-wrap {
          position: absolute;
          inset: 50%;
          width: 42%;
          height: 42%;
          transform: translate(-50%, -50%);
          display: grid;
          place-items: center;
          border-radius: 50%;
          background:
            radial-gradient(circle at 30% 30%, rgba(57, 192, 181, 0.18), transparent 55%),
            var(--compass-center);
          box-shadow:
            inset 0 1px 0 var(--compass-highlight),
            0 10px 24px var(--compass-surface-shadow);
          text-align: center;
          padding: 14px;
          backdrop-filter: blur(6px);
        }

        .direction {
          font-size: clamp(1.9rem, 7vw, 2.8rem);
          line-height: 1;
          font-weight: 800;
          font-family: "Avenir Next Condensed", "Avenir Next", "Trebuchet MS", sans-serif;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .speed {
          margin-top: 6px;
          font-size: clamp(0.92rem, 2.8vw, 1.05rem);
          font-weight: 600;
          color: var(--compass-ink);
        }

        .subtitle {
          margin-top: 4px;
          font-size: 0.76rem;
          color: var(--compass-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .subtitle:empty {
          display: none;
        }

        .moon-phase {
          margin-top: 5px;
          font-size: 0.68rem;
          color: var(--compass-muted);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .moon-phase:empty {
          display: none;
        }

        .compass-permission {
          margin: 14px auto 0;
          display: block;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: var(--compass-chip-bg);
          color: var(--compass-ink);
          font: inherit;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: pointer;
        }
      </style>

      <ha-card>
        <div class="header">
          <div class="title">${this._config.title}</div>
        </div>

        <div class="compass">
          <svg viewBox="0 0 280 280" aria-hidden="true">
            <g transform="rotate(${sceneRotation} 140 140)">
              <circle class="ring" cx="140" cy="140" r="128"></circle>
              <circle class="ring ring-strong" cx="140" cy="140" r="108"></circle>
              <circle class="ring" cx="140" cy="140" r="88"></circle>
              ${buildTicks()}
              ${buildLabels(directionLanguage)}
              ${
                this._config.show_sun
                  ? `
                    <g class="sun-orbit sun-orbit--${sunPhase}" transform="rotate(${sunDegrees ?? 0} 140 140)">
                      <g class="sun-marker sun-marker--${sunPhase}">
                        <circle class="sun-halo" cx="140" cy="44" r="21"></circle>
                        <circle class="sun-glow" cx="140" cy="44" r="16"></circle>
                        <line class="sun-ray" x1="140" y1="24" x2="140" y2="14"></line>
                        <line class="sun-ray" x1="140" y1="74" x2="140" y2="84"></line>
                        <line class="sun-ray" x1="120" y1="44" x2="110" y2="44"></line>
                        <line class="sun-ray" x1="160" y1="44" x2="170" y2="44"></line>
                        <line class="sun-ray" x1="126" y1="30" x2="119" y2="23"></line>
                        <line class="sun-ray" x1="154" y1="58" x2="161" y2="65"></line>
                        <line class="sun-ray" x1="126" y1="58" x2="119" y2="65"></line>
                        <line class="sun-ray" x1="154" y1="30" x2="161" y2="23"></line>
                        <circle class="sun-core" cx="140" cy="44" r="10"></circle>
                      </g>
                    </g>
                  `
                  : ""
              }
              ${
                moonVisible
                  ? `
                    <defs>
                      <clipPath id="${moonClipId}">
                        <circle cx="140" cy="50" r="9.5"></circle>
                      </clipPath>
                    </defs>
                    <g class="moon-orbit" transform="rotate(${moonDegrees ?? 0} 140 140)">
                      <g class="moon-marker moon-marker--visible">
                        <circle class="moon-glow" cx="140" cy="50" r="15"></circle>
                        <circle class="moon-disc" cx="140" cy="50" r="9.5"></circle>
                        ${buildMoonPhaseMarkup(moonPhase, moonClipId)}
                        <circle class="moon-crater" cx="137" cy="47" r="1.4"></circle>
                        <circle class="moon-crater" cx="143.5" cy="52.2" r="1.1"></circle>
                      </g>
                    </g>
                  `
                  : ""
              }
              <g transform="rotate(${rotation} 140 140)" style="opacity: ${directionDegrees === null ? "0.24" : "1"}">
                <circle class="arrow-glow" cx="140" cy="140" r="10"></circle>
                <line class="arrow-line" x1="140" y1="140" x2="140" y2="72"></line>
                <path class="arrow-head" d="M140 42 L126 82 L140 72 L154 82 Z"></path>
              </g>
            </g>
          </svg>

          <div class="center-wrap">
            <div>
              <div class="direction">${directionLabel}</div>
              <div class="speed">${speedValue}${speedUnit ? ` ${speedUnit}` : ""}</div>
              <div class="subtitle">${subtitle}</div>
              <div class="moon-phase">${moonCaption}</div>
            </div>
          </div>
        </div>
        ${
          showCompassPermissionButton
            ? '<button class="compass-permission" type="button" data-action="enable-compass">Enable phone compass</button>'
            : ""
        }
      </ha-card>
    `;

    const enableCompassButton = this.shadowRoot.querySelector(
      '[data-action="enable-compass"]'
    );
    if (enableCompassButton) {
      enableCompassButton.addEventListener("click", this._boundEnableCompass);
    }
  }
}

if (!customElements.get("compass-card")) {
  customElements.define("compass-card", CompassCard);
}

if (!customElements.get("compass-card-editor")) {
  customElements.define("compass-card-editor", CompassCardEditor);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "compass-card")) {
  window.customCards.push({
    type: "compass-card",
    name: "Compass Card",
    description:
      "A graphical Home Assistant compass card for wind direction, wind speed, and optional sun and moon position.",
  });
}
