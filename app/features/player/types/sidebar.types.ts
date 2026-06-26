export type SidebarMode = 'info' | 'lyrics' | 'queue';

export interface LyricLine {
  time: number;
  text: string;
}

export interface LyricsData {
  synced: LyricLine[] | null;
  plain: string | null;
  trackId: string;
}
