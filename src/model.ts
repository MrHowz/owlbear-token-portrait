import type { Image, Item } from "@owlbear-rodeo/sdk";

export const ID = "com.token-portrait";
export const PORTRAIT_KEY = `${ID}/image`;
export type Portrait = { url: string; width: number; height: number };
export function portraitFrom(value: unknown): Portrait | undefined {
  if (!value || typeof value !== "object") return;
  const p = value as Portrait;
  try {
    const url = new URL(p.url);
    if (url.protocol !== "https:" || url.username || url.password) return;
    if (![p.width, p.height].every(v => Number.isFinite(v) && v > 0)) return;
    return { url: url.href, width: p.width, height: p.height };
  } catch { return; }
}
export type Settings = { side: "left" | "right"; enabled: boolean; size: number };
export const defaults: Settings = { side: "right", enabled: true, size: 300 };

export function settingsFrom(value: unknown): Settings {
  const v = (value ?? {}) as Partial<Settings>;
  return {
    side: v.side === "left" ? "left" : "right",
    enabled: v.enabled !== false,
    size: [180, 240, 300].includes(v.size!) ? v.size! : 300,
  };
}

export function chooseImage(items: Item[], selection: string[], previous?: string): Image | undefined {
  const candidates = selection.map(id => items.find(item => item.id === id))
    .filter((item): item is Image => item?.type === "IMAGE");
  // Keep the current portrait stable during multi-selection.
  return candidates.find(item => item.id === previous) ?? candidates.at(-1);
}

export function layout(width: number, height: number, imageWidth: number, imageHeight: number, settings: Settings) {
  // Reserve the bottom dock and both side tool strips, even on narrow screens.
  const sideGap = width < 600 ? 64 : 84;
  const bottomGap = height < 500 ? 76 : 100;
  const availableWidth = width - sideGap * 2;
  const availableHeight = height - bottomGap - 80;
  if (![width, height, imageWidth, imageHeight].every(Number.isFinite) ||
      availableWidth < 48 || availableHeight < 48 || imageWidth <= 0 || imageHeight <= 0) return undefined;
  const ratio = Math.min(settings.size / imageHeight, Math.min(settings.size, availableWidth * 0.65) / imageWidth,
    availableHeight * 0.65 / imageHeight);
  const w = imageWidth * ratio;
  const h = imageHeight * ratio;
  return {
    x: settings.side === "left" ? sideGap : width - sideGap - w,
    y: height - bottomGap - h, width: w, height: h, ratio,
  };
}
