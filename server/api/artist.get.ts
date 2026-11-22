import type { ArtistDetail, SearchResult } from '../../app/features/search/types/search.types';

export default defineCachedEventHandler(
  async (event): Promise<ArtistDetail> => {
    const query = getQuery(event);
    const id = query['id'] as string | undefined;

    const { t } = useServerTranslation(event);

    if (!id) {
      throw createError({ statusCode: 400, message: t('search.errors.missingArtistId') });
    }

    const innertube = await createInnertube(false);

    try {
      type YTHeader = {
        title?: { toString: () => string };
        description?: { toString: () => string };
      };

      type YTSection = {
        title?: { toString: () => string };
        contents?: Array<unknown>;
      };

      type YTItem = {
        id?: string;
        endpoint?: { payload?: { videoId?: string; browseId?: string } };
        title?: { toString: () => string };
        name?: { toString: () => string };
        authors?: Array<{ name?: string; channel_id?: string }>;
        thumbnails?: Array<{ url: string }>;
        duration?: { seconds?: number };
        type?: string;
        flex_columns?: Array<{
          title?: { toString: () => string; runs?: Array<{ text: string }> };
        }>;
      };

      let targetBrowseId = id;
      if (
        !targetBrowseId.startsWith('UC') &&
        !targetBrowseId.startsWith('FEmusic_library_corpus_track_artists_')
      ) {
        try {
          const cleanName = targetBrowseId.replace(/\s*-\s*(topic|téma)$/i, '').trim();
          const searchRes = await innertube.music.search(cleanName, { type: 'artist' });
          let exactMatchId: string | undefined;
          let firstMatchId: string | undefined;

          if (searchRes.contents) {
            for (const section of searchRes.contents) {
              if (!('contents' in section) || !Array.isArray(section.contents)) continue;
              for (const raw of section.contents) {
                const it = raw as YTItem;
                const foundId = it.id || it.endpoint?.payload?.browseId;
                if (!foundId || !foundId.startsWith('UC')) continue;
                if (!firstMatchId) firstMatchId = foundId;
                const itemName = (it.name?.toString() || it.title?.toString() || '').trim();
                if (itemName.toLowerCase() === cleanName.toLowerCase()) {
                  exactMatchId = foundId;
                  break;
                }
              }
              if (exactMatchId) break;
            }
          }
          if (exactMatchId) {
            targetBrowseId = exactMatchId;
          } else if (firstMatchId) {
            targetBrowseId = firstMatchId;
          }
        } catch {
          void 0;
        }
      }

      const artist = await innertube.music.getArtist(targetBrowseId);

      const header = artist.header as YTHeader | undefined;

      const name = header?.title?.toString() || 'Unknown Artist';
      let description = header?.description?.toString() || '';

      let thumbnailUrl = '';

      if (header) {
        const h = header as unknown as {
          thumbnails?: Array<{ url: string }>;
          foreground_thumbnails?: Array<{ url: string }>;
          thumbnail?: { contents?: Array<{ url: string }> };
        };
        const hThumb =
          h.thumbnails?.[0]?.url ||
          h.foreground_thumbnails?.[0]?.url ||
          h.thumbnail?.contents?.[0]?.url;
        if (hThumb) thumbnailUrl = hThumb;
      }

      if (!thumbnailUrl) {
        const rawVisuals = (artist as unknown as { visuals?: { avatar?: Array<{ url: string }> } })
          ?.visuals;
        if (rawVisuals?.avatar?.[0]?.url) {
          thumbnailUrl = rawVisuals.avatar[0].url;
        }
      }

      const topSongs: SearchResult[] = [];
      const albums: SearchResult[] = [];

      if (artist.sections) {
        for (const rawSection of artist.sections) {
          const section = rawSection as YTSection;
          const title = section.title?.toString()?.toLowerCase() || '';

          if (
            title.includes('song') ||
            title.includes('dal') ||
            title.includes('top') ||
            title.includes('szám') ||
            title.includes('popular') ||
            title.includes('népszerű')
          ) {
            if (section.contents) {
              for (const rawItem of section.contents) {
                const item = rawItem as YTItem;
                const videoId = item.id || item.endpoint?.payload?.videoId;
                if (!videoId) continue;

                const trackTitle = item.title?.toString() || item.name?.toString() || '';
                const trackArtist = item.authors?.[0]?.name || name;
                const trackArtistId = item.authors?.[0]?.channel_id || id;
                const trackThumb = item.thumbnails?.[0]?.url || '';

                if (!thumbnailUrl && trackThumb) thumbnailUrl = trackThumb;

                let duration = 0;
                if (item.duration?.seconds) {
                  duration = item.duration.seconds;
                }

                let plays = '';
                if (item.flex_columns) {
                  for (const col of item.flex_columns) {
                    const text = col.title?.runs?.[0]?.text || col.title?.toString() || '';
                    if (
                      text.toLowerCase().includes('play') ||
                      text.toLowerCase().includes('megtekintés') ||
                      text.match(/^\d+[KMB]\s/)
                    ) {
                      plays = text;
                    } else if (text.match(/^\d+:\d+/)) {
                      const parts = text.split(':');
                      if (parts.length === 2) {
                        duration = parseInt(parts[0] || '0') * 60 + parseInt(parts[1] || '0');
                      } else if (parts.length === 3) {
                        duration =
                          parseInt(parts[0] || '0') * 3600 +
                          parseInt(parts[1] || '0') * 60 +
                          parseInt(parts[2] || '0');
                      }
                    }
                  }
                }

                topSongs.push({
                  id: videoId,
                  type: 'song',
                  title: trackTitle,
                  artist: trackArtist,
                  artistId: trackArtistId,
                  thumbnailUrl: trackThumb,
                  durationSeconds: duration,
                  plays
                });
              }
            }
          } else if (
            title.includes('album') ||
            title.includes('single') ||
            title.includes('kiadás') ||
            title.includes('kislemez') ||
            title.includes('ep')
          ) {
            if (section.contents) {
              for (const rawItem of section.contents) {
                const item = rawItem as YTItem;
                const browseId = item.id || item.endpoint?.payload?.browseId;
                if (!browseId) continue;

                const albumTitle = item.title?.toString() || item.name?.toString() || '';
                const albumThumb = item.thumbnails?.[0]?.url || '';

                if (!thumbnailUrl && albumThumb) thumbnailUrl = albumThumb;

                albums.push({
                  id: browseId,
                  type: 'album',
                  title: albumTitle,
                  artist: name,
                  thumbnailUrl: albumThumb
                });
              }
            }
          }
        }
      }

      if (topSongs.length === 0 && albums.length === 0 && name && name !== 'Unknown Artist') {
        try {
          const cleanName = name.replace(/\s*-\s*(topic|téma)$/i, '').trim();
          const searchRes = await innertube.music.search(cleanName, { type: 'artist' });
          let officialId = '';
          if (searchRes.contents) {
            for (const section of searchRes.contents) {
              if (!('contents' in section) || !Array.isArray(section.contents)) continue;
              for (const raw of section.contents) {
                const it = raw as YTItem;
                const foundId = it.id || it.endpoint?.payload?.browseId;
                if (foundId && foundId !== targetBrowseId) {
                  officialId = foundId;
                  break;
                }
              }
              if (officialId) break;
            }
          }
          if (officialId) {
            targetBrowseId = officialId;
            const officialArtist = await innertube.music.getArtist(officialId);
            const offHeader = officialArtist.header as YTHeader | undefined;
            if (offHeader) {
              const h = offHeader as unknown as {
                thumbnails?: Array<{ url: string }>;
                foreground_thumbnails?: Array<{ url: string }>;
                thumbnail?: { contents?: Array<{ url: string }> };
              };
              const hThumb =
                h.thumbnails?.[0]?.url ||
                h.foreground_thumbnails?.[0]?.url ||
                h.thumbnail?.contents?.[0]?.url;
              if (hThumb && !thumbnailUrl) thumbnailUrl = hThumb;
              if (offHeader.description?.toString() && !description) {
                description = offHeader.description.toString();
              }
            }

            if (officialArtist.sections) {
              for (const rawSection of officialArtist.sections) {
                const section = rawSection as YTSection;
                const secTitle = section.title?.toString()?.toLowerCase() || '';

                if (
                  secTitle.includes('song') ||
                  secTitle.includes('dal') ||
                  secTitle.includes('top') ||
                  secTitle.includes('szám') ||
                  secTitle.includes('popular') ||
                  secTitle.includes('népszerű')
                ) {
                  if (section.contents && topSongs.length === 0) {
                    for (const rawItem of section.contents) {
                      const item = rawItem as YTItem;
                      const videoId = item.id || item.endpoint?.payload?.videoId;
                      if (!videoId) continue;

                      const trackTitle = item.title?.toString() || item.name?.toString() || '';
                      const trackArtist = item.authors?.[0]?.name || name;
                      const trackArtistId = item.authors?.[0]?.channel_id || id;
                      const trackThumb = item.thumbnails?.[0]?.url || '';

                      if (!thumbnailUrl && trackThumb) thumbnailUrl = trackThumb;

                      let duration = 0;
                      if (item.duration?.seconds) {
                        duration = item.duration.seconds;
                      }

                      topSongs.push({
                        id: videoId,
                        type: 'song',
                        title: trackTitle,
                        artist: trackArtist,
                        artistId: trackArtistId,
                        thumbnailUrl: trackThumb,
                        durationSeconds: duration
                      });
                    }
                  }
                } else if (
                  secTitle.includes('album') ||
                  secTitle.includes('single') ||
                  secTitle.includes('kiadás') ||
                  secTitle.includes('kislemez') ||
                  secTitle.includes('ep')
                ) {
                  if (section.contents && albums.length === 0) {
                    for (const rawItem of section.contents) {
                      const item = rawItem as YTItem;
                      const browseId = item.id || item.endpoint?.payload?.browseId;
                      if (!browseId) continue;

                      const albumTitle = item.title?.toString() || item.name?.toString() || '';
                      const albumThumb = item.thumbnails?.[0]?.url || '';

                      if (!thumbnailUrl && albumThumb) thumbnailUrl = albumThumb;

                      albums.push({
                        id: browseId,
                        type: 'album',
                        title: albumTitle,
                        artist: name,
                        thumbnailUrl: albumThumb
                      });
                    }
                  }
                }
              }
            }
          }
        } catch {
          void 0;
        }
      }

      return {
        id: targetBrowseId,
        name,
        description,
        thumbnailUrl,
        topSongs,
        albums
      };
    } catch (error: unknown) {
      console.error('artist.get.ts error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw createError({
        statusCode: 500,
        message: errorMessage || t('search.errors.fetchArtistFailed')
      });
    }
  },
  {
    maxAge: 60 * 60 * 12,
    name: 'artist-details-v3',
    getKey: (event) => {
      const query = getQuery(event);
      return String(query['id'] || 'none');
    }
  }
);
