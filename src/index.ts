import "./scrolling-banner-card";
import "./editor";

declare const __SBC_VERSION__: string;

const w = window as any;
if (!w.__SBC_LOADED__) {
  w.__SBC_LOADED__ = true;
  // eslint-disable-next-line no-console
  console.info(`Scrolling Banner Card v${__SBC_VERSION__} loaded`);
}

// Register in the HA card picker (so it appears in the visual UI picker)
(window as any).customCards.push({
  type: "custom:scrolling-banner-card",
  name: "Scrolling Banner Card",
  description: "A responsive scrolling banner showing entity states.",
  preview: false,
});

