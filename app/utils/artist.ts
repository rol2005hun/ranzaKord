import type { TrackArtist } from '~/features/player/types/player.types';

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
      return parts.map((name) => ({ name: formatArtistName(name.trim()), id: undefined }));
    }
    return [{ name: formatArtistName(track.artist), id: track.artistId }];
  }

  return [];
}
