import { Innertube } from 'youtubei.js';

async function main() {
  const yt = await Innertube.create();
  try {
    const info = await yt.getBasicInfo('kIft-LUHHVA', { client: 'ANDROID' });
    console.log('ANDROID streaming data:', info.streaming_data ? 'YES' : 'NO');
    if (info.streaming_data) {
        console.log('Formats:', info.streaming_data.formats?.length);
        console.log('Adaptive:', info.streaming_data.adaptive_formats?.length);
    }
  } catch (e) {
    console.error('ANDROID error:', e);
  }
  try {
    const info2 = await yt.getBasicInfo('kIft-LUHHVA', { client: 'IOS' });
    console.log('IOS streaming data:', info2.streaming_data ? 'YES' : 'NO');
  } catch (e) {
    console.error('IOS error:', e);
  }
  try {
    const info3 = await yt.getBasicInfo('kIft-LUHHVA', { client: 'TV' });
    console.log('TV streaming data:', info3.streaming_data ? 'YES' : 'NO');
  } catch (e) {
    console.error('TV error:', e);
  }
}

main();
