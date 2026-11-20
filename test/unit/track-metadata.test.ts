import { describe, it, expect } from 'vitest';
import { cleanTrackMetadata } from '../../app/utils/trackMetadata';

describe('trackMetadata utils', () => {
  it('strips artist prefix if title starts with artist name', () => {
    const result = cleanTrackMetadata('Nagy Bogi - Bulvár', 'Nagy Bogi');
    expect(result.cleanTitle).toBe('Bulvár');
    expect(result.cleanArtist).toBe('Nagy Bogi');
  });

  it('strips common official video noise and prefixes', () => {
    const result = cleanTrackMetadata(
      'VINI X NAGY BOGI - NEXT N GO (Official Music Video)',
      'Vini'
    );
    expect(result.cleanTitle).toBe('NEXT N GO');
    expect(result.cleanArtist).toBe('Vini');
  });

  it('handles Hungarian noise tags', () => {
    const result = cleanTrackMetadata(
      'Azért vannak a jó barátok (Hivatalos Videóklip)',
      'Máté Péter'
    );
    expect(result.cleanTitle).toBe('Azért vannak a jó barátok');
    expect(result.cleanArtist).toBe('Máté Péter');
  });

  it('cleans bracketed tags and extracts artist when artist is unknown', () => {
    const result = cleanTrackMetadata('Dzsúdló - LEVEGŐT [Official Audio]', 'Unknown Artist');
    expect(result.cleanTitle).toBe('LEVEGŐT');
    expect(result.cleanArtist).toBe('Dzsúdló');
  });

  it('leaves already clean titles and artists intact', () => {
    const result = cleanTrackMetadata('Bulvár', 'Nagy Bogi');
    expect(result.cleanTitle).toBe('Bulvár');
    expect(result.cleanArtist).toBe('Nagy Bogi');
  });
});
