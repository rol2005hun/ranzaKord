export type ThemeId = 'default' | 'dark' | 'ocean' | 'music';

export interface ThemeOption {
  id: ThemeId;
  label: string;
}

export interface CustomColor {
  hex: string;
  h: number;
  s: number;
  l: number;
}
