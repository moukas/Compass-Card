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

function getDirectionLabel(degrees, fallbackValue, language) {
  if (degrees === null) {
    return fallbackValue ? String(fallbackValue).trim() : "N/A";
  }

  const index = Math.round(degrees / 22.5) % 16;
  const labels = COMPASS_DIRECTIONS[normalizeDirectionLanguage(language)];
  return labels[index];
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
      show_sun: false,
      sun_entity: "sun.sun",
      sun_attribute: "azimuth",
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
      case "show_sun":
        config.show_sun = target.value === "true";
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
    const showSunOptions = buildBooleanOptions(config.show_sun === true);

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
          </div>
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
  }

  setConfig(config) {
    if (!config?.direction_entity) {
      throw new Error("Compass card requires direction_entity.");
    }

    if (!config?.speed_entity) {
      throw new Error("Compass card requires speed_entity.");
    }

    this._config = {
      title: config.title || "Wind Compass",
      direction_language: normalizeDirectionLanguage(config.direction_language),
      show_sun: config.show_sun === true,
      sun_entity: config.sun_entity || "sun.sun",
      sun_attribute: config.sun_attribute || "azimuth",
      speed_decimals: Number.isFinite(config.speed_decimals)
        ? config.speed_decimals
        : 1,
      degree_decimals: Number.isFinite(config.degree_decimals)
        ? config.degree_decimals
        : 0,
      show_degrees: config.show_degrees !== false,
      ...config,
    };
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
      show_sun: true,
      sun_entity: "sun.sun",
      sun_attribute: "azimuth",
    };
  }

  render() {
    if (!this._config) {
      return;
    }

    const directionState = getEntityState(this._hass, this._config.direction_entity);
    const speedState = getEntityState(this._hass, this._config.speed_entity);
    const directionLanguage = normalizeDirectionLanguage(this._config.direction_language);
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
    const subtitle = unavailable
      ? "Entity unavailable"
      : this._config.show_degrees
        ? degreesLabel
        : "";

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
          --compass-cardinal: rgba(230, 252, 249, 0.78);
          --compass-cardinal-stroke: rgba(6, 18, 28, 0.78);
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
          stroke-width: 4px;
          paint-order: stroke fill;
          font-size: 18px;
          font-weight: 800;
          text-anchor: middle;
          dominant-baseline: middle;
          letter-spacing: 0.08em;
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
      </style>

      <ha-card>
        <div class="header">
          <div class="title">${this._config.title}</div>
        </div>

        <div class="compass">
          <svg viewBox="0 0 280 280" aria-hidden="true">
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
            <g transform="rotate(${rotation} 140 140)" style="opacity: ${directionDegrees === null ? "0.24" : "1"}">
              <circle class="arrow-glow" cx="140" cy="140" r="10"></circle>
              <line class="arrow-line" x1="140" y1="140" x2="140" y2="72"></line>
              <path class="arrow-head" d="M140 42 L126 82 L140 72 L154 82 Z"></path>
            </g>
          </svg>

          <div class="center-wrap">
            <div>
              <div class="direction">${directionLabel}</div>
              <div class="speed">${speedValue}${speedUnit ? ` ${speedUnit}` : ""}</div>
              <div class="subtitle">${subtitle}</div>
            </div>
          </div>
        </div>
      </ha-card>
    `;
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
      "A graphical Home Assistant compass card for wind direction, wind speed, and optional sun position.",
  });
}
