import type { TrackArtist } from '@/features/player/types/player.types';

export function formatArtistName(name: string): string {
  if (!name) return name;
  if (name === name.toUpperCase() || name === name.toLowerCase()) {
    return name
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  return name;
}

export function getTrackArtists(track?: {
  artist?: string;
  artists?: TrackArtist[];
  artistId?: string;
}): TrackArtist[] {
  if (!track) return [];

  if (track.artists && track.artists.length > 0) {
    return track.artists.map((a) => ({ ...a, name: formatArtistName(a.name) }));
  }

  if (track.artist) {
    const parts = track.artist.split(/\s*,\s*/);
    if (parts.length > 1) {
      return parts.map((name, idx) => ({
        name: formatArtistName(name.trim()),
        id: idx === 0 ? track.artistId : undefined
      }));
    }
    return [{ name: formatArtistName(track.artist), id: track.artistId }];
  }

  return [];
}

export function isTrackByArtist(
  item: {
    artist?: string;
    artists?: TrackArtist[];
    artistId?: string;
  },
  targetArtistId: string,
  targetArtistName?: string
): boolean {
  if (item.artistId === targetArtistId || item.artists?.some((a) => a.id === targetArtistId)) {
    return true;
  }

  const hasResolvedIds =
    Boolean(item.artistId) || Boolean(item.artists?.some((a) => Boolean(a.id)));
  if (hasResolvedIds) {
    return false;
  }

  if (!targetArtistName) return false;
  const normalizedTarget = targetArtistName.trim().toLowerCase();
  if (!normalizedTarget) return false;

  if (item.artists && item.artists.length > 0) {
    return item.artists.some((a) => a.name.trim().toLowerCase() === normalizedTarget);
  }

  if (item.artist) {
    const parts = item.artist
      .split(/\s*(?:,|&|\bfeat\.?(?=\s|$)|\bft\.?(?=\s|$)|\bx\b)\s*/i)
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean);
    return parts.includes(normalizedTarget);
  }

  return false;
}
