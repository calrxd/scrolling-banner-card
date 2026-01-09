const x = [
  { entity_id: "demo.temperature_outside", label: "Outside", icon: "mdi:sun-thermometer-outline" },
  { entity_id: "demo.temperature_inside", label: "Inside", icon: "mdi:home-thermometer-outline" },
  { entity_id: "demo.lights_on", label: "Lights", icon: "mdi:lightbulb-outline" },
  { entity_id: "demo.security", label: "Security", icon: "mdi:shield-outline" },
  { entity_id: "demo.network", label: "Network", icon: "mdi:wifi" }
];
function m(l, t, e) {
  return Math.max(t, Math.min(e, l));
}
function g(l, t = "") {
  return typeof l == "string" ? l : t;
}
function y(l) {
  return typeof l == "string" && l.trim().length > 0;
}
class A extends HTMLElement {
  constructor() {
    super(...arguments), this._needsMarquee = !1;
  }
  setConfig(t) {
    const e = t ?? {};
    typeof e.type == "string" && e.type.trim(), this._config = {
      type: "custom:scrolling-banner-card",
      title: typeof e.title == "string" ? e.title : void 0,
      entities: Array.isArray(e.entities) ? e.entities : void 0,
      speed: typeof e.speed == "number" ? m(e.speed, 10, 300) : 40,
      pause_on_hover: typeof e.pause_on_hover == "boolean" ? e.pause_on_hover : !0,
      divider: typeof e.divider == "boolean" ? e.divider : !0,
      background: g(e.background, "transparent"),
      text_color: g(e.text_color, "rgba(255,255,255,0.92)"),
      divider_color: g(e.divider_color, "rgba(255,255,255,0.14)"),
      css: g(e.css, "")
    }, this._ensureRoot(), this._render();
  }
  set hass(t) {
    this._hass = t, this._render(!1);
  }
  static getConfigElement() {
    return document.createElement("scrolling-banner-card-editor");
  }
  static getStubConfig() {
    return {
      type: "custom:scrolling-banner-card",
      title: "Scrolling Banner Card",
      speed: 40,
      pause_on_hover: !0,
      divider: !0
      // No entities -> card falls back to DEMO_ITEMS
    };
  }
  connectedCallback() {
    this._ensureRoot(), this._config && this._render();
  }
  disconnectedCallback() {
    this._resizeObs?.disconnect(), this._resizeObs = void 0;
  }
  _ensureRoot() {
    if (this._root) return;
    this._root = this.attachShadow({ mode: "open" });
    const t = document.createElement("style");
    t.textContent = this._baseCss(), this._root.appendChild(t);
    const e = document.createElement("div");
    e.className = "card", e.innerHTML = `
      <div class="header" part="header">
        <div class="title" part="title"></div>
      </div>

      <div class="viewport" part="viewport">
        <div class="track" part="track"></div>
      </div>

      <style class="user-css"></style>
    `, this._root.appendChild(e);
    const i = this._root.querySelector(".viewport");
    this._resizeObs = new ResizeObserver(() => this._recalcMarquee()), this._resizeObs.observe(i);
  }
  _baseCss() {
    return `
      :host {
        display: block;
      }

      .card {
        background: var(--sb-bg, transparent);
        color: var(--sb-text, rgba(255,255,255,0.92));
        border-radius: 18px;
        box-shadow: none;
        border: none;
        padding: 10px 12px;
        overflow: hidden;
      }

      .header {
        display: none;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .title {
        font-size: 13px;
        font-weight: 600;
        opacity: 0.85;
      }

      .viewport {
        overflow: hidden;
        width: 100%;
      }

      .track {
        display: flex;
        align-items: center;
        gap: var(--sb-gap, 12px);
        width: max-content;
        will-change: transform;
      }

      .centered {
        width: 100%;
        justify-content: center;
      }

      .marquee {
        animation: sb-marquee var(--sb-duration, 20s) linear infinite;
      }

      /* ✅ More reliable pause-on-hover */
      :host(.pause-on-hover):hover .marquee,
      :host(.pause-on-hover) .card:hover .marquee,
      :host(.pause-on-hover) .viewport:hover .marquee,
      :host(.pause-on-hover) .track:hover .marquee {
        animation-play-state: paused;
      }

      @keyframes sb-marquee {
        from { transform: translateX(0); }
        to   { transform: translateX(calc(-1 * var(--sb-shift, 0px))); }
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 999px;
        background: var(--sb-pill-bg, rgba(255,255,255,0.06));
        color: var(--sb-pill-text, inherit);
        white-space: nowrap;
        line-height: 1;
        user-select: none;
      }

      .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      ha-icon {
        --mdc-icon-size: 18px;
        color: var(--sb-pill-icon, rgba(255,255,255,0.85));
      }

      .label {
        font-size: 12px;
        opacity: 0.9;
      }

      .value {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.2px;
      }

      .divider {
        width: 1px;
        height: 18px;
        background: var(--sb-divider, rgba(255,255,255,0.14));
        opacity: 0.9;
        border-radius: 2px;
      }

      .pill:focus-visible {
        outline: 2px solid rgba(255,255,255,0.25);
        outline-offset: 3px;
      }
    `;
  }
  _render(t = !0) {
    if (!this._root || !this._config) return;
    const e = this._root.querySelector(".card"), i = this._root.querySelector(".title"), s = this._root.querySelector(".header"), u = this._root.querySelector(".track"), a = this._root.querySelector(".user-css");
    this._config.pause_on_hover ? this.classList.add("pause-on-hover") : this.classList.remove("pause-on-hover"), this._config.title && this._config.title.trim().length > 0 ? (s.style.display = "flex", i.textContent = this._config.title) : (s.style.display = "none", i.textContent = ""), e.style.setProperty("--sb-bg", this._config.background || "transparent"), e.style.setProperty("--sb-text", this._config.text_color || "rgba(255,255,255,0.92)"), e.style.setProperty("--sb-divider", this._config.divider_color || "rgba(255,255,255,0.14)"), a.textContent = this._config.css ? this._config.css : "";
    const n = this._config.entities && this._config.entities.length > 0 ? this._config.entities : x;
    t ? (u.innerHTML = this._renderItemsHtml(n, !1), requestAnimationFrame(() => this._recalcMarquee(n))) : (u.innerHTML = this._renderItemsHtml(n, this._needsMarquee), requestAnimationFrame(() => this._recalcMarquee(n)));
  }
  _recalcMarquee(t) {
    if (!this._root || !this._config) return;
    const e = this._root.querySelector(".viewport"), i = this._root.querySelector(".track"), s = t || (this._config.entities && this._config.entities.length > 0 ? this._config.entities : x);
    if (!i.firstElementChild) return;
    const u = i.getAttribute("data-duplicated") === "true", a = u ? i.scrollWidth / 2 : i.scrollWidth, n = e.clientWidth, o = a > n + 8;
    if (this._needsMarquee = o, !o) {
      u && (i.innerHTML = this._renderItemsHtml(s, !1), i.setAttribute("data-duplicated", "false")), i.classList.remove("marquee"), i.classList.add("centered"), i.style.removeProperty("--sb-shift"), i.style.removeProperty("--sb-duration");
      return;
    }
    u || (i.innerHTML = this._renderItemsHtml(s, !0), i.setAttribute("data-duplicated", "true"));
    const r = i.scrollWidth / 2, c = typeof this._config.speed == "number" ? m(this._config.speed, 10, 300) : 40, p = Math.max(6, r / c);
    i.classList.add("marquee"), i.classList.remove("centered"), i.style.setProperty("--sb-shift", `${r}px`), i.style.setProperty("--sb-duration", `${p}s`);
  }
  _renderItemsHtml(t, e) {
    const i = e ? [...t, ...t] : t, s = !!this._config.divider, u = [];
    for (let a = 0; a < i.length; a++) {
      const n = i[a], o = this._getLabel(n), { valueText: r, unitText: c } = this._getValue(n), p = this._getIcon(n), _ = y(n.bg_color) ? n.bg_color : "rgba(255,255,255,0.06)", b = y(n.text_color) ? n.text_color : "", f = y(n.icon_color) ? n.icon_color : "", T = n.entity_id.startsWith("demo.") ? "" : `data-entity="${n.entity_id}" tabindex="0" role="button"`;
      u.push(`
        <div class="pill"
          style="
            --sb-pill-bg: ${_};
            ${b ? `--sb-pill-text:${b};` : ""}
            ${f ? `--sb-pill-icon:${f};` : ""}
          "
          ${T}
        >
          <span class="icon"><ha-icon icon="${p}"></ha-icon></span>
          <span class="label">${this._escape(o)}</span>
          <span class="value">${this._escape(r)}${c ? `<span style="opacity:.75;font-weight:700;margin-left:2px">${this._escape(c)}</span>` : ""}</span>
        </div>
      `), s && a < i.length - 1 && u.push('<div class="divider" aria-hidden="true"></div>');
    }
    return requestAnimationFrame(() => this._wireInteractions()), u.join("");
  }
  _wireInteractions() {
    if (!this._root) return;
    const t = this._root.querySelector(".track");
    t.__wired || (t.__wired = !0, t.addEventListener("click", (e) => {
      const s = e.target.closest(".pill")?.getAttribute("data-entity");
      s && this._openMoreInfo(s);
    }), t.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const s = e.target.closest(".pill")?.getAttribute("data-entity");
      s && (e.preventDefault(), this._openMoreInfo(s));
    }));
  }
  _openMoreInfo(t) {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId: t },
        bubbles: !0,
        composed: !0
      })
    );
  }
  _getLabel(t) {
    return t.label && t.label.trim().length ? t.label.trim() : !this._hass || t.entity_id.startsWith("demo.") ? t.entity_id.replace("demo.", "").replace(/_/g, " ") : this._hass.states[t.entity_id]?.attributes?.friendly_name || t.entity_id;
  }
  _getIcon(t) {
    if (t.icon && t.icon.trim().length) return t.icon.trim();
    if (!this._hass || t.entity_id.startsWith("demo.")) return "mdi:information-outline";
    const i = this._hass.states[t.entity_id]?.attributes?.icon;
    return typeof i == "string" && i ? i : "mdi:information-outline";
  }
  _getValue(t) {
    if (t.entity_id.startsWith("demo."))
      return t.entity_id.includes("temperature") ? { valueText: "18.3", unitText: "°C" } : t.entity_id.includes("lights") ? { valueText: "3", unitText: "" } : t.entity_id.includes("security") ? { valueText: "Armed", unitText: "" } : t.entity_id.includes("network") ? { valueText: "Online", unitText: "" } : { valueText: "—", unitText: "" };
    if (!this._hass) return { valueText: "—", unitText: "" };
    const e = this._hass.states[t.entity_id];
    if (!e || ["unknown", "unavailable", "none"].includes(e.state)) return { valueText: "—", unitText: "" };
    const i = e.attributes?.unit_of_measurement, s = e.attributes?.device_class, u = Number(e.state);
    return isNaN(u) ? { valueText: `${e.state}`, unitText: typeof i == "string" ? i : "" } : {
      valueText: `${Math.round(u * 10) / 10}`,
      unitText: typeof i == "string" ? i : s === "temperature" ? "°C" : ""
    };
  }
  _escape(t) {
    return t.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
}
const w = "scrolling-banner-card";
customElements.get(w) || customElements.define(w, A);
function h(l, t) {
  return Array.isArray(l) ? l : t;
}
function k(l, t, e) {
  return Math.max(t, Math.min(e, l));
}
function d(l, t = "") {
  return typeof l == "string" ? l : t;
}
function E(l, t = !1) {
  return typeof l == "boolean" ? l : t;
}
function $(l, t = 0) {
  return typeof l == "number" && !Number.isNaN(l) ? l : t;
}
function v(l, t) {
  if (!l) return t;
  const e = l.trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(e) ? e : t;
}
function I(l) {
  try {
    const t = window.CSS?.escape;
    return typeof t == "function" ? t(l) : l;
  } catch {
    return l;
  }
}
class q extends HTMLElement {
  constructor() {
    super(...arguments), this._activeEntityIdx = 0, this._showEntityCode = !1;
  }
  setConfig(t) {
    const e = t ?? {};
    this._config = {
      type: "custom:scrolling-banner-card",
      title: d(e.title, ""),
      entities: h(e.entities, []),
      speed: k($(e.speed, 40), 10, 300),
      pause_on_hover: E(e.pause_on_hover, !0),
      divider: E(e.divider, !0),
      background: d(e.background, "transparent"),
      text_color: d(e.text_color, "rgba(255,255,255,0.92)"),
      divider_color: d(e.divider_color, "rgba(255,255,255,0.14)"),
      css: d(e.css, "")
    }, this._clampActiveIdx(), this._ensureRoot(), this._render();
  }
  set hass(t) {
    this._hass = t, this._syncPickers();
  }
  connectedCallback() {
    this._ensureRoot(), this._config || (this._config = {
      type: "custom:scrolling-banner-card",
      title: "",
      entities: [],
      speed: 40,
      pause_on_hover: !0,
      divider: !0,
      background: "transparent",
      text_color: "rgba(255,255,255,0.92)",
      divider_color: "rgba(255,255,255,0.14)",
      css: ""
    }, this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: !0,
        composed: !0
      })
    )), this._clampActiveIdx(), this._render();
  }
  // ---------- Entity tab helpers ----------
  _clampActiveIdx() {
    const t = h(this._config?.entities, []);
    if (t.length === 0) {
      this._activeEntityIdx = 0;
      return;
    }
    this._activeEntityIdx < 0 && (this._activeEntityIdx = 0), this._activeEntityIdx > t.length - 1 && (this._activeEntityIdx = t.length - 1);
  }
  _setActiveEntityIdx(t) {
    this._activeEntityIdx = t, this._clampActiveIdx(), this._render();
  }
  _toggleEntityCode() {
    this._showEntityCode = !this._showEntityCode, this._render();
  }
  _entityToCode(t) {
    return JSON.stringify(
      {
        entity_id: d(t.entity_id, ""),
        label: d(t.label, ""),
        icon: d(t.icon, ""),
        bg_color: d(t.bg_color, ""),
        icon_color: d(t.icon_color, ""),
        text_color: d(t.text_color, "")
      },
      null,
      2
    );
  }
  _codeToEntity(t) {
    try {
      const e = JSON.parse(t);
      return !e || typeof e != "object" ? null : {
        entity_id: d(e.entity_id, ""),
        label: d(e.label, ""),
        icon: d(e.icon, ""),
        bg_color: d(e.bg_color, ""),
        icon_color: d(e.icon_color, ""),
        text_color: d(e.text_color, "")
      };
    } catch {
      return null;
    }
  }
  _escapeText(t) {
    return t.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }
  async _copyActiveEntityCode() {
    if (!this._config) return;
    const e = h(this._config.entities, [])[this._activeEntityIdx];
    if (!e) return;
    const i = this._entityToCode(e);
    await navigator.clipboard.writeText(i);
  }
  async _applyActiveEntityCodeFromTextareaOrClipboard() {
    if (!this._root || !this._config) return;
    const t = h(this._config.entities, []);
    if (!t[this._activeEntityIdx]) return;
    const e = this._root.querySelector("#entity_code"), i = e?.value?.trim() ? e.value : await (async () => {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return "";
      }
    })(), s = this._codeToEntity(i);
    if (!s) {
      alert("Could not parse entity JSON. Make sure it is valid JSON.");
      return;
    }
    const u = t.slice();
    u[this._activeEntityIdx] = s, this._update({ entities: u });
  }
  _deleteActiveEntity() {
    if (!this._config) return;
    const t = h(this._config.entities, []);
    t.length !== 0 && (t.splice(this._activeEntityIdx, 1), this._activeEntityIdx = Math.max(0, this._activeEntityIdx - 1), this._update({ entities: t }));
  }
  _addEntityAndFocus() {
    if (!this._config) return;
    const t = h(this._config.entities, []);
    t.push({ entity_id: "" }), this._activeEntityIdx = t.length - 1, this._update({ entities: t });
  }
  // ---------- UI ----------
  _ensureRoot() {
    this._root || (this._root = this.attachShadow({ mode: "open" }), this._root.innerHTML = `
      <style>
        :host { display:block; }
        .wrap { padding: 12px; }

        .row { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
        .row > * { flex: 1 1 220px; }

        .section {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        .h { font-size: 12px; opacity: .8; margin: 0 0 10px 0; font-weight: 700; letter-spacing:.2px; }
        .small { font-size:12px; opacity:.8; }

        input[type="text"], input[type="number"], textarea {
          width: 100%;
          padding: 10px 10px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(0,0,0,0.12);
          color: inherit;
          box-sizing: border-box;
          outline: none;
        }

        input[type="checkbox"] { transform: scale(1.1); }

        .btn {
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(0,0,0,0.10);
          cursor: pointer;
          user-select:none;
        }

        .entity-card {
          padding: 12px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(0,0,0,0.08);
        }

        .entity-title {
          font-weight: 700;
          font-size: 12px;
          opacity: .9;
        }

        .remove {
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,80,80,0.14);
          cursor:pointer;
        }

        .grid2 {
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 560px) {
          .grid2 { grid-template-columns: 1fr; }
        }

        .colorRow {
          display:flex;
          gap: 10px;
          align-items: center;
        }
        .colorRow input[type="color"]{
          width: 44px;
          height: 38px;
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
        }

        .picker {
          width:100%;
          min-width: 220px;
        }

        /* Tabs */
        .tabs {
          display: flex;
          gap: 8px;
          align-items: center;
          margin: 8px 0 12px;
          flex-wrap: wrap;
        }

        .tab {
          min-width: 34px;
          height: 34px;
          padding: 0 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(0,0,0,0.10);
          color: inherit;
          cursor: pointer;
          font-weight: 700;
          opacity: 0.85;
        }

        .tab.active {
          opacity: 1;
          border-color: rgba(255,255,255,0.30);
          background: rgba(255,255,255,0.08);
        }

        .tab.add {
          font-size: 18px;
          line-height: 1;
          padding: 0 12px;
        }

        .entity-toolbar {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .entity-toolbar .left {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .codebox {
          width: 100%;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 12px;
          line-height: 1.35;
        }

        .iconbtn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(0,0,0,0.10);
          color: inherit;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          letter-spacing: -0.5px;
          user-select: none;
        }

        .iconbtn.active {
          border-color: rgba(255,255,255,0.30);
          background: rgba(255,255,255,0.08);
        }
      </style>
      <div class="wrap"></div>
    `);
  }
  _render() {
    if (!this._root) return;
    const t = this._root.querySelector(".wrap"), e = this._root.activeElement, i = e?.id || "", s = typeof e?.selectionStart == "number" ? e.selectionStart : null, u = typeof e?.selectionEnd == "number" ? e.selectionEnd : null, a = this._config;
    if (!a) {
      t.innerHTML = '<div class="small">Loading…</div>';
      return;
    }
    const n = h(a.entities, []);
    this._clampActiveIdx();
    const o = n.length > 0, r = this._activeEntityIdx, c = o ? n[r] : void 0;
    if (t.innerHTML = `
      <div class="row">
        <div>
          <div class="h">Title (optional)</div>
          <input id="title" type="text" value="${d(a.title, "")}" placeholder="e.g. Status" />
        </div>
        <div>
          <div class="h">Speed (px/sec)</div>
          <input id="speed" type="number" min="10" max="300" step="1" value="${$(a.speed, 40)}" />
        </div>
      </div>

      <div class="row" style="margin-top:10px;">
        <label class="small"><input id="pause_on_hover" type="checkbox" ${a.pause_on_hover ? "checked" : ""}/> Pause on hover</label>
        <label class="small"><input id="divider" type="checkbox" ${a.divider ? "checked" : ""}/> Dividers</label>
      </div>

      <div class="section">
        <div class="h">Global styling</div>

        <div class="grid2">
          <div>
            <div class="h">Background</div>
            <div class="colorRow">
              <input id="background_picker" type="color" value="${v(a.background, "#000000")}" />
              <input id="background" type="text" value="${d(a.background, "")}" placeholder="e.g. rgba(0,0,0,0.2) or #121212" />
            </div>
          </div>

          <div>
            <div class="h">Text color</div>
            <div class="colorRow">
              <input id="text_color_picker" type="color" value="${v(a.text_color, "#ffffff")}" />
              <input id="text_color" type="text" value="${d(a.text_color, "")}" placeholder="e.g. rgba(255,255,255,0.92)" />
            </div>
          </div>

          <div>
            <div class="h">Divider color</div>
            <div class="colorRow">
              <input id="divider_color_picker" type="color" value="${v(a.divider_color, "#ffffff")}" />
              <input id="divider_color" type="text" value="${d(a.divider_color, "")}" placeholder="e.g. rgba(255,255,255,0.14)" />
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="h">Entities</div>

        <div class="tabs" id="entity_tabs">
          ${n.map(
      (p, _) => `<button class="tab ${_ === r ? "active" : ""}" data-tab="${_}" type="button">${_ + 1}</button>`
    ).join("")}
          <button class="tab add" id="add_entity_tab" type="button">+</button>
        </div>

        ${o ? `
              <div class="entity-card" data-idx="${r}">
                <div class="entity-toolbar">
                  <div class="left">
                    <div class="entity-title">Item ${r + 1}</div>
                  </div>
                  <div class="left">
                    <button class="iconbtn ${this._showEntityCode ? "active" : ""}" id="toggle_entity_code" type="button" title="Show/hide entity JSON">
                      &lt;/&gt;
                    </button>
                    <button class="btn" id="copy_entity" type="button">Copy</button>
                    <button class="btn" id="paste_entity" type="button">Paste</button>
                    <button class="remove" id="delete_entity" type="button">Delete</button>
                  </div>
                </div>

                ${this._showEntityCode ? `
                      <div class="h">Entity JSON (copy/paste)</div>
                      <textarea id="entity_code" class="codebox" rows="8" spellcheck="false">${this._escapeText(
      this._entityToCode(c)
    )}</textarea>
                    ` : ""}

                <div class="small" style="margin:10px 0 6px;">Form fields (kept in sync)</div>

                <div class="grid2">
                  <div class="picker">
                    <div class="h">Entity</div>
                    <div data-picker="entity" data-idx="${r}"></div>
                    <input id="entity_id_${r}" type="text" value="${d(c.entity_id, "")}" placeholder="sensor.temperature" style="margin-top:8px;" />
                  </div>

                  <div class="picker">
                    <div class="h">Icon</div>
                    <div data-picker="icon" data-idx="${r}"></div>
                    <input id="icon_${r}" type="text" value="${d(c.icon, "")}" placeholder="mdi:information-outline" style="margin-top:8px;" />
                  </div>

                  <div>
                    <div class="h">Label</div>
                    <input id="label_${r}" type="text" value="${d(c.label, "")}" placeholder="Optional label override" />
                  </div>

                  <div>
                    <div class="h">Pill background</div>
                    <div class="colorRow">
                      <input id="bg_color_picker_${r}" type="color" value="${v(c.bg_color, "#202020")}" />
                      <input id="bg_color_${r}" type="text" value="${d(c.bg_color, "")}" placeholder="e.g. rgba(255,255,255,0.06)" />
                    </div>
                  </div>

                  <div>
                    <div class="h">Icon color</div>
                    <div class="colorRow">
                      <input id="icon_color_picker_${r}" type="color" value="${v(c.icon_color, "#ffffff")}" />
                      <input id="icon_color_${r}" type="text" value="${d(c.icon_color, "")}" placeholder="e.g. #FFD966" />
                    </div>
                  </div>

                  <div>
                    <div class="h">Text color</div>
                    <div class="colorRow">
                      <input id="text_color_picker_${r}" type="color" value="${v(c.text_color, "#ffffff")}" />
                      <input id="text_color_${r}" type="text" value="${d(c.text_color, "")}" placeholder="Overrides pill text only" />
                    </div>
                  </div>
                </div>
              </div>
            ` : '<div class="small">No entities yet. Press <b>+</b> to add one.</div>'}
      </div>

      <div class="section">
        <div class="h">Advanced</div>
        <div class="small" style="margin-bottom:8px;">Custom CSS injected into the card shadow root.</div>
        <textarea id="css" rows="6" placeholder="e.g. .pill { border-radius: 16px; }">${d(a.css, "")}</textarea>
      </div>
    `, this._wire(), this._syncPickers(), i) {
      const p = I(i), _ = this._root.querySelector(`#${p}`);
      _ && typeof _.focus == "function" && (_.focus(), s !== null && u !== null && typeof _.setSelectionRange == "function" && _.setSelectionRange(s, u));
    }
  }
  _wire() {
    if (!this._root || !this._config) return;
    const t = (o, r, c) => {
      const p = this._root.querySelector(o);
      p && p.addEventListener(r, c);
    };
    t("#title", "input", (o) => this._update({ title: o.target.value })), t("#speed", "input", (o) => this._update({ speed: k(Number(o.target.value), 10, 300) })), t("#pause_on_hover", "change", (o) => this._update({ pause_on_hover: o.target.checked })), t("#divider", "change", (o) => this._update({ divider: o.target.checked })), t("#background_picker", "input", (o) => {
      const r = o.target.value;
      this._root.querySelector("#background").value = r, this._update({ background: r });
    }), t("#background", "input", (o) => this._update({ background: o.target.value })), t("#text_color_picker", "input", (o) => {
      const r = o.target.value;
      this._root.querySelector("#text_color").value = r, this._update({ text_color: r });
    }), t("#text_color", "input", (o) => this._update({ text_color: o.target.value })), t("#divider_color_picker", "input", (o) => {
      const r = o.target.value;
      this._root.querySelector("#divider_color").value = r, this._update({ divider_color: r });
    }), t("#divider_color", "input", (o) => this._update({ divider_color: o.target.value })), t("#css", "input", (o) => this._update({ css: o.target.value }));
    const e = this._root.querySelector("#entity_tabs");
    e && !e.__wired && (e.__wired = !0, e.addEventListener("click", (o) => {
      const r = o.target.closest("button.tab");
      if (!r) return;
      const c = r.getAttribute("data-tab");
      c !== null && this._setActiveEntityIdx(Number(c));
    })), t("#add_entity_tab", "click", () => this._addEntityAndFocus()), t("#toggle_entity_code", "click", () => this._toggleEntityCode()), t("#copy_entity", "click", async () => {
      try {
        await this._copyActiveEntityCode();
      } catch {
        alert("Copy failed (clipboard permissions).");
      }
    }), t("#paste_entity", "click", async () => {
      try {
        await this._applyActiveEntityCodeFromTextareaOrClipboard();
      } catch {
        alert("Paste failed (clipboard permissions).");
      }
    }), t("#delete_entity", "click", () => this._deleteActiveEntity()), t("#entity_code", "change", () => this._applyActiveEntityCodeFromTextareaOrClipboard());
    const i = h(this._config.entities, []), s = this._activeEntityIdx;
    if (!i[s]) return;
    const a = (o, r) => {
      const c = i.slice();
      c[s] = { ...c[s], [o]: r }, this._update({ entities: c });
    };
    t(`#entity_id_${s}`, "input", (o) => a("entity_id", o.target.value)), t(`#label_${s}`, "input", (o) => a("label", o.target.value)), t(`#icon_${s}`, "input", (o) => a("icon", o.target.value)), t(`#bg_color_${s}`, "input", (o) => a("bg_color", o.target.value)), t(`#icon_color_${s}`, "input", (o) => a("icon_color", o.target.value)), t(`#text_color_${s}`, "input", (o) => a("text_color", o.target.value));
    const n = (o, r, c) => {
      const p = this._root.querySelector(o), _ = this._root.querySelector(r);
      !p || !_ || p.addEventListener("input", () => {
        _.value = p.value, a(c, p.value);
      });
    };
    n(`#bg_color_picker_${s}`, `#bg_color_${s}`, "bg_color"), n(`#icon_color_picker_${s}`, `#icon_color_${s}`, "icon_color"), n(`#text_color_picker_${s}`, `#text_color_${s}`, "text_color");
  }
  _syncPickers() {
    if (!this._root || !this._config) return;
    const t = h(this._config.entities, []), e = this._hass, i = this._activeEntityIdx, s = t[i];
    if (!s) return;
    const u = this._root.querySelector(`[data-picker="entity"][data-idx="${i}"]`);
    if (u && u.childElementCount === 0 && customElements.get("ha-entity-picker")) {
      const n = document.createElement("ha-entity-picker");
      n.className = "picker", e && (n.hass = e), n.value = s.entity_id || "", n.setAttribute("allow-custom-entity", ""), n.addEventListener("value-changed", (o) => {
        const r = o?.detail?.value ?? "", c = this._root.querySelector(`#entity_id_${i}`);
        c && (c.value = r);
        const p = h(this._config.entities, []).slice();
        p[i] = { ...p[i], entity_id: r }, this._update({ entities: p });
      }), u.appendChild(n);
    } else if (u && u.firstElementChild) {
      const n = u.firstElementChild;
      e && (n.hass = e), n.value = s.entity_id || "";
    }
    const a = this._root.querySelector(`[data-picker="icon"][data-idx="${i}"]`);
    if (a && a.childElementCount === 0 && customElements.get("ha-icon-picker")) {
      const n = document.createElement("ha-icon-picker");
      n.className = "picker", e && (n.hass = e), n.value = s.icon || "", n.addEventListener("value-changed", (o) => {
        const r = o?.detail?.value ?? "", c = this._root.querySelector(`#icon_${i}`);
        c && (c.value = r);
        const p = h(this._config.entities, []).slice();
        p[i] = { ...p[i], icon: r }, this._update({ entities: p });
      }), a.appendChild(n);
    } else if (a && a.firstElementChild) {
      const n = a.firstElementChild;
      e && (n.hass = e), n.value = s.icon || "";
    }
  }
  _update(t) {
    this._config && (this._config = { ...this._config, ...t }, this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: !0,
        composed: !0
      })
    ), this._render());
  }
}
const C = "scrolling-banner-card-editor";
customElements.get(C) || customElements.define(C, q);
const S = window;
S.__SBC_LOADED__ || (S.__SBC_LOADED__ = !0, console.info("Scrolling Banner Card v0.1.0 loaded"));
window.customCards.push({
  type: "custom:scrolling-banner-card",
  name: "Scrolling Banner Card",
  description: "A responsive scrolling banner showing entity states.",
  preview: !1
});
