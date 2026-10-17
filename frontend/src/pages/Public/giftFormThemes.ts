import type { CSSProperties } from 'react';

export type GiftThemeKey = 'forest-gold' | 'warm-trust' | 'midnight-rose' | 'custom';

export interface GiftAppearance {
  themeKey: GiftThemeKey;
  backgroundColor: string;
  accentColor: string;
  ctaColor: string;
}

export interface GiftThemePreset {
  key: Exclude<GiftThemeKey, 'custom'>;
  name: string;
  blurb: string;
  background: string;
  accent: string;
  cta: string;
}

export const GIFT_THEME_PRESETS: GiftThemePreset[] = [
  {
    key: 'forest-gold',
    name: 'Forest Gold',
    blurb: 'Premium gift-card feel. Best for Instagram claim campaigns.',
    background: '#0f1c17',
    accent: '#e8c572',
    cta: '#d4a853',
  },
  {
    key: 'warm-trust',
    name: 'Warm Trust',
    blurb: 'Light, readable, and trustworthy. Best general-purpose look.',
    background: '#f6f1e8',
    accent: '#1e3a5f',
    cta: '#c45c26',
  },
  {
    key: 'midnight-rose',
    name: 'Midnight Rose',
    blurb: 'Softer luxury for social gifts without looking corporate.',
    background: '#1a1420',
    accent: '#e8b4b8',
    cta: '#d4a574',
  },
];

export const DEFAULT_GIFT_APPEARANCE: GiftAppearance = {
  themeKey: 'forest-gold',
  backgroundColor: '#0f1c17',
  accentColor: '#e8c572',
  ctaColor: '#d4a853',
};

const HEX = /^#([0-9a-f]{6})$/i;

export const isHexColor = (value: string | undefined | null): value is string =>
  Boolean(value && HEX.test(value.trim()));

const normalizeHex = (value: string, fallback: string) => {
  const v = value.trim();
  return isHexColor(v) ? `#${v.slice(1).toLowerCase()}` : fallback;
};

const parseRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const luminance = (hex: string) => {
  const { r, g, b } = parseRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

const contrastText = (hex: string) => (luminance(hex) > 0.55 ? '#1b1408' : '#f4efe6');

const rgba = (hex: string, alpha: number) => {
  const { r, g, b } = parseRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const mix = (hex: string, toward: string, amount: number) => {
  const a = parseRgb(hex);
  const b = parseRgb(toward);
  const t = Math.min(1, Math.max(0, amount));
  const ch = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `#${[ch(a.r, b.r), ch(a.g, b.g), ch(a.b, b.b)].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
};

export const resolveGiftAppearance = (raw?: Partial<GiftAppearance> | null): GiftAppearance => {
  const key = (raw?.themeKey || DEFAULT_GIFT_APPEARANCE.themeKey) as GiftThemeKey;
  const preset = GIFT_THEME_PRESETS.find((p) => p.key === key);
  if (preset) {
    return {
      themeKey: preset.key,
      backgroundColor: preset.background,
      accentColor: preset.accent,
      ctaColor: preset.cta,
    };
  }
  return {
    themeKey: 'custom',
    backgroundColor: normalizeHex(raw?.backgroundColor || '', DEFAULT_GIFT_APPEARANCE.backgroundColor),
    accentColor: normalizeHex(raw?.accentColor || '', DEFAULT_GIFT_APPEARANCE.accentColor),
    ctaColor: normalizeHex(raw?.ctaColor || '', DEFAULT_GIFT_APPEARANCE.ctaColor),
  };
};

export const giftThemeCssVars = (appearance: GiftAppearance): CSSProperties => {
  const resolved = resolveGiftAppearance(appearance);
  const bg = resolved.backgroundColor;
  const accent = resolved.accentColor;
  const cta = resolved.ctaColor;
  const text = contrastText(bg);
  const darkBg = luminance(bg) <= 0.55;

  return {
    '--gift-bg': bg,
    '--gift-text': text,
    '--gift-muted': rgba(text, darkBg ? 0.78 : 0.72),
    '--gift-accent': accent,
    '--gift-cta': cta,
    '--gift-cta-text': contrastText(cta),
    '--gift-glow': rgba(accent, 0.28),
    '--gift-surface': darkBg ? mix(bg, '#ffffff', 0.08) : mix(bg, '#ffffff', 0.55),
    '--gift-overlay': rgba(darkBg ? bg : '#1a1420', 0.72),
    '--gift-error': darkBg ? '#ffb4a8' : '#b42318',
    '--gift-option': '#1b1408',
  } as CSSProperties;
};
