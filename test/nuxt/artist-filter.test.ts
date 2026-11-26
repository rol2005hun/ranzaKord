import { describe, it, expect } from 'vitest';

import { isTrackByArtist } from '../../app/utils/artist';

describe('isTrackByArtist', () => {
  const artistId = 'UCvsLP93cA1a_alEqon6mDbw';
  const artistName = 'Belano';

  it('matches when artistId or artists array id matches', () => {
    expect(isTrackByArtist({ artistId, artist: 'BELANO' }, artistId, artistName)).toBe(true);
    expect(
      isTrackByArtist(
        {
          artist: 'Other, Belano',
          artists: [
            { name: 'Other', id: 'UCother' },
            { name: 'Belano', id: artistId }
          ]
        },
        artistId,
        artistName
      )
    ).toBe(true);
  });

  it('rejects tracks with resolved non-matching artist IDs even if name matches', () => {
    expect(
      isTrackByArtist({ artistId: 'UCdifferent', artist: 'Belano' }, artistId, artistName)
    ).toBe(false);
    expect(
      isTrackByArtist(
        {
          artist: 'Heges Belano',
          artists: [{ name: 'Heges Belano', id: 'UCheges' }]
        },
        artistId,
        artistName
      )
    ).toBe(false);
  });

  it('rejects similar-name artists when no channel ID is present', () => {
    expect(isTrackByArtist({ artist: 'Heges Belano' }, artistId, artistName)).toBe(false);
    expect(isTrackByArtist({ artist: 'Isobel Belano' }, artistId, artistName)).toBe(false);
    expect(isTrackByArtist({ artist: "Belano Reséndez Yol Te'" }, artistId, artistName)).toBe(
      false
    );
  });

  it('matches exact artist or collaborations when no channel ID is present', () => {
    expect(isTrackByArtist({ artist: 'BELANO' }, artistId, artistName)).toBe(true);
    expect(isTrackByArtist({ artist: 'Belano, Other Artist' }, artistId, artistName)).toBe(true);
    expect(isTrackByArtist({ artist: 'Other feat. Belano' }, artistId, artistName)).toBe(true);
  });
});
