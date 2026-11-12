export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  const [, rHex = '0', gHex = '0', bHex = '0'] = result;
  const r = parseInt(rHex, 16) / 255;
  const g = parseInt(gHex, 16) / 255;
  const b = parseInt(bHex, 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const normalizedH = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const light = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((normalizedH / 60) % 2) - 1));
  const m = light - c / 2;

  let r: number;
  let g: number;
  let b: number;

  if (normalizedH >= 0 && normalizedH < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (normalizedH >= 60 && normalizedH < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (normalizedH >= 120 && normalizedH < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (normalizedH >= 180 && normalizedH < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (normalizedH >= 240 && normalizedH < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getLuminance(r: number, g: number, b: number) {
  const toLinear = (c: number) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const rs = toLinear(r);
  const gs = toLinear(g);
  const bs = toLinear(b);
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastColor(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '#ffffff';

  const [, rHex = '0', gHex = '0', bHex = '0'] = result;
  const r = parseInt(rHex, 16);
  const g = parseInt(gHex, 16);
  const b = parseInt(bHex, 16);

  const lum = getLuminance(r, g, b);
  const contrastWhite = 1.05 / (lum + 0.05);
  const contrastBlack = (lum + 0.05) / 0.05;

  return contrastBlack > contrastWhite ? '#000000' : '#ffffff';
}
