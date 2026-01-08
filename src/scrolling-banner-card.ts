type BannerEntity = {
  entity_id: string;
  label?: string;
  icon?: string;
  bg_color?: string;
  icon_color?: string;
  text_color?: string;
};

type ScrollingBannerConfig = {
  type: "custom:scrolling-banner-card";
  title?: string;

  entities?: BannerEntity[];

  speed?: number; // px/second
  pause_on_hover?: boolean;
  divider?: boolean;

  background?: string;
  text_color?: string;
  divider_color?: string;

  // Advanced: custom CSS injected into shadow root
  css?: string;
};

type Hass = {
  states: Record<
    string,
    {
      entity_id: string;
      state: string;
      attributes: Record<string, any>;
      last_changed: string;
      last_updated: string;
    }
  >;
  themes?: any;
};

const DEMO_ITEMS: BannerEntity[] = [
  { entity_id: "demo.temperature_outside", label: "Outside", icon: "mdi:sun-thermometer-outline" },
  { entity_id: "demo.temperature_inside", label: "Inside", icon: "mdi:home-thermometer-outline" },
  { entity_id: "demo.lights_on", label: "Lights", icon: "mdi:lightbulb-outline" },
  { entity_id: "demo.security", label: "Security", icon: "mdi:shield-outline" },
  { entity_id: "demo.network", label: "Network", icon: "mdi:wifi" },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeString(v: any, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function isValidColorString(v: any): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

class ScrollingBannerCard extends HTMLElement {
  private _config!: ScrollingBannerConfig;
  private _hass: Hass | undefined;

  private _root?: ShadowRoot;
  private _resizeObs?: ResizeObserver;

  private _needsMarquee = false;

  setConfig(config: ScrollingBannerConfig) {
    if (!config) throw new Error("Invalid configuration");

    this._config = {
      type: "custom:scrolling-banner-card",
      title: config.title,

      entities: Array.isArray(config.entities) ? config.entities : undefined,

      speed: typeof config.speed === "number" ? clamp(config.speed, 10, 300) : 40,
      pause_on_hover: typeof config.pause_on_hover === "boolean" ? config.pause_on_hover : true,
      divider: typeof config.divider === "boolean" ? config.divider : true,

      background: safeString(config.background, "transparent"),
      text_color: safeString(config.text_color, "rgba(255,255,255,0.92)"),
      divider_color: safeString(config.divider_color, "rgba(255,255,255,0.14)"),

      css: safeString(config.css, ""),
    };

    this._ensureRoot();
    this._render();
  }

  set hass(hass: Hass) {
    this._hass = hass;
    this._render(false);
  }

  static getConfigElement() {
    return document.createElement("scrolling-banner-card-editor");
  }

static getStubConfig(): ScrollingBannerConfig {
  return {
    type: "custom:scrolling-banner-card",
    title: "Scrolling Banner Card",
    speed: 40,
    pause_on_hover: true,
    divider: true,
    // No entities provided on purpose:
    // the card will fall back to DEMO_ITEMS for the preview.
  };
}


  connectedCallback() {
    this._ensureRoot();
    // If HA creates the element before calling setConfig (happens in picker previews),
    // we must not crash. Only render once config exists.
    if (this._config) this._render();
  }

  disconnectedCallback() {
    this._resizeObs?.disconnect();
    this._resizeObs = undefined;
  }

  private _ensureRoot() {
    if (this._root) return;
    this._root = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = this._baseCss();
    this._root.appendChild(style);

    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
      <div class="header" part="header">
        <div class="title" part="title"></div>
      </div>

      <div class="viewport" part="viewport">
        <div class="track" part="track"></div>
      </div>

      <style class="user-css"></style>
    `;
    this._root.appendChild(wrap);

    const viewport = this._root.querySelector(".viewport") as HTMLDivElement;
    this._resizeObs = new ResizeObserver(() => this._recalcMarquee());
    this._resizeObs.observe(viewport);
  }

  private _baseCss() {
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

  private _render(full = true) {
    if (!this._root || !this._config) return;

    const card = this._root.querySelector(".card") as HTMLDivElement;
    const titleEl = this._root.querySelector(".title") as HTMLDivElement;
    const header = this._root.querySelector(".header") as HTMLDivElement;
    const track = this._root.querySelector(".track") as HTMLDivElement;
    const userCss = this._root.querySelector(".user-css") as HTMLStyleElement;

    if (this._config.pause_on_hover) this.classList.add("pause-on-hover");
    else this.classList.remove("pause-on-hover");

    if (this._config.title && this._config.title.trim().length > 0) {
      header.style.display = "flex";
      titleEl.textContent = this._config.title;
    } else {
      header.style.display = "none";
      titleEl.textContent = "";
    }

    card.style.setProperty("--sb-bg", this._config.background || "transparent");
    card.style.setProperty("--sb-text", this._config.text_color || "rgba(255,255,255,0.92)");
    card.style.setProperty("--sb-divider", this._config.divider_color || "rgba(255,255,255,0.14)");

    userCss.textContent = this._config.css ? this._config.css : "";

    const entities =
      this._config.entities && this._config.entities.length > 0 ? this._config.entities : DEMO_ITEMS;

    if (full) {
      track.innerHTML = this._renderItemsHtml(entities, false);
      requestAnimationFrame(() => this._recalcMarquee(entities));
    } else {
      track.innerHTML = this._renderItemsHtml(entities, this._needsMarquee);
      requestAnimationFrame(() => this._recalcMarquee(entities));
    }
  }

  private _recalcMarquee(entitiesOverride?: BannerEntity[]) {
    if (!this._root || !this._config) return;

    const viewport = this._root.querySelector(".viewport") as HTMLDivElement;
    const track = this._root.querySelector(".track") as HTMLDivElement;

    const entities =
      entitiesOverride ||
      (this._config.entities && this._config.entities.length > 0 ? this._config.entities : DEMO_ITEMS);

    if (!track.firstElementChild) return;

    const isDuplicated = track.getAttribute("data-duplicated") === "true";
    const naturalWidth = isDuplicated ? track.scrollWidth / 2 : track.scrollWidth;
    const containerWidth = viewport.clientWidth;

    const needs = naturalWidth > containerWidth + 8;
    this._needsMarquee = needs;

    if (!needs) {
      if (isDuplicated) {
        track.innerHTML = this._renderItemsHtml(entities, false);
        track.setAttribute("data-duplicated", "false");
      }
      track.classList.remove("marquee");
      track.classList.add("centered");
      track.style.removeProperty("--sb-shift");
      track.style.removeProperty("--sb-duration");
      return;
    }

    if (!isDuplicated) {
      track.innerHTML = this._renderItemsHtml(entities, true);
      track.setAttribute("data-duplicated", "true");
    }

    const halfWidth = track.scrollWidth / 2;

    const speed = typeof this._config.speed === "number" ? clamp(this._config.speed, 10, 300) : 40;
    const duration = Math.max(6, halfWidth / speed);

    track.classList.add("marquee");
    track.classList.remove("centered");
    track.style.setProperty("--sb-shift", `${halfWidth}px`);
    track.style.setProperty("--sb-duration", `${duration}s`);
  }

  private _renderItemsHtml(entities: BannerEntity[], duplicated: boolean) {
    const items = duplicated ? [...entities, ...entities] : entities;

    const divider = !!this._config.divider;
    const parts: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const e = items[i];

      const label = this._getLabel(e);
      const { valueText, unitText } = this._getValue(e);
      const icon = this._getIcon(e);

      const pillBg = isValidColorString(e.bg_color) ? e.bg_color! : "rgba(255,255,255,0.06)";
      const pillText = isValidColorString(e.text_color) ? e.text_color! : "";
      const pillIcon = isValidColorString(e.icon_color) ? e.icon_color! : "";

      const isDemo = e.entity_id.startsWith("demo.");
      const tapAttr = isDemo ? "" : `data-entity="${e.entity_id}" tabindex="0" role="button"`;

      parts.push(`
        <div class="pill"
          style="
            --sb-pill-bg: ${pillBg};
            ${pillText ? `--sb-pill-text:${pillText};` : ""}
            ${pillIcon ? `--sb-pill-icon:${pillIcon};` : ""}
          "
          ${tapAttr}
        >
          <span class="icon"><ha-icon icon="${icon}"></ha-icon></span>
          <span class="label">${this._escape(label)}</span>
          <span class="value">${this._escape(valueText)}${
            unitText
              ? `<span style="opacity:.75;font-weight:700;margin-left:2px">${this._escape(unitText)}</span>`
              : ""
          }</span>
        </div>
      `);

      if (divider && i < items.length - 1) {
        parts.push(`<div class="divider" aria-hidden="true"></div>`);
      }
    }

    requestAnimationFrame(() => this._wireInteractions());
    return parts.join("");
  }

  private _wireInteractions() {
    if (!this._root) return;
    const track = this._root.querySelector(".track") as HTMLDivElement;

    if ((track as any).__wired) return;
    (track as any).__wired = true;

    track.addEventListener("click", (ev) => {
      const pill = (ev.target as HTMLElement).closest(".pill") as HTMLElement | null;
      const entity = pill?.getAttribute("data-entity");
      if (!entity) return;
      this._openMoreInfo(entity);
    });

    track.addEventListener("keydown", (ev: KeyboardEvent) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      const pill = (ev.target as HTMLElement).closest(".pill") as HTMLElement | null;
      const entity = pill?.getAttribute("data-entity");
      if (!entity) return;
      ev.preventDefault();
      this._openMoreInfo(entity);
    });
  }

  private _openMoreInfo(entityId: string) {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _getLabel(e: BannerEntity): string {
    if (e.label && e.label.trim().length) return e.label.trim();

    if (!this._hass || e.entity_id.startsWith("demo.")) {
      return e.entity_id.replace("demo.", "").replace(/_/g, " ");
    }

    const st = this._hass.states[e.entity_id];
    return st?.attributes?.friendly_name || e.entity_id;
  }

  private _getIcon(e: BannerEntity): string {
    if (e.icon && e.icon.trim().length) return e.icon.trim();

    if (!this._hass || e.entity_id.startsWith("demo.")) return "mdi:information-outline";

    const st = this._hass.states[e.entity_id];
    const attrIcon = st?.attributes?.icon;
    return typeof attrIcon === "string" && attrIcon ? attrIcon : "mdi:information-outline";
  }

  private _getValue(e: BannerEntity): { valueText: string; unitText: string } {
    if (e.entity_id.startsWith("demo.")) {
      if (e.entity_id.includes("temperature")) return { valueText: "18.3", unitText: "°C" };
      if (e.entity_id.includes("lights")) return { valueText: "3", unitText: "" };
      if (e.entity_id.includes("security")) return { valueText: "Armed", unitText: "" };
      if (e.entity_id.includes("network")) return { valueText: "Online", unitText: "" };
      return { valueText: "—", unitText: "" };
    }

    if (!this._hass) return { valueText: "—", unitText: "" };

    const st = this._hass.states[e.entity_id];
    if (!st || ["unknown", "unavailable", "none"].includes(st.state)) return { valueText: "—", unitText: "" };

    const unit = st.attributes?.unit_of_measurement;
    const deviceClass = st.attributes?.device_class;

    const n = Number(st.state);
    if (!isNaN(n)) {
      const rounded = Math.round(n * 10) / 10;
      return {
        valueText: `${rounded}`,
        unitText: typeof unit === "string" ? unit : deviceClass === "temperature" ? "°C" : "",
      };
    }

    return { valueText: `${st.state}`, unitText: typeof unit === "string" ? unit : "" };
  }

  private _escape(s: string) {
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}

const TAG = "scrolling-banner-card";
if (!customElements.get(TAG)) {
  customElements.define(TAG, ScrollingBannerCard);
}
