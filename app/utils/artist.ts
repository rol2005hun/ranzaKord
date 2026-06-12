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
    return [{ name: track.artist, id: track.artistId }];
  }

  return [];
}
