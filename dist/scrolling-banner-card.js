const y = [
  { entity_id: "demo.temperature_outside", label: "Outside", icon: "mdi:sun-thermometer-outline" },
  { entity_id: "demo.temperature_inside", label: "Inside", icon: "mdi:home-thermometer-outline" },
  { entity_id: "demo.lights_on", label: "Lights", icon: "mdi:lightbulb-outline" },
  { entity_id: "demo.security", label: "Security", icon: "mdi:shield-outline" },
  { entity_id: "demo.network", label: "Network", icon: "mdi:wifi" }
];
function x(c, t, e) {
  return Math.max(t, Math.min(e, c));
}
function g(c, t = "") {
  return typeof c == "string" ? c : t;
}
function f(c) {
  return typeof c == "string" && c.trim().length > 0;
}
class C extends HTMLElement {
  constructor() {
    super(...arguments), this._needsMarquee = !1;
  }
  setConfig(t) {
    const e = t ?? {};
    typeof e.type == "string" && e.type.trim(), this._config = {
      type: "custom:scrolling-banner-card",
      title: typeof e.title == "string" ? e.title : void 0,
      entities: Array.isArray(e.entities) ? e.entities : void 0,
      speed: typeof e.speed == "number" ? x(e.speed, 10, 300) : 40,
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
      // No entities provided on purpose:
      // the card will fall back to DEMO_ITEMS for the preview.
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
    const e = this._root.querySelector(".card"), i = this._root.querySelector(".title"), r = this._root.querySelector(".header"), a = this._root.querySelector(".track"), s = this._root.querySelector(".user-css");
    this._config.pause_on_hover ? this.classList.add("pause-on-hover") : this.classList.remove("pause-on-hover"), this._config.title && this._config.title.trim().length > 0 ? (r.style.display = "flex", i.textContent = this._config.title) : (r.style.display = "none", i.textContent = ""), e.style.setProperty("--sb-bg", this._config.background || "transparent"), e.style.setProperty("--sb-text", this._config.text_color || "rgba(255,255,255,0.92)"), e.style.setProperty("--sb-divider", this._config.divider_color || "rgba(255,255,255,0.14)"), s.textContent = this._config.css ? this._config.css : "";
    const o = this._config.entities && this._config.entities.length > 0 ? this._config.entities : y;
    t ? (a.innerHTML = this._renderItemsHtml(o, !1), requestAnimationFrame(() => this._recalcMarquee(o))) : (a.innerHTML = this._renderItemsHtml(o, this._needsMarquee), requestAnimationFrame(() => this._recalcMarquee(o)));
  }
  _recalcMarquee(t) {
    if (!this._root || !this._config) return;
    const e = this._root.querySelector(".viewport"), i = this._root.querySelector(".track"), r = t || (this._config.entities && this._config.entities.length > 0 ? this._config.entities : y);
    if (!i.firstElementChild) return;
    const a = i.getAttribute("data-duplicated") === "true", s = a ? i.scrollWidth / 2 : i.scrollWidth, o = e.clientWidth, l = s > o + 8;
    if (this._needsMarquee = l, !l) {
      a && (i.innerHTML = this._renderItemsHtml(r, !1), i.setAttribute("data-duplicated", "false")), i.classList.remove("marquee"), i.classList.add("centered"), i.style.removeProperty("--sb-shift"), i.style.removeProperty("--sb-duration");
      return;
    }
    a || (i.innerHTML = this._renderItemsHtml(r, !0), i.setAttribute("data-duplicated", "true"));
    const n = i.scrollWidth / 2, d = typeof this._config.speed == "number" ? x(this._config.speed, 10, 300) : 40, p = Math.max(6, n / d);
    i.classList.add("marquee"), i.classList.remove("centered"), i.style.setProperty("--sb-shift", `${n}px`), i.style.setProperty("--sb-duration", `${p}s`);
  }
  _renderItemsHtml(t, e) {
    const i = e ? [...t, ...t] : t, r = !!this._config.divider, a = [];
    for (let s = 0; s < i.length; s++) {
      const o = i[s], l = this._getLabel(o), { valueText: n, unitText: d } = this._getValue(o), p = this._getIcon(o), v = f(o.bg_color) ? o.bg_color : "rgba(255,255,255,0.06)", b = f(o.text_color) ? o.text_color : "", m = f(o.icon_color) ? o.icon_color : "", q = o.entity_id.startsWith("demo.") ? "" : `data-entity="${o.entity_id}" tabindex="0" role="button"`;
      a.push(`
        <div class="pill"
          style="
            --sb-pill-bg: ${v};
            ${b ? `--sb-pill-text:${b};` : ""}
            ${m ? `--sb-pill-icon:${m};` : ""}
          "
          ${q}
        >
          <span class="icon"><ha-icon icon="${p}"></ha-icon></span>
          <span class="label">${this._escape(l)}</span>
          <span class="value">${this._escape(n)}${d ? `<span style="opacity:.75;font-weight:700;margin-left:2px">${this._escape(d)}</span>` : ""}</span>
        </div>
      `), r && s < i.length - 1 && a.push('<div class="divider" aria-hidden="true"></div>');
    }
    return requestAnimationFrame(() => this._wireInteractions()), a.join("");
  }
  _wireInteractions() {
    if (!this._root) return;
    const t = this._root.querySelector(".track");
    t.__wired || (t.__wired = !0, t.addEventListener("click", (e) => {
      const r = e.target.closest(".pill")?.getAttribute("data-entity");
      r && this._openMoreInfo(r);
    }), t.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const r = e.target.closest(".pill")?.getAttribute("data-entity");
      r && (e.preventDefault(), this._openMoreInfo(r));
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
    const i = e.attributes?.unit_of_measurement, r = e.attributes?.device_class, a = Number(e.state);
    return isNaN(a) ? { valueText: `${e.state}`, unitText: typeof i == "string" ? i : "" } : {
      valueText: `${Math.round(a * 10) / 10}`,
      unitText: typeof i == "string" ? i : r === "temperature" ? "°C" : ""
    };
  }
  _escape(t) {
    return t.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
}
const k = "scrolling-banner-card";
customElements.get(k) || customElements.define(k, C);
function h(c, t) {
  return Array.isArray(c) ? c : t;
}
function w(c, t, e) {
  return Math.max(t, Math.min(e, c));
}
function u(c, t = "") {
  return typeof c == "string" ? c : t;
}
function $(c, t = !1) {
  return typeof c == "boolean" ? c : t;
}
function E(c, t = 0) {
  return typeof c == "number" && !Number.isNaN(c) ? c : t;
}
function _(c, t) {
  if (!c) return t;
  const e = c.trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(e) ? e : t;
}
function T(c) {
  try {
    const t = window.CSS?.escape;
    return typeof t == "function" ? t(c) : c;
  } catch {
    return c;
  }
}
class A extends HTMLElement {
  setConfig(t) {
    const e = t ?? {};
    this._config = {
      type: "custom:scrolling-banner-card",
      title: u(e.title, ""),
      entities: h(e.entities, []),
      speed: w(E(e.speed, 40), 10, 300),
      pause_on_hover: $(e.pause_on_hover, !0),
      divider: $(e.divider, !0),
      background: u(e.background, "transparent"),
      text_color: u(e.text_color, "rgba(255,255,255,0.92)"),
      divider_color: u(e.divider_color, "rgba(255,255,255,0.14)"),
      css: u(e.css, "")
    }, this._ensureRoot(), this._render();
  }
  set hass(t) {
    this._hass = t, this._syncPickers();
  }
  connectedCallback() {
    this._ensureRoot(), this._render();
  }
  _ensureRoot() {
    this._root || (this._root = this.attachShadow({ mode: "open" }), this._root.innerHTML = `
      <style>
        :host { display:block; }
        .wrap {
          padding: 12px;
        }

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

        .entities {
          display:flex;
          flex-direction: column;
          gap: 12px;
        }

        .entity-card {
          padding: 12px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(0,0,0,0.08);
        }

        .entity-head {
          display:flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .entity-title {
          font-weight: 700;
          font-size: 12px;
          opacity: .9;
        }

        .remove {
          padding: 6px 10px;
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
      </style>
      <div class="wrap"></div>
    `);
  }
  _render() {
    if (!this._root) return;
    const t = this._root.querySelector(".wrap"), e = this._root.activeElement, i = e?.id || "", r = typeof e?.selectionStart == "number" ? e.selectionStart : null, a = typeof e?.selectionEnd == "number" ? e.selectionEnd : null, s = this._config;
    if (!s) {
      t.innerHTML = '<div class="small">No config yet. Add the card, then open the editor.</div>';
      return;
    }
    const o = h(s.entities, []);
    if (t.innerHTML = `
      <div class="row">
        <div>
          <div class="h">Title (optional)</div>
          <input id="title" type="text" value="${u(s.title, "")}" placeholder="e.g. Status" />
        </div>
        <div>
          <div class="h">Speed (px/sec)</div>
          <input id="speed" type="number" min="10" max="300" step="1" value="${E(s.speed, 40)}" />
        </div>
      </div>

      <div class="row" style="margin-top:10px;">
        <label class="small"><input id="pause_on_hover" type="checkbox" ${s.pause_on_hover ? "checked" : ""}/> Pause on hover</label>
        <label class="small"><input id="divider" type="checkbox" ${s.divider ? "checked" : ""}/> Dividers</label>
      </div>

      <div class="section">
        <div class="h">Global styling</div>

        <div class="grid2">
          <div>
            <div class="h">Background</div>
            <div class="colorRow">
              <input id="background_picker" type="color" value="${_(s.background, "#000000")}" />
              <input id="background" type="text" value="${u(s.background, "")}" placeholder="e.g. rgba(0,0,0,0.2) or #121212" />
            </div>
          </div>

          <div>
            <div class="h">Text color</div>
            <div class="colorRow">
              <input id="text_color_picker" type="color" value="${_(s.text_color, "#ffffff")}" />
              <input id="text_color" type="text" value="${u(s.text_color, "")}" placeholder="e.g. rgba(255,255,255,0.92)" />
            </div>
          </div>

          <div>
            <div class="h">Divider color</div>
            <div class="colorRow">
              <input id="divider_color_picker" type="color" value="${_(s.divider_color, "#ffffff")}" />
              <input id="divider_color" type="text" value="${u(s.divider_color, "")}" placeholder="e.g. rgba(255,255,255,0.14)" />
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="h">Entities</div>
        <div style="margin-bottom:10px;">
          <button class="btn" id="add_entity">+ Add entity</button>
        </div>
        <div class="entities">
          ${o.map(
      (l, n) => `
            <div class="entity-card" data-idx="${n}">
              <div class="entity-head">
                <div class="entity-title">Item ${n + 1}</div>
                <button class="remove" data-action="remove" data-idx="${n}">Remove</button>
              </div>

              <div class="grid2">
                <div class="picker">
                  <div class="h">Entity</div>
                  <div data-picker="entity" data-idx="${n}"></div>
                  <input id="entity_id_${n}" type="text" value="${u(l.entity_id, "")}" placeholder="sensor.temperature" style="margin-top:8px;" />
                </div>

                <div class="picker">
                  <div class="h">Icon</div>
                  <div data-picker="icon" data-idx="${n}"></div>
                  <input id="icon_${n}" type="text" value="${u(l.icon, "")}" placeholder="mdi:information-outline" style="margin-top:8px;" />
                </div>

                <div>
                  <div class="h">Label</div>
                  <input id="label_${n}" type="text" value="${u(l.label, "")}" placeholder="Optional label override" />
                </div>

                <div>
                  <div class="h">Pill background</div>
                  <div class="colorRow">
                    <input id="bg_color_picker_${n}" type="color" value="${_(l.bg_color, "#202020")}" />
                    <input id="bg_color_${n}" type="text" value="${u(l.bg_color, "")}" placeholder="e.g. rgba(255,255,255,0.06)" />
                  </div>
                </div>

                <div>
                  <div class="h">Icon color</div>
                  <div class="colorRow">
                    <input id="icon_color_picker_${n}" type="color" value="${_(l.icon_color, "#ffffff")}" />
                    <input id="icon_color_${n}" type="text" value="${u(l.icon_color, "")}" placeholder="e.g. #FFD966" />
                  </div>
                </div>

                <div>
                  <div class="h">Text color</div>
                  <div class="colorRow">
                    <input id="text_color_picker_${n}" type="color" value="${_(l.text_color, "#ffffff")}" />
                    <input id="text_color_${n}" type="text" value="${u(l.text_color, "")}" placeholder="Overrides pill text only" />
                  </div>
                </div>
              </div>
            </div>
          `
    ).join("")}
        </div>
      </div>

      <div class="section">
        <div class="h">Advanced</div>
        <div class="small" style="margin-bottom:8px;">Custom CSS injected into the card shadow root.</div>
        <textarea id="css" rows="6" placeholder="e.g. .pill { border-radius: 16px; }">${u(s.css, "")}</textarea>
      </div>
    `, this._wire(), i) {
      const l = T(i), n = this._root.querySelector(`#${l}`);
      n && typeof n.focus == "function" && (n.focus(), r !== null && a !== null && typeof n.setSelectionRange == "function" && n.setSelectionRange(r, a));
    }
    this._syncPickers();
  }
  _wire() {
    if (!this._root || !this._config) return;
    const t = (i, r, a) => {
      const s = this._root.querySelector(i);
      s && s.addEventListener(r, a);
    };
    t("#title", "input", (i) => this._update({ title: i.target.value })), t("#speed", "input", (i) => this._update({ speed: w(Number(i.target.value), 10, 300) })), t("#pause_on_hover", "change", (i) => this._update({ pause_on_hover: i.target.checked })), t("#divider", "change", (i) => this._update({ divider: i.target.checked })), t("#background_picker", "input", (i) => {
      const r = i.target.value;
      this._root.querySelector("#background").value = r, this._update({ background: r });
    }), t("#background", "input", (i) => this._update({ background: i.target.value })), t("#text_color_picker", "input", (i) => {
      const r = i.target.value;
      this._root.querySelector("#text_color").value = r, this._update({ text_color: r });
    }), t("#text_color", "input", (i) => this._update({ text_color: i.target.value })), t("#divider_color_picker", "input", (i) => {
      const r = i.target.value;
      this._root.querySelector("#divider_color").value = r, this._update({ divider_color: r });
    }), t("#divider_color", "input", (i) => this._update({ divider_color: i.target.value })), t("#css", "input", (i) => this._update({ css: i.target.value })), t("#add_entity", "click", () => {
      const i = h(this._config.entities, []);
      i.push({ entity_id: "" }), this._update({ entities: i });
    }), this._root.querySelectorAll("[data-action='remove']").forEach((i) => {
      i.addEventListener("click", () => {
        const r = Number(i.getAttribute("data-idx")), a = h(this._config.entities, []);
        a.splice(r, 1), this._update({ entities: a });
      });
    }), h(this._config.entities, []).forEach((i, r) => {
      const a = (o, l) => {
        const n = this._root.querySelector(o);
        n && n.addEventListener("input", () => {
          const d = h(this._config.entities, []).slice();
          d[r] = { ...d[r], [l]: n.value }, this._update({ entities: d });
        });
      };
      a(`#entity_id_${r}`, "entity_id"), a(`#label_${r}`, "label"), a(`#icon_${r}`, "icon"), a(`#bg_color_${r}`, "bg_color"), a(`#icon_color_${r}`, "icon_color"), a(`#text_color_${r}`, "text_color");
      const s = (o, l, n) => {
        const d = this._root.querySelector(o), p = this._root.querySelector(l);
        !d || !p || d.addEventListener("input", () => {
          p.value = d.value;
          const v = h(this._config.entities, []).slice();
          v[r] = { ...v[r], [n]: d.value }, this._update({ entities: v });
        });
      };
      s(`#bg_color_picker_${r}`, `#bg_color_${r}`, "bg_color"), s(`#icon_color_picker_${r}`, `#icon_color_${r}`, "icon_color"), s(`#text_color_picker_${r}`, `#text_color_${r}`, "text_color");
    });
  }
  _syncPickers() {
    if (!this._root || !this._config) return;
    const t = h(this._config.entities, []), e = this._hass;
    t.forEach((i, r) => {
      const a = this._root.querySelector(`[data-picker="entity"][data-idx="${r}"]`);
      if (a && a.childElementCount === 0 && customElements.get("ha-entity-picker")) {
        const o = document.createElement("ha-entity-picker");
        o.className = "picker", e && (o.hass = e), o.value = i.entity_id || "", o.setAttribute("allow-custom-entity", ""), o.addEventListener("value-changed", (l) => {
          const n = l?.detail?.value ?? "", d = this._root.querySelector(`#entity_id_${r}`);
          d.value = n;
          const p = h(this._config.entities, []).slice();
          p[r] = { ...p[r], entity_id: n }, this._update({ entities: p });
        }), a.appendChild(o);
      } else if (a && a.firstElementChild) {
        const o = a.firstElementChild;
        e && (o.hass = e), o.value = i.entity_id || "";
      }
      const s = this._root.querySelector(`[data-picker="icon"][data-idx="${r}"]`);
      if (s && s.childElementCount === 0 && customElements.get("ha-icon-picker")) {
        const o = document.createElement("ha-icon-picker");
        o.className = "picker", e && (o.hass = e), o.value = i.icon || "", o.addEventListener("value-changed", (l) => {
          const n = l?.detail?.value ?? "", d = this._root.querySelector(`#icon_${r}`);
          d.value = n;
          const p = h(this._config.entities, []).slice();
          p[r] = { ...p[r], icon: n }, this._update({ entities: p });
        }), s.appendChild(o);
      } else if (s && s.firstElementChild) {
        const o = s.firstElementChild;
        e && (o.hass = e), o.value = i.icon || "";
      }
    });
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
const S = "scrolling-banner-card-editor";
customElements.get(S) || customElements.define(S, A);
window.customCards.push({
  type: "custom:scrolling-banner-card",
  name: "Scrolling Banner Card",
  description: "A responsive scrolling banner showing entity states.",
  preview: !1
});
