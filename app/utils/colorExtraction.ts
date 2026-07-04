function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function getDominantColor(imageUrl: string): Promise<string | null> {
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

      // Scale down significantly for performance and to act as a blur/average
      const size = 64;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      try {
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0,
          g = 0,
          b = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          // Skip highly transparent pixels
          const alpha = data[i + 3] ?? 0;
          if (alpha < 128) continue;

          const red = data[i] ?? 0;
          const green = data[i + 1] ?? 0;
          const blue = data[i + 2] ?? 0;

          // Calculate luminance to filter out extremes (very dark or very light)
          const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
          if (luma < 20 || luma > 230) continue;

          // Optional: filter out greyish colors to prioritize vibrancy
          const max = Math.max(red, green, blue);
          const min = Math.min(red, green, blue);
          const saturation = max === 0 ? 0 : (max - min) / max;

          if (saturation < 0.1) continue;

          r += red;
          g += green;
          b += blue;
          count++;
        }

        // If all pixels were skipped (e.g. black and white image), do a fallback without the saturation/luma filter
        if (count === 0) {
          for (let i = 0; i < data.length; i += 4) {
            r += data[i] ?? 0;
            g += data[i + 1] ?? 0;
            b += data[i + 2] ?? 0;
            count++;
          }
        }

        if (count === 0) {
          resolve(null);
          return;
        }

        resolve(rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count)));
      } catch (e) {
        console.warn('Failed to extract color', e);
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
