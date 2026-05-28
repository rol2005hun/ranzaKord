import { describe, it, expect } from 'vitest';
import { hexToHsl } from '../../app/utils/color';

describe('color utils', () => {
  it('converts hex to hsl correctly', () => {
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 100, l: 50 });
    expect(hexToHsl('#00ff00')).toEqual({ h: 120, s: 100, l: 50 });
    expect(hexToHsl('#0000ff')).toEqual({ h: 240, s: 100, l: 50 });
    expect(hexToHsl('#ffffff')).toEqual({ h: 0, s: 0, l: 100 });
    expect(hexToHsl('#000000')).toEqual({ h: 0, s: 0, l: 0 });
    expect(hexToHsl('#d3d3d3')).toEqual({ h: 0, s: 0, l: 83 });

    expect(hexToHsl('#ffcccc')).toEqual({ h: 0, s: 100, l: 90 });
    expect(hexToHsl('invalid')).toEqual({ h: 0, s: 0, l: 0 });
  });
});
