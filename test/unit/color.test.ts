import { describe, it, expect } from 'vitest';
import { hexToHsl } from '../../app/utils/color';

describe('color utils', () => {
  it('converts hex to hsl correctly', () => {
    // Red
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 100, l: 50 });
    // Green
    expect(hexToHsl('#00ff00')).toEqual({ h: 120, s: 100, l: 50 });
    // Blue
    expect(hexToHsl('#0000ff')).toEqual({ h: 240, s: 100, l: 50 });
    // White
    expect(hexToHsl('#ffffff')).toEqual({ h: 0, s: 0, l: 100 });
    // Black
    expect(hexToHsl('#000000')).toEqual({ h: 0, s: 0, l: 0 });
    // Branch: l > 0.5 for lightness
    expect(hexToHsl('#d3d3d3')).toEqual({ h: 0, s: 0, l: 83 });

    // Branch: l > 0.5 and max !== min
    expect(hexToHsl('#ffcccc')).toEqual({ h: 0, s: 100, l: 90 });
    // Invalid
    expect(hexToHsl('invalid')).toEqual({ h: 0, s: 0, l: 0 });
  });
});
