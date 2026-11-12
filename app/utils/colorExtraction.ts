function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function rgbToHue(r: number, g: number, b: number): number {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  let h: number;
  if (max === r) h = (g - b) / (max - min);
  else if (max === g) h = 2 + (b - r) / (max - min);
  else h = 4 + (r - g) / (max - min);
  h *= 60;
  if (h < 0) h += 360;
  return h;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
}

export function getPalette(imageUrl: string): Promise<ColorPalette | null> {
  return new Promise((resolve) => {
    if (!import.meta.client) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      const size = 64;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      try {
        const data = ctx.getImageData(0, 0, size, size).data;
        const buckets = Array.from({ length: 36 }, () => ({ r: 0, g: 0, b: 0, count: 0 }));
        let totalCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3] ?? 0;
          if (alpha < 128) continue;

          const red = data[i] ?? 0;
          const green = data[i + 1] ?? 0;
          const blue = data[i + 2] ?? 0;

          const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
          if (luma < 30 || luma > 230) continue;

          const max = Math.max(red, green, blue);
          const min = Math.min(red, green, blue);
          const saturation = max === 0 ? 0 : (max - min) / max;

          if (saturation < 0.15) continue;

          const hue = rgbToHue(red, green, blue);
          const bucketIndex = Math.floor(hue / 10) % 36;

          const bucket = buckets[bucketIndex];
          if (bucket) {
            bucket.r += red;
            bucket.g += green;
            bucket.b += blue;
            bucket.count++;
          }
          totalCount++;
        }

        if (totalCount === 0) {
          let r = 0;
          let g = 0;
          let b = 0;
          let count = 0;
          for (let i = 0; i < data.length; i += 4) {
            r += data[i] ?? 0;
            g += data[i + 1] ?? 0;
            b += data[i + 2] ?? 0;
            count++;
          }
          if (count === 0) {
            resolve(null);
            return;
          }
          const hex = rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count));
          resolve({ primary: hex, secondary: hex });
          return;
        }

        const scoreBucket = (b: { r: number; g: number; b: number; count: number }) => {
          if (b.count === 0) return 0;
          const avgR = b.r / b.count;
          const avgG = b.g / b.count;
          const avgB = b.b / b.count;
          const max = Math.max(avgR, avgG, avgB);
          const min = Math.min(avgR, avgG, avgB);
          const sat = max === 0 ? 0 : (max - min) / max;
          return b.count * (1 + sat * 1.5);
        };

        buckets.sort((a, b) => scoreBucket(b) - scoreBucket(a));

        const primaryBucket = buckets[0];
        if (!primaryBucket) {
          resolve(null);
          return;
        }
        const primaryHex = rgbToHex(
          Math.round(primaryBucket.r / primaryBucket.count),
          Math.round(primaryBucket.g / primaryBucket.count),
          Math.round(primaryBucket.b / primaryBucket.count)
        );

        let secondaryHex = primaryHex;

        const primaryHue = rgbToHue(
          primaryBucket.r / primaryBucket.count,
          primaryBucket.g / primaryBucket.count,
          primaryBucket.b / primaryBucket.count
        );

        for (let i = 1; i < buckets.length; i++) {
          const bucket = buckets[i];
          if (!bucket || bucket.count < totalCount * 0.05) continue;

          const secHue = rgbToHue(
            bucket.r / bucket.count,
            bucket.g / bucket.count,
            bucket.b / bucket.count
          );

          let diff = Math.abs(primaryHue - secHue);
          if (diff > 180) diff = 360 - diff;

          if (diff >= 30) {
            secondaryHex = rgbToHex(
              Math.round(bucket.r / bucket.count),
              Math.round(bucket.g / bucket.count),
              Math.round(bucket.b / bucket.count)
            );
            break;
          }
        }

        resolve({ primary: primaryHex, secondary: secondaryHex });
      } catch (e) {
        console.warn('Failed to extract color palette', e);
        resolve(null);
      }
    };

    img.onerror = () => {
      console.warn('Failed to load image for color extraction');
      resolve(null);
    };

    img.src = imageUrl;
  });
}
