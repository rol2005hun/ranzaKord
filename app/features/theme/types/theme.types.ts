export type ThemeId = 'light' | 'dark' | 'ocean' | 'rose';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  icon: string;
  dark: boolean;
}

export interface CustomColor {
  hex: string;
  h: number;
  s: number;
  l: number;
}
