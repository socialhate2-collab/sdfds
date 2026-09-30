/**
 * Optimizes and downscales uploaded image files (logos, backgrounds)
 * to prevent localStorage and memory quota exhaustion.
 */
export async function optimizeImageFile(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'image/jpeg' | 'image/png' | 'image/webp';
  } = {}
): Promise<string> {
  const {
    maxWidth = 1080,
    maxHeight = 1080,
    quality = 0.82,
    format = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error reading image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image data'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original string if 2D context fails
          resolve(e.target?.result as string);
          return;
        }

        // Draw and compress
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const dataUrl = canvas.toDataURL(format, quality);
          resolve(dataUrl);
        } catch {
          // If toDataURL fails, fallback to JPEG
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Specifically optimizes a brand logo (small, crisp, transparency-friendly)
 */
export async function optimizeBrandLogo(file: File): Promise<string> {
  return optimizeImageFile(file, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.88,
    format: 'image/png'
  });
}

/**
 * Specifically optimizes a background arena or court texture
 */
export async function optimizeBackgroundCourt(file: File): Promise<string> {
  return optimizeImageFile(file, {
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 0.80,
    format: 'image/jpeg'
  });
}
