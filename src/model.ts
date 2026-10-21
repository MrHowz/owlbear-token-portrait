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
export const MIN_SIZE = 32;
export const MAX_SIZE = 1600;
export const defaults: Settings = { side: "right", enabled: true, size: 300 };

export function settingsFrom(value: unknown): Settings {
  const v = (value ?? {}) as Partial<Settings>;
  return {
    side: v.side === "left" ? "left" : "right",
    enabled: v.enabled !== false,
    size: typeof v.size === "number" && Number.isFinite(v.size)
      ? Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(v.size))) : defaults.size,
  };
}

export function chooseImage(items: Item[], selection: string[], previous?: string): Image | undefined {
  const candidates = selection.map(id => items.find(item => item.id === id))
    .filter((item): item is Image => item?.type === "IMAGE");
  // Keep the current portrait stable during multi-selection.
  return candidates.find(item => item.id === previous) ?? candidates.at(-1);
}

export function layout(width: number, height: number, imageWidth: number, imageHeight: number, settings: Settings) {
  // Use the space beside the bottom dock on desktop, so the portrait can sit
  // at the bottom edge without covering it. Narrow screens need to sit above it.
  const sideGap = width < 600 ? 64 : 84;
  const cornerWidth = (width - 480) / 2 - sideGap - 8;
  const fitsBesideDock = cornerWidth >= 160;
  const bottomGap = fitsBesideDock ? 8 : (height < 500 ? 76 : 100);
  const availableWidth = fitsBesideDock ? cornerWidth : width - sideGap * 2;
  const availableHeight = height - bottomGap - 80;
  if (![width, height, imageWidth, imageHeight].every(Number.isFinite) ||
      availableWidth < 48 || availableHeight < 48 || imageWidth <= 0 || imageHeight <= 0) return undefined;
  const size = settingsFrom(settings).size;
  const ratio = Math.min(size / imageHeight, Math.min(size, availableWidth) / imageWidth,
    availableHeight / imageHeight);
  const w = imageWidth * ratio;
  const h = imageHeight * ratio;
  return {
    x: settings.side === "left" ? sideGap : width - sideGap - w,
    y: height - bottomGap - h, width: w, height: h, ratio,
  };
}
