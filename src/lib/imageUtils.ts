/**
 * Utility to compress image files / data URLs to tiny canvas data URLs (under 50KB)
 * to safely store in Firestore documents without hitting the 1MB limit.
 */

export function compressImageToDataUrl(
  source: File | string,
  maxDim = 160,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const processImage = (img: HTMLImageElement) => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(img.src);
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressedDataUrl = canvas.toDataURL('image/png');
      resolve(compressedDataUrl);
    };

    if (typeof source === 'string') {
      if (!source.startsWith('data:image/')) {
        // HTTP URL or preset URL
        resolve(source);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onerror = () => resolve(source);
      img.onload = () => processImage(img);
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => processImage(img);
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(source);
    }
  });
}
