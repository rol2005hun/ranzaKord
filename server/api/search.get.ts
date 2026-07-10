import { UserModel } from '../models/User';
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
      throw createError({ statusCode: 400, message: t('search.errors.missingQuery') });
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
      authors?: Array<{ name?: string; channel_id?: string }>;
      artists?: Array<{ name?: string; channel_id?: string }>;
      author?:
        | { toString: () => string; name?: string; channel_id?: string }
        | Array<{ name?: string; channel_id?: string }>
        | string;
      subtitle?: { toString: () => string; name?: string } | Array<{ name?: string }> | string;
      thumbnails?: Array<{ url: string; width?: number }>;
      thumbnail?: { contents?: Array<{ url: string; width?: number }> };
      duration?: { seconds?: number } | number;
      flex_columns?: Array<{
        title?: {
          runs?: Array<{
            text?: string;
            endpoint?: {
              payload?: { videoId?: string; browseId?: string };
              metadata?: { pageType?: string };
            };
          }>;
        };
      }>;
    };

    const parseItem = (rawItem: unknown, forceType?: SearchResultType): SearchResult | null => {
      const item = rawItem as YTItem;
      const id =
        item.id ||
        item.browse_id ||
        item.endpoint?.payload?.videoId ||
        item.endpoint?.payload?.browseId ||
        item.flex_columns?.[0]?.title?.runs?.[0]?.endpoint?.payload?.videoId;
      if (!id || typeof id !== 'string') return null;

      const title = item.title?.toString() || item.name?.toString() || '';
      if (!title) return null;

      let parsedType: SearchResultType = forceType || 'song';
      if (!forceType) {
        const isArtist =
          item.type === 'MusicArtist' ||
          item.item_type === 'artist' ||
          item.endpoint?.metadata?.pageType === 'MUSIC_PAGE_TYPE_ARTIST' ||
          item.endpoint?.metadata?.pageType === 'MUSIC_PAGE_TYPE_USER_CHANNEL';
        const isAlbum =
          item.type === 'MusicAlbum' ||
          item.item_type === 'album' ||
          item.endpoint?.metadata?.pageType === 'MUSIC_PAGE_TYPE_ALBUM';
        const isPlaylist =
          item.type === 'MusicPlaylist' ||
          item.item_type === 'playlist' ||
          item.endpoint?.metadata?.pageType === 'MUSIC_PAGE_TYPE_PLAYLIST' ||
          item.endpoint?.metadata?.pageType === 'MUSIC_PAGE_TYPE_PODCAST_SHOW_DETAIL_PAGE';
        const isSong =
          item.type === 'MusicSong' || item.item_type === 'song' || item.endpoint?.payload?.videoId;

        if (isArtist) parsedType = 'artist';
        else if (isAlbum) parsedType = 'album';
        else if (isPlaylist) parsedType = 'playlist';
        else if (isSong) parsedType = 'song';
      }

      let artistName = '';
      let artists: Array<{ name: string; id?: string }> = [];

      if (
        item.authors &&
        Array.isArray(item.authors) &&
        item.authors.length > 0 &&
        item.authors[0]?.name
      ) {
        artists = item.authors.map((a) => ({ name: a.name || '', id: a.channel_id }));
        artistName = artists.map((a) => a.name).join(', ');
      } else if (
        item.artists &&
        Array.isArray(item.artists) &&
        item.artists.length > 0 &&
        item.artists[0]?.name
      ) {
        artists = item.artists.map((a) => ({ name: a.name || '', id: a.channel_id }));
        artistName = artists.map((a) => a.name).join(', ');
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

      // Ensure space after commas in artistName if YouTube returned it without space
      if (artistName) {
        artistName = artistName.replace(/,([^\s])/g, ', $1');
      }

      let artistId: string | undefined = undefined;
      if (item.artists?.[0]?.channel_id) {
        artistId = item.artists[0].channel_id;
      } else if (item.authors?.[0]?.channel_id) {
        artistId = item.authors[0].channel_id;
      } else if (
        item.author &&
        typeof item.author === 'object' &&
        'channel_id' in item.author &&
        !Array.isArray(item.author)
      ) {
        artistId = item.author.channel_id;
      } else if (item.flex_columns?.[1]?.title?.runs) {
        for (const run of item.flex_columns[1].title.runs) {
          const pageType = run.endpoint?.metadata?.pageType;
          if (
            pageType === 'MUSIC_PAGE_TYPE_ARTIST' ||
            pageType === 'MUSIC_PAGE_TYPE_USER_CHANNEL'
          ) {
            if (!artistId) artistId = run.endpoint?.payload?.browseId;
            if (run.text && run.endpoint?.payload?.browseId) {
              const id = run.endpoint?.payload?.browseId;
              if (id && !artists.find((a) => a.id === id)) {
                artists.push({ name: run.text, id });
              }
            }
          }
        }
        if (artists.length > 0 && !artistName) {
          artistName = artists.map((a) => a.name).join(', ');
        }
        if (!artistName) {
          const rawText = item.flex_columns[1].title.runs
            .map((r: { text?: string }) => r.text || '')
            .join('');
          const parts = rawText.split('•').map((s: string) => s.trim());
          const firstPart = parts[0];
          const secondPart = parts[1];
          if (
            parts.length > 1 &&
            firstPart &&
            (firstPart.toLowerCase() === 'song' || firstPart.toLowerCase() === 'zene')
          ) {
            artistName = secondPart || '';
          } else if (parts.length > 0 && firstPart) {
            artistName = firstPart;
          }
        }
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
        artists: artists.length > 0 ? artists : undefined,
        artistId,
        albumId:
          typeof item.endpoint?.payload?.browseId === 'string'
            ? item.endpoint.payload.browseId
            : undefined,
        thumbnailUrl: thumbnail,
        durationSeconds: duration
      };
    };

    if (type === 'profile') {
      const dbUsers = await UserModel.find({
        isPublicProfile: true,
        name: { $regex: q.trim(), $options: 'i' }
      })
        .select('sub name picture')
        .limit(20)
        .lean();

      return dbUsers.map((u) => ({
        id: u.sub,
        type: 'profile',
        title: u.name,
        artist: 'ranzaKord Profil',
        thumbnailUrl: u.picture || ''
      }));
    }

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
      albums: [],
      profiles: []
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
          else if (sectionTitle.includes('playlist') || sectionTitle.includes('lejátszási lista'))
            forcedType = 'playlist';

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
            } else if (parsed.type === 'playlist') {
              // Store playlists in albums for now, since UI doesn't have a dedicated playlist shelf
              response.albums.push(parsed);
            }
          }
        }
      }
    }

    const dbUsers = await UserModel.find({
      isPublicProfile: true,
      name: { $regex: q.trim(), $options: 'i' }
    })
      .select('sub name picture')
      .limit(5)
      .lean();

    response.profiles = dbUsers.map((u) => ({
      id: u.sub,
      type: 'profile',
      title: u.name,
      artist: 'ranzaKord Profil',
      thumbnailUrl: u.picture || ''
    }));

    if (!response.topResult && response.profiles.length > 0) {
      response.topResult = response.profiles[0];
    } else if (!response.topResult && response.songs.length > 0) {
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
      return `${q}-${type}-v3`;
    }
  }
);
