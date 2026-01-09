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

  speed?: number;
  pause_on_hover?: boolean;
  divider?: boolean;

  background?: string;
  text_color?: string;
  divider_color?: string;

  css?: string;
};

type Hass = any;

function ensureArray<T>(v: any, fallback: T[]): T[] {
  return Array.isArray(v) ? v : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function asStr(v: any, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asBool(v: any, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function asNum(v: any, fallback = 0): number {
  return typeof v === "number" && !Number.isNaN(v) ? v : fallback;
}

// Try to convert any css color to a hex picker default.
// If we can't, fall back to a safe default for the input[type=color].
function colorToHexOrDefault(v: string | undefined, fallbackHex: string) {
  if (!v) return fallbackHex;
  const s = v.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s;
  return fallbackHex;
}

function safeCssEscape(id: string) {
  try {
    const esc = (window as any).CSS?.escape;
    return typeof esc === "function" ? esc(id) : id;
  } catch {
    return id;
  }
}

class ScrollingBannerCardEditor extends HTMLElement {
  private _config?: ScrollingBannerConfig;
  private _hass?: Hass;
  private _root?: ShadowRoot;

  private _activeEntityIdx = 0;
  private _showEntityCode = false;

  setConfig(config: Partial<ScrollingBannerConfig>) {
    const cfg = (config ?? {}) as Partial<ScrollingBannerConfig>;

    this._config = {
      type: "custom:scrolling-banner-card",
      title: asStr(cfg.title, ""),

      entities: ensureArray<BannerEntity>(cfg.entities, []),

      speed: clamp(asNum(cfg.speed, 40), 10, 300),
      pause_on_hover: asBool(cfg.pause_on_hover, true),
      divider: asBool(cfg.divider, true),

      background: asStr(cfg.background, "transparent"),
      text_color: asStr(cfg.text_color, "rgba(255,255,255,0.92)"),
      divider_color: asStr(cfg.divider_color, "rgba(255,255,255,0.14)"),

      css: asStr(cfg.css, ""),
    };

    this._clampActiveIdx();
    this._ensureRoot();
    this._render();
  }

  set hass(hass: Hass) {
    this._hass = hass;
    this._syncPickers();
  }

  connectedCallback() {
    this._ensureRoot();

    // If HA mounts editor before setConfig, create safe defaults.
    if (!this._config) {
      this._config = {
        type: "custom:scrolling-banner-card",
        title: "",
        entities: [],
        speed: 40,
        pause_on_hover: true,
        divider: true,
        background: "transparent",
        text_color: "rgba(255,255,255,0.92)",
        divider_color: "rgba(255,255,255,0.14)",
        css: "",
      };

      this.dispatchEvent(
        new CustomEvent("config-changed", {
          detail: { config: this._config },
          bubbles: true,
          composed: true,
        })
      );
    }

    this._clampActiveIdx();
    this._render();
  }

  // ---------- Entity tab helpers ----------

  private _clampActiveIdx() {
    const entities = ensureArray<BannerEntity>(this._config?.entities, []);
    if (entities.length === 0) {
      this._activeEntityIdx = 0;
      return;
    }
    if (this._activeEntityIdx < 0) this._activeEntityIdx = 0;
    if (this._activeEntityIdx > entities.length - 1) this._activeEntityIdx = entities.length - 1;
  }

  private _setActiveEntityIdx(idx: number) {
    this._activeEntityIdx = idx;
    this._clampActiveIdx();
    this._render();
  }

  private _toggleEntityCode() {
    this._showEntityCode = !this._showEntityCode;
    this._render();
  }

  private _entityToCode(e: BannerEntity) {
    return JSON.stringify(
      {
        entity_id: asStr(e.entity_id, ""),
        label: asStr(e.label, ""),
        icon: asStr(e.icon, ""),
        bg_color: asStr(e.bg_color, ""),
        icon_color: asStr(e.icon_color, ""),
        text_color: asStr(e.text_color, ""),
      },
      null,
      2
    );
  }

  private _codeToEntity(text: string): BannerEntity | null {
    try {
      const obj = JSON.parse(text);
      if (!obj || typeof obj !== "object") return null;
      return {
        entity_id: asStr((obj as any).entity_id, ""),
        label: asStr((obj as any).label, ""),
        icon: asStr((obj as any).icon, ""),
        bg_color: asStr((obj as any).bg_color, ""),
        icon_color: asStr((obj as any).icon_color, ""),
        text_color: asStr((obj as any).text_color, ""),
      };
    } catch {
      return null;
    }
  }

  private _escapeText(s: string) {
    return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  private async _copyActiveEntityCode() {
    if (!this._config) return;
    const entities = ensureArray<BannerEntity>(this._config.entities, []);
    const e = entities[this._activeEntityIdx];
    if (!e) return;

    const code = this._entityToCode(e);
    await navigator.clipboard.writeText(code);
  }

  private async _applyActiveEntityCodeFromTextareaOrClipboard() {
    if (!this._root || !this._config) return;

    const entities = ensureArray<BannerEntity>(this._config.entities, []);
    if (!entities[this._activeEntityIdx]) return;

    const textarea = this._root.querySelector("#entity_code") as HTMLTextAreaElement | null;
    const text = textarea?.value?.trim()
      ? textarea.value
      : await (async () => {
          try {
            return await navigator.clipboard.readText();
          } catch {
            return "";
          }
        })();

    const parsed = this._codeToEntity(text);
    if (!parsed) {
      alert("Could not parse entity JSON. Make sure it is valid JSON.");
      return;
    }

    const next = entities.slice();
    next[this._activeEntityIdx] = parsed;
    this._update({ entities: next });
  }

  private _deleteActiveEntity() {
    if (!this._config) return;
    const entities = ensureArray<BannerEntity>(this._config.entities, []);
    if (entities.length === 0) return;

    entities.splice(this._activeEntityIdx, 1);
    this._activeEntityIdx = Math.max(0, this._activeEntityIdx - 1);
    this._update({ entities });
  }

  private _addEntityAndFocus() {
    if (!this._config) return;
    const entities = ensureArray<BannerEntity>(this._config.entities, []);
    entities.push({ entity_id: "" });
    this._activeEntityIdx = entities.length - 1;
    this._update({ entities });
  }

  // ---------- UI ----------

  private _ensureRoot() {
    if (this._root) return;
    this._root = this.attachShadow({ mode: "open" });
    this._root.innerHTML = `
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
    `;
  }

  private _render() {
    if (!this._root) return;
    const wrap = this._root.querySelector(".wrap") as HTMLDivElement;

    // Preserve focus + selection
    const active = this._root.activeElement as any;
    const activeId = active?.id || "";
    const selStart = typeof active?.selectionStart === "number" ? active.selectionStart : null;
    const selEnd = typeof active?.selectionEnd === "number" ? active.selectionEnd : null;

    const cfg = this._config;
    if (!cfg) {
      wrap.innerHTML = `<div class="small">Loading…</div>`;
      return;
    }

    const entities = ensureArray<BannerEntity>(cfg.entities, []);
    this._clampActiveIdx();

    const hasEntities = entities.length > 0;
    const idx = this._activeEntityIdx;
    const current = hasEntities ? entities[idx] : undefined;

    wrap.innerHTML = `
      <div class="row">
        <div>
          <div class="h">Title (optional)</div>
          <input id="title" type="text" value="${asStr(cfg.title, "")}" placeholder="e.g. Status" />
        </div>
        <div>
          <div class="h">Speed (px/sec)</div>
          <input id="speed" type="number" min="10" max="300" step="1" value="${asNum(cfg.speed, 40)}" />
        </div>
      </div>

      <div class="row" style="margin-top:10px;">
        <label class="small"><input id="pause_on_hover" type="checkbox" ${cfg.pause_on_hover ? "checked" : ""}/> Pause on hover</label>
        <label class="small"><input id="divider" type="checkbox" ${cfg.divider ? "checked" : ""}/> Dividers</label>
      </div>

      <div class="section">
        <div class="h">Global styling</div>

        <div class="grid2">
          <div>
            <div class="h">Background</div>
            <div class="colorRow">
              <input id="background_picker" type="color" value="${colorToHexOrDefault(cfg.background, "#000000")}" />
              <input id="background" type="text" value="${asStr(cfg.background, "")}" placeholder="e.g. rgba(0,0,0,0.2) or #121212" />
            </div>
          </div>

          <div>
            <div class="h">Text color</div>
            <div class="colorRow">
              <input id="text_color_picker" type="color" value="${colorToHexOrDefault(cfg.text_color, "#ffffff")}" />
              <input id="text_color" type="text" value="${asStr(cfg.text_color, "")}" placeholder="e.g. rgba(255,255,255,0.92)" />
            </div>
          </div>

          <div>
            <div class="h">Divider color</div>
            <div class="colorRow">
              <input id="divider_color_picker" type="color" value="${colorToHexOrDefault(cfg.divider_color, "#ffffff")}" />
              <input id="divider_color" type="text" value="${asStr(cfg.divider_color, "")}" placeholder="e.g. rgba(255,255,255,0.14)" />
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="h">Entities</div>

        <div class="tabs" id="entity_tabs">
          ${entities
            .map(
              (_, i) =>
                `<button class="tab ${i === idx ? "active" : ""}" data-tab="${i}" type="button">${i + 1}</button>`
            )
            .join("")}
          <button class="tab add" id="add_entity_tab" type="button">+</button>
        </div>

        ${
          !hasEntities
            ? `<div class="small">No entities yet. Press <b>+</b> to add one.</div>`
            : `
              <div class="entity-card" data-idx="${idx}">
                <div class="entity-toolbar">
                  <div class="left">
                    <div class="entity-title">Item ${idx + 1}</div>
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

                ${
                  this._showEntityCode
                    ? `
                      <div class="h">Entity JSON (copy/paste)</div>
                      <textarea id="entity_code" class="codebox" rows="8" spellcheck="false">${this._escapeText(
                        this._entityToCode(current!)
                      )}</textarea>
                    `
                    : ""
                }

                <div class="small" style="margin:10px 0 6px;">Form fields (kept in sync)</div>

                <div class="grid2">
                  <div class="picker">
                    <div class="h">Entity</div>
                    <div data-picker="entity" data-idx="${idx}"></div>
                    <input id="entity_id_${idx}" type="text" value="${asStr(current!.entity_id, "")}" placeholder="sensor.temperature" style="margin-top:8px;" />
                  </div>

                  <div class="picker">
                    <div class="h">Icon</div>
                    <div data-picker="icon" data-idx="${idx}"></div>
                    <input id="icon_${idx}" type="text" value="${asStr(current!.icon, "")}" placeholder="mdi:information-outline" style="margin-top:8px;" />
                  </div>

                  <div>
                    <div class="h">Label</div>
                    <input id="label_${idx}" type="text" value="${asStr(current!.label, "")}" placeholder="Optional label override" />
                  </div>

                  <div>
                    <div class="h">Pill background</div>
                    <div class="colorRow">
                      <input id="bg_color_picker_${idx}" type="color" value="${colorToHexOrDefault(current!.bg_color, "#202020")}" />
                      <input id="bg_color_${idx}" type="text" value="${asStr(current!.bg_color, "")}" placeholder="e.g. rgba(255,255,255,0.06)" />
                    </div>
                  </div>

                  <div>
                    <div class="h">Icon color</div>
                    <div class="colorRow">
                      <input id="icon_color_picker_${idx}" type="color" value="${colorToHexOrDefault(current!.icon_color, "#ffffff")}" />
                      <input id="icon_color_${idx}" type="text" value="${asStr(current!.icon_color, "")}" placeholder="e.g. #FFD966" />
                    </div>
                  </div>

                  <div>
                    <div class="h">Text color</div>
                    <div class="colorRow">
                      <input id="text_color_picker_${idx}" type="color" value="${colorToHexOrDefault(current!.text_color, "#ffffff")}" />
                      <input id="text_color_${idx}" type="text" value="${asStr(current!.text_color, "")}" placeholder="Overrides pill text only" />
                    </div>
                  </div>
                </div>
              </div>
            `
        }
      </div>

      <div class="section">
        <div class="h">Advanced</div>
        <div class="small" style="margin-bottom:8px;">Custom CSS injected into the card shadow root.</div>
        <textarea id="css" rows="6" placeholder="e.g. .pill { border-radius: 16px; }">${asStr(cfg.css, "")}</textarea>
      </div>
    `;

    this._wire();
    this._syncPickers();

    // Restore focus/selection safely
    if (activeId) {
      const safeId = safeCssEscape(activeId);
      const el = this._root.querySelector(`#${safeId}`) as any;
      if (el && typeof el.focus === "function") {
        el.focus();
        if (selStart !== null && selEnd !== null && typeof el.setSelectionRange === "function") {
          el.setSelectionRange(selStart, selEnd);
        }
      }
    }
  }

  private _wire() {
    if (!this._root || !this._config) return;

    const on = (sel: string, ev: string, fn: (e: any) => void) => {
      const el = this._root!.querySelector(sel);
      if (!el) return;
      el.addEventListener(ev, fn);
    };

    // Global bindings
    on("#title", "input", (e) => this._update({ title: (e.target as HTMLInputElement).value }));
    on("#speed", "input", (e) => this._update({ speed: clamp(Number((e.target as HTMLInputElement).value), 10, 300) }));
    on("#pause_on_hover", "change", (e) => this._update({ pause_on_hover: (e.target as HTMLInputElement).checked }));
    on("#divider", "change", (e) => this._update({ divider: (e.target as HTMLInputElement).checked }));

    on("#background_picker", "input", (e) => {
      const v = (e.target as HTMLInputElement).value;
      (this._root!.querySelector("#background") as HTMLInputElement).value = v;
      this._update({ background: v });
    });
    on("#background", "input", (e) => this._update({ background: (e.target as HTMLInputElement).value }));

    on("#text_color_picker", "input", (e) => {
      const v = (e.target as HTMLInputElement).value;
      (this._root!.querySelector("#text_color") as HTMLInputElement).value = v;
      this._update({ text_color: v });
    });
    on("#text_color", "input", (e) => this._update({ text_color: (e.target as HTMLInputElement).value }));

    on("#divider_color_picker", "input", (e) => {
      const v = (e.target as HTMLInputElement).value;
      (this._root!.querySelector("#divider_color") as HTMLInputElement).value = v;
      this._update({ divider_color: v });
    });
    on("#divider_color", "input", (e) => this._update({ divider_color: (e.target as HTMLInputElement).value }));

    on("#css", "input", (e) => this._update({ css: (e.target as HTMLTextAreaElement).value }));

    // Tabs (delegated)
    const tabs = this._root!.querySelector("#entity_tabs");
    if (tabs && !(tabs as any).__wired) {
      (tabs as any).__wired = true;
      tabs.addEventListener("click", (ev) => {
        const btn = (ev.target as HTMLElement).closest("button.tab") as HTMLButtonElement | null;
        if (!btn) return;
        const tab = btn.getAttribute("data-tab");
        if (tab !== null) this._setActiveEntityIdx(Number(tab));
      });
    }

    // Add entity (+)
    on("#add_entity_tab", "click", () => this._addEntityAndFocus());

    // Toggle JSON panel
    on("#toggle_entity_code", "click", () => this._toggleEntityCode());

    // Entity toolbar + codebox
    on("#copy_entity", "click", async () => {
      try {
        await this._copyActiveEntityCode();
      } catch {
        alert("Copy failed (clipboard permissions).");
      }
    });

    on("#paste_entity", "click", async () => {
      try {
        await this._applyActiveEntityCodeFromTextareaOrClipboard();
      } catch {
        alert("Paste failed (clipboard permissions).");
      }
    });

    on("#delete_entity", "click", () => this._deleteActiveEntity());

    // Apply JSON when changed (only exists if panel is open)
    on("#entity_code", "change", () => this._applyActiveEntityCodeFromTextareaOrClipboard());

    // Active entity input bindings (only bind current)
    const entities = ensureArray<BannerEntity>(this._config.entities, []);
    const idx = this._activeEntityIdx;
    const current = entities[idx];
    if (!current) return;

    const updateEntityField = (key: keyof BannerEntity, value: string) => {
      const next = entities.slice();
      next[idx] = { ...next[idx], [key]: value };
      this._update({ entities: next });
    };

    // Text inputs
    on(`#entity_id_${idx}`, "input", (e) => updateEntityField("entity_id", (e.target as HTMLInputElement).value));
    on(`#label_${idx}`, "input", (e) => updateEntityField("label", (e.target as HTMLInputElement).value));
    on(`#icon_${idx}`, "input", (e) => updateEntityField("icon", (e.target as HTMLInputElement).value));
    on(`#bg_color_${idx}`, "input", (e) => updateEntityField("bg_color", (e.target as HTMLInputElement).value));
    on(`#icon_color_${idx}`, "input", (e) => updateEntityField("icon_color", (e.target as HTMLInputElement).value));
    on(`#text_color_${idx}`, "input", (e) => updateEntityField("text_color", (e.target as HTMLInputElement).value));

    // Color pickers (write to text field too)
    const bindPicker = (pickerId: string, textId: string, key: keyof BannerEntity) => {
      const p = this._root!.querySelector(pickerId) as HTMLInputElement | null;
      const t = this._root!.querySelector(textId) as HTMLInputElement | null;
      if (!p || !t) return;
      p.addEventListener("input", () => {
        t.value = p.value;
        updateEntityField(key, p.value);
      });
    };

    bindPicker(`#bg_color_picker_${idx}`, `#bg_color_${idx}`, "bg_color");
    bindPicker(`#icon_color_picker_${idx}`, `#icon_color_${idx}`, "icon_color");
    bindPicker(`#text_color_picker_${idx}`, `#text_color_${idx}`, "text_color");
  }

  private _syncPickers() {
    if (!this._root || !this._config) return;

    const entities = ensureArray<BannerEntity>(this._config.entities, []);
    const hass = this._hass;

    const i = this._activeEntityIdx;
    const e = entities[i];
    if (!e) return;

    // ENTITY PICKER
    const entityHost = this._root.querySelector(`[data-picker="entity"][data-idx="${i}"]`) as HTMLElement | null;
    if (entityHost && entityHost.childElementCount === 0 && customElements.get("ha-entity-picker")) {
      const picker = document.createElement("ha-entity-picker") as any;
      picker.className = "picker";
      if (hass) picker.hass = hass;
      picker.value = e.entity_id || "";
      picker.setAttribute("allow-custom-entity", "");
      picker.addEventListener("value-changed", (ev: any) => {
        const v = ev?.detail?.value ?? "";
        const input = this._root!.querySelector(`#entity_id_${i}`) as HTMLInputElement | null;
        if (input) input.value = v;

        const next = ensureArray<BannerEntity>(this._config!.entities, []).slice();
        next[i] = { ...next[i], entity_id: v };
        this._update({ entities: next });
      });
      entityHost.appendChild(picker);
    } else if (entityHost && entityHost.firstElementChild) {
      const picker = entityHost.firstElementChild as any;
      if (hass) picker.hass = hass;
      picker.value = e.entity_id || "";
    }

    // ICON PICKER
    const iconHost = this._root.querySelector(`[data-picker="icon"][data-idx="${i}"]`) as HTMLElement | null;
    if (iconHost && iconHost.childElementCount === 0 && customElements.get("ha-icon-picker")) {
      const picker = document.createElement("ha-icon-picker") as any;
      picker.className = "picker";
      if (hass) picker.hass = hass;
      picker.value = e.icon || "";
      picker.addEventListener("value-changed", (ev: any) => {
        const v = ev?.detail?.value ?? "";
        const input = this._root!.querySelector(`#icon_${i}`) as HTMLInputElement | null;
        if (input) input.value = v;

        const next = ensureArray<BannerEntity>(this._config!.entities, []).slice();
        next[i] = { ...next[i], icon: v };
        this._update({ entities: next });
      });
      iconHost.appendChild(picker);
    } else if (iconHost && iconHost.firstElementChild) {
      const picker = iconHost.firstElementChild as any;
      if (hass) picker.hass = hass;
      picker.value = e.icon || "";
    }
  }

  private _update(patch: Partial<ScrollingBannerConfig>) {
    if (!this._config) return;
    this._config = { ...this._config, ...patch };

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );

    this._render();
  }
}

const TAG = "scrolling-banner-card-editor";
if (!customElements.get(TAG)) {
  customElements.define(TAG, ScrollingBannerCardEditor);
}
