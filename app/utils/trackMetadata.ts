export interface CleanTrackInfo {
  cleanTitle: string;
  cleanArtist: string;
}

export function cleanTrackMetadata(rawTitle: string, rawArtist: string): CleanTrackInfo {
  let title = (rawTitle || '').trim();
  let artist = (rawArtist || '').trim();

  const noiseRegex =
    /\s*[\(\[](?:official\s*(?:music\s*)?video|official\s*audio|official\s*lyric\s*video|lyric\s*video|lyrics|audio|visualizer|clip\s*officiel|official|video|hivatalos\s*(?:videóklip|videó|klip)|videóklip|videoklip|klip|hd|4k|hq|remastered|explicit|prod\.[^)]+)[\)\]]/gi;
  title = title.replace(noiseRegex, '').trim();

  const splitMatch = title.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (splitMatch && splitMatch[1] && splitMatch[2]) {
    const leftPart = splitMatch[1].trim();
    const rightPart = splitMatch[2].trim();

    if (
      !artist ||
      artist === 'Unknown Artist' ||
      artist.toLowerCase() === leftPart.toLowerCase() ||
      leftPart.toLowerCase().includes(artist.toLowerCase()) ||
      artist.toLowerCase().includes(leftPart.toLowerCase())
    ) {
      title = rightPart;
      if (!artist || artist === 'Unknown Artist') {
        artist = leftPart;
      }
    }
  }

  if (artist && title.toLowerCase().startsWith(artist.toLowerCase())) {
    const remainder = title
      .slice(artist.length)
      .replace(/^[\s-–—:]+/, '')
      .trim();
    if (remainder) {
      title = remainder;
    }
  }

  return {
    cleanTitle: title || rawTitle,
    cleanArtist: artist || rawArtist
  };
}
