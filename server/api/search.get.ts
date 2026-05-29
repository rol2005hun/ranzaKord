import type {
  CategorizedSearchResults,
  SearchResult,
  SearchResultType
} from '../../app/features/search/types/search.types';

export default defineCachedEventHandler(
  async (event): Promise<CategorizedSearchResults | SearchResult[]> => {
    const query = getQuery(event);
    const q = query['q'] as string | undefined;
    const type = query['type'] as string | undefined;

    const { t } = useServerTranslation(event);

    if (!q) {
      throw createError({ statusCode: 400, statusMessage: t('search.errors.missingQuery') });
    }

    const innertube = await createInnertube(false);

    type YTItem = {
      id?: string;
      browse_id?: string;
      endpoint?: {
        payload?: { videoId?: string; browseId?: string };
        metadata?: { pageType?: string };
      };
      title?: { toString: () => string };
      name?: { toString: () => string };
      type?: string;
      item_type?: string;
      authors?: Array<{ name?: string }>;
      artists?: Array<{ name?: string }>;
      author?: { toString: () => string; name?: string } | Array<{ name?: string }> | string;
      subtitle?: { toString: () => string; name?: string } | Array<{ name?: string }> | string;
      thumbnails?: Array<{ url: string; width?: number }>;
      thumbnail?: { contents?: Array<{ url: string; width?: number }> };
      duration?: { seconds?: number } | number;
    };

    const parseItem = (rawItem: unknown, forceType?: SearchResultType): SearchResult | null => {
      const item = rawItem as YTItem;
      const id =
        item.id ||
        item.browse_id ||
        item.endpoint?.payload?.videoId ||
        item.endpoint?.payload?.browseId;
      if (!id || typeof id !== 'string') return null;

      const title = item.title?.toString() || item.name?.toString() || '';
      if (!title) return null;

      let parsedType: SearchResultType = forceType || 'song';
      if (!forceType) {
        const isArtist =
          item.type === 'MusicArtist' ||
          item.item_type === 'artist' ||
          item.endpoint?.metadata?.pageType === 'MUSIC_PAGE_TYPE_ARTIST';
        const isAlbum =
          item.type === 'MusicAlbum' ||
          item.item_type === 'album' ||
          item.endpoint?.metadata?.pageType === 'MUSIC_PAGE_TYPE_ALBUM';
        const isSong =
          item.type === 'MusicSong' || item.item_type === 'song' || item.endpoint?.payload?.videoId;

        if (isArtist) parsedType = 'artist';
        else if (isAlbum) parsedType = 'album';
        else if (isSong) parsedType = 'song';
      }

      let artistName = '';
      if (item.authors?.[0]?.name) {
        artistName = item.authors[0].name;
      } else if (item.artists?.[0]?.name) {
        artistName = item.artists[0].name;
      } else if (Array.isArray(item.author) && item.author[0]?.name) {
        artistName = item.author[0].name;
      } else if (
        item.author &&
        typeof item.author === 'object' &&
        'name' in item.author &&
        !Array.isArray(item.author)
      ) {
        artistName = item.author.name || '';
      } else if (
        item.author &&
        typeof item.author.toString === 'function' &&
        item.author.toString() !== '[object Object]'
      ) {
        artistName = item.author.toString();
      } else if (Array.isArray(item.subtitle) && item.subtitle[0]?.name) {
        artistName = item.subtitle[0].name;
      } else if (
        item.subtitle &&
        typeof item.subtitle === 'object' &&
        'name' in item.subtitle &&
        !Array.isArray(item.subtitle)
      ) {
        artistName = item.subtitle.name || '';
      } else if (
        item.subtitle &&
        typeof item.subtitle.toString === 'function' &&
        item.subtitle.toString() !== '[object Object]'
      ) {
        artistName = item.subtitle.toString();
      }

      let thumbnail = '';
      const thumbs = item.thumbnails || item.thumbnail?.contents;
      if (Array.isArray(thumbs) && thumbs.length > 0) {
        thumbnail = thumbs.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || '';
      }

      let duration = 0;
      if (
        item.duration &&
        typeof item.duration === 'object' &&
        'seconds' in item.duration &&
        item.duration.seconds
      ) {
        duration = item.duration.seconds;
      } else if (typeof item.duration === 'number') {
        duration = item.duration;
      }

      return {
        id,
        type: parsedType,
        title,
        artist: artistName,
        thumbnailUrl: thumbnail,
        durationSeconds: duration
      };
    };

    if (type === 'song' || type === 'artist' || type === 'album') {
      const results = await innertube.music.search(q.trim(), { type });
      const items: SearchResult[] = [];
      if (results.contents) {
        for (const section of results.contents) {
          if (!('contents' in section) || !Array.isArray(section.contents)) continue;
          for (const item of section.contents) {
            const parsed = parseItem(item, type as SearchResultType);
            if (parsed) items.push(parsed);
            if (items.length >= 20) break;
          }
        }
      }
      return items;
    }

    const results = await innertube.music.search(q.trim());
    const response: CategorizedSearchResults = {
      songs: [],
      artists: [],
      albums: []
    };

    if (results.contents) {
      for (const section of results.contents) {
        const sectionTitle =
          (section as unknown as { title?: { toString: () => string } }).title
            ?.toString()
            ?.toLowerCase() || '';
        if (!('contents' in section) || !Array.isArray(section.contents)) continue;

        for (const item of section.contents) {
          let forcedType: SearchResultType | undefined;
          if (sectionTitle.includes('song') || sectionTitle.includes('dalok')) forcedType = 'song';
          else if (sectionTitle.includes('artist') || sectionTitle.includes('előadó'))
            forcedType = 'artist';
          else if (sectionTitle.includes('album') || sectionTitle.includes('albumok'))
            forcedType = 'album';

          const parsed = parseItem(item, forcedType);
          if (parsed) {
            if (sectionTitle.includes('top result') || sectionTitle.includes('legjobb találat')) {
              if (!response.topResult) response.topResult = parsed;
            } else if (parsed.type === 'song') {
              response.songs.push(parsed);
            } else if (parsed.type === 'artist') {
              response.artists.push(parsed);
            } else if (parsed.type === 'album') {
              response.albums.push(parsed);
            }
          }
        }
      }
    }

    if (!response.topResult && response.songs.length > 0) {
      response.topResult = response.songs[0];
    }

    response.songs = response.songs.slice(0, 5);
    response.artists = response.artists.slice(0, 10);
    response.albums = response.albums.slice(0, 10);

    return response;
  },
  {
    maxAge: 60 * 60 * 12,
    name: 'youtube-search',
    getKey: (event) => {
      const query = getQuery(event);
      const q = String(query['q'] || '')
        .trim()
        .toLowerCase();
      const type = String(query['type'] || 'all');
      return `${q}-${type}-v2`;
    }
  }
);
