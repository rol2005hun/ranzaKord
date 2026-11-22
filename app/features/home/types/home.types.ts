import type { SearchResult } from '@/features/search/types/search.types';

export interface HomeHeroData {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface DailyMix {
  id: string;
  title: string;
  artistsSummary: string;
  thumbnailUrl: string;
  color: string;
  tracks: SearchResult[];
}

export interface RecommendedRadio {
  id: string;
  title: string;
  artist: string;
  subtitle: string;
  thumbnailUrl: string;
  color: string;
  seedVideoId: string;
  tracks: SearchResult[];
}

export interface HomeDiscoveryData {
  dailyMixes: DailyMix[];
  radios: RecommendedRadio[];
  listenAgain: SearchResult[];
  featured: SearchResult[];
}
