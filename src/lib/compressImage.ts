export const MAX_IMAGES = 5;

export async function fileToCompressedDataUrl(
  file: File,
  opts: { maxDim?: number; quality?: number } = {}
): Promise<string> {
  const maxDim = opts.maxDim || 1280;
  const quality = opts.quality ?? 0.72;

  const dataUrl = await readFile(file);
  if (file.size <= 400 * 1024) return dataUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export function estimateDataUrlKB(dataUrl: string): number {
  return Math.round((dataUrl.length * 3) / 4 / 1024);
}