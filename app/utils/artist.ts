import type { TrackArtist } from '~/features/player/types/player.types';

export function getTrackArtists(track?: {
  artist?: string;
  artists?: TrackArtist[];
  artistId?: string;
}): TrackArtist[] {
  if (!track) return [];

  if (track.artists && track.artists.length > 0) {
    return track.artists;
  }

  if (track.artist) {
    const parts = track.artist.split(/\s*,\s*/);
    if (parts.length > 1) {
      return parts.map((name) => ({ name: name.trim(), id: undefined }));
    }
    return [{ name: track.artist, id: track.artistId }];
  }

  return [];
}
