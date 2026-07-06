export type SidebarMode = 'info' | 'lyrics' | 'queue';

export interface LyricLine {
  time: number;
  text: string;
  translatedText?: string;
}

export interface LyricsData {
  synced: LyricLine[] | null;
  plain: string | null;
  translatedPlain?: string | null;
  trackId: string;
}
