import { TrackModel } from '../../models/Track';
import { TrackStatModel } from '../../models/TrackStat';
import type { ServerSession } from '../../types/auth.server.types';
import type {
  DailyMix,
  HomeDiscoveryData,
  RecommendedRadio
} from '../../../app/features/home/types/home.types';
import type { SearchResult } from '../../../app/features/search/types/search.types';

interface DbTrackItem {
  trackId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  durationSeconds: number;
}

const MIX_COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899'];
const RADIO_COLORS = ['#ef4444', '#f97316', '#10b981', '#3b82f6', '#84cc16', '#a855f7'];

const FALLBACK_ARTISTS = [
  'Dzsúdló',
  'Azahriah',
  'DESH',
  'Beton.Hofi',
  'Pogány Induló',
  'Halott Pénz',
  'Wellhello',
  'Manuel',
  'ByeAlex és a Slepp',
  'VALMAR'
];

type YTItem = {
  id?: string;
  endpoint?: { payload?: { videoId?: string } };
  title?: { toString: () => string };
  name?: { toString: () => string };
  authors?: Array<{ name?: string }>;
  artists?: Array<{ name?: string }>;
  author?: { name?: string } | Array<{ name?: string }> | string | { toString: () => string };
  subtitle?: { name?: string } | Array<{ name?: string }> | string | { toString: () => string };
  thumbnails?: Array<{ url: string; width?: number }>;
  thumbnail?:
    { contents?: Array<{ url: string; width?: number }> } | Array<{ url: string; width?: number }>;
  duration?: { seconds?: number } | number;
};

function extractArtistName(item: YTItem): string {
  if (item.authors?.[0]?.name) return item.authors[0].name;
  if (item.artists?.[0]?.name) return item.artists[0].name;
  if (
    item.author &&
    typeof item.author === 'object' &&
    'name' in item.author &&
    !Array.isArray(item.author)
  ) {
    return item.author.name || 'Unknown';
  }
  if (Array.isArray(item.author) && item.author[0]?.name) return item.author[0].name;
  if (
    item.author &&
    typeof item.author.toString === 'function' &&
    item.author.toString() !== '[object Object]'
  ) {
    return item.author.toString();
  }
  if (
    item.subtitle &&
    typeof item.subtitle === 'object' &&
    'name' in item.subtitle &&
    !Array.isArray(item.subtitle)
  ) {
    return item.subtitle.name || 'Unknown';
  }
  if (Array.isArray(item.subtitle) && item.subtitle[0]?.name) return item.subtitle[0].name;
  if (
    item.subtitle &&
    typeof item.subtitle.toString === 'function' &&
    item.subtitle.toString() !== '[object Object]'
  ) {
    return item.subtitle.toString();
  }
  return 'Unknown';
}

function extractThumbnail(item: YTItem): string {
  const thumbs =
    item.thumbnails || (item.thumbnail as Record<string, unknown>)?.contents || item.thumbnail;
  if (Array.isArray(thumbs) && thumbs.length > 0) {
    return thumbs.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || '';
  }
  return '';
}

function extractDuration(item: YTItem): number {
  if (
    typeof item.duration === 'object' &&
    item.duration &&
    typeof item.duration.seconds === 'number'
  ) {
    return item.duration.seconds;
  }
  if (typeof item.duration === 'number') {
    return item.duration;
  }
  return 0;
}

function toSearchResult(t: DbTrackItem): SearchResult {
  return {
    id: t.trackId,
    type: 'song',
    title: t.title,
    artist: t.artist,
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: t.durationSeconds
  };
}

export default defineCachedEventHandler(
  async (event): Promise<HomeDiscoveryData> => {
    const session = await useAppSession(event);
    const sessionData = session.data as Partial<ServerSession>;
    const userId = sessionData.user?.sub;

    const [userStats, recentStats, globalTracks] = await Promise.all([
      userId
        ? TrackStatModel.find({ userId })
            .sort({ playCount: -1, totalListening: -1 })
            .limit(30)
            .lean()
        : [],
      userId ? TrackStatModel.find({ userId }).sort({ lastPlayedAt: -1 }).limit(10).lean() : [],
      TrackModel.find({ globalPlayCount: { $gt: 0 } })
        .sort({ globalPlayCount: -1 })
        .limit(40)
        .lean()
    ]);

    const statTrackIds = Array.from(
      new Set([...userStats.map((s) => s.trackId), ...recentStats.map((s) => s.trackId)])
    );
    const knownTracks =
      statTrackIds.length > 0
        ? ((await TrackModel.find({
            trackId: { $in: statTrackIds }
          }).lean()) as unknown as DbTrackItem[])
        : [];
    const knownTrackMap = new Map<string, DbTrackItem>(knownTracks.map((t) => [t.trackId, t]));

    const listenAgain: SearchResult[] = [];
    for (const s of recentStats) {
      const tr = knownTrackMap.get(s.trackId);
      if (tr) listenAgain.push(toSearchResult(tr));
    }

    const userTopTracks: DbTrackItem[] = [];
    for (const s of userStats) {
      const tr = knownTrackMap.get(s.trackId);
      if (tr) userTopTracks.push(tr);
    }

    const pool: DbTrackItem[] =
      userTopTracks.length >= 3 ? userTopTracks : (globalTracks as unknown as DbTrackItem[]);

    const artistMap = new Map<string, DbTrackItem[]>();
    for (const track of pool) {
      const art = track.artist?.trim();
      if (!art || art.toLowerCase() === 'unknown') continue;
      const primaryArtist = art.split(/,\s*|\s+feat\.\s+|\s+ft\.\s+|\s+&\s+/i)[0]?.trim() || art;
      const list = artistMap.get(primaryArtist) || [];
      list.push(track);
      artistMap.set(primaryArtist, list);
    }

    const detectedArtists = Array.from(artistMap.keys());
    const finalArtists: string[] = [];
    for (const a of detectedArtists) {
      if (finalArtists.length >= 6) break;
      if (!finalArtists.includes(a)) finalArtists.push(a);
    }
    for (const fb of FALLBACK_ARTISTS) {
      if (finalArtists.length >= 6) break;
      if (!finalArtists.includes(fb)) finalArtists.push(fb);
    }

    const innertube = await createInnertube(false);

    let featured: SearchResult[] = [];
    try {
      const searchRes = await innertube.music.search('top hits hungary', { type: 'song' });
      if (searchRes.contents) {
        for (const section of searchRes.contents) {
          if (!('contents' in section) || !Array.isArray(section.contents)) continue;
          for (const rawItem of section.contents) {
            const item = rawItem as YTItem;
            const videoId = item.id || item.endpoint?.payload?.videoId;
            if (!videoId) continue;
            featured.push({
              id: String(videoId),
              type: 'song',
              title: String(item.title?.toString() || 'Unknown'),
              artist: extractArtistName(item),
              thumbnailUrl: extractThumbnail(item),
              durationSeconds: extractDuration(item)
            });
            if (featured.length >= 15) break;
          }
        }
      }
    } catch {
      featured = pool.slice(0, 15).map(toSearchResult);
    }

    if (!featured.length) {
      featured = pool.slice(0, 15).map(toSearchResult);
    }

    const dailyMixes: DailyMix[] = [];
    const mixClusters = [
      finalArtists.slice(0, 2),
      finalArtists.slice(2, 4),
      finalArtists.slice(4, 6),
      [finalArtists[0] || 'Dzsúdló', finalArtists[3] || 'Beton.Hofi']
    ];

    for (let i = 0; i < mixClusters.length; i++) {
      const cluster = mixClusters[i];
      if (!cluster || !cluster.length) continue;
      const clusterTracks: SearchResult[] = [];

      for (const artistName of cluster) {
        const matchingDb = pool.filter((t) =>
          t.artist?.toLowerCase().includes(artistName.toLowerCase())
        );
        for (const tr of matchingDb) {
          if (!clusterTracks.some((ct) => ct.id === tr.trackId)) {
            clusterTracks.push(toSearchResult(tr));
          }
          if (clusterTracks.length >= 10) break;
        }
      }

      if (clusterTracks.length < 5) {
        const seedTrack = clusterTracks[0] || featured[i] || featured[0];
        if (seedTrack) {
          try {
            const upNext = await innertube.music.getUpNext(seedTrack.id);
            if (upNext.contents) {
              for (const rawItem of upNext.contents) {
                const item = rawItem as YTItem;
                const vidId = item.id || item.endpoint?.payload?.videoId;
                if (!vidId) continue;
                if (!clusterTracks.some((ct) => ct.id === vidId)) {
                  clusterTracks.push({
                    id: String(vidId),
                    type: 'song',
                    title: String(item.title?.toString() || 'Unknown'),
                    artist: extractArtistName(item),
                    thumbnailUrl: extractThumbnail(item),
                    durationSeconds: extractDuration(item)
                  });
                }
                if (clusterTracks.length >= 12) break;
              }
            }
          } catch {
            void 0;
          }
        }
      }

      const coverUrl = clusterTracks[0]?.thumbnailUrl || featured[i]?.thumbnailUrl || '';
      const summary = `${cluster.join(', ')} és még mások`;

      dailyMixes.push({
        id: `daily-mix-${i + 1}`,
        title: `Napi mix ${i + 1}`,
        artistsSummary: summary,
        thumbnailUrl: coverUrl,
        color: MIX_COLORS[i % MIX_COLORS.length] || '#10b981',
        tracks: clusterTracks
      });
    }

    const radios: RecommendedRadio[] = [];
    for (let i = 0; i < finalArtists.length; i++) {
      const artist = finalArtists[i];
      if (!artist) continue;

      const artistTracks = pool.filter((t) =>
        t.artist?.toLowerCase().includes(artist.toLowerCase())
      );
      const seedTrack = artistTracks[0];
      const fallbackFeatured =
        featured.find((f) => f.artist.toLowerCase().includes(artist.toLowerCase())) ||
        featured[i] ||
        featured[0];
      const seedVideoId = seedTrack ? seedTrack.trackId : fallbackFeatured?.id || '';
      const thumb = seedTrack?.thumbnailUrl || fallbackFeatured?.thumbnailUrl || '';

      const otherArtists = finalArtists.filter((a) => a !== artist).slice(0, 3);
      const subtitle = `${otherArtists.join(', ')} és továbbiak...`;

      const radioTracks: SearchResult[] = artistTracks.map(toSearchResult);
      if (radioTracks.length < 5 && seedVideoId) {
        try {
          const upNext = await innertube.music.getUpNext(seedVideoId);
          if (upNext.contents) {
            for (const rawItem of upNext.contents) {
              const item = rawItem as YTItem;
              const vidId = item.id || item.endpoint?.payload?.videoId;
              if (!vidId) continue;
              if (!radioTracks.some((rt) => rt.id === vidId)) {
                radioTracks.push({
                  id: String(vidId),
                  type: 'song',
                  title: String(item.title?.toString() || 'Unknown'),
                  artist: extractArtistName(item),
                  thumbnailUrl: extractThumbnail(item),
                  durationSeconds: extractDuration(item)
                });
              }
              if (radioTracks.length >= 10) break;
            }
          }
        } catch {
          void 0;
        }
      }

      radios.push({
        id: `radio-${artist.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${artist} rádió`,
        artist,
        subtitle,
        thumbnailUrl: thumb,
        color: RADIO_COLORS[i % RADIO_COLORS.length] || '#ef4444',
        seedVideoId,
        tracks: radioTracks
      });
    }

    return {
      dailyMixes,
      radios,
      listenAgain,
      featured: featured.length > 0 ? featured : pool.slice(0, 15).map(toSearchResult)
    };
  },
  {
    maxAge: 60 * 30,
    name: 'home-discovery',
    getKey: async (event) => {
      const session = await useAppSession(event);
      return `discovery-${session.data.user?.sub || 'guest'}`;
    }
  }
);
