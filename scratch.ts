import { Innertube, UniversalCache } from 'youtubei.js';

async function main() {
  const innertube = await Innertube.create({
    cache: new UniversalCache(false),
    generate_session_locally: true
  });
  const artist = await innertube.music.getArtist('UCQO2B2fKkYpY-d6bS2g81fA'); // Dzsudlo or similar
  console.log(
    artist.sections.map((s) => ({ title: s.title?.toString(), numContents: s.contents?.length }))
  );

  // Let's dump the first item of the first section just to see the structure of TopSongs
  const topSongs = artist.sections[0];
  if (topSongs && topSongs.contents && topSongs.contents.length > 0) {
    console.log('FIRST ITEM:', JSON.stringify(topSongs.contents[0], null, 2));
  }
}

main().catch(console.error);
