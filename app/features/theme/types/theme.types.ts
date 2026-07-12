export type ThemeId = 'dark' | 'light' | 'ocean' | 'rose' | 'walker' | 'wc2026';

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

export interface CustomPalette {
  primary: CustomColor;
  secondary: CustomColor;
}
