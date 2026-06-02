import { Innertube } from 'youtubei.js';

async function main() {
  const innertube = await Innertube.create();

  const playlist = await innertube.music.getPlaylist('VLOLAK5uy_lPU27bl-eiMkzqrmYTl6Ev2_BgdHpFFwA');
  console.log('Playlist items:', playlist.items?.length);
  if (playlist.items && playlist.items.length > 0) {
    console.log('First item:', playlist.items[0]);
  }
}

main().catch(console.error);
