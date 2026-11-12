export type ThemeId = 'dark' | 'light' | 'ocean' | 'rose' | 'walker' | 'christmas';

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

export interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  opacity: number;
  phase: number;
  phaseSpeed: number;
}
