export interface CompressImageOptions {
  maxDimension?: number;
  maxBytes?: number;
  quality?: number;
}

const dataUrlBytes = (value: string) => Math.ceil((value.split(',')[1]?.length ?? 0) * 0.75);

/**
 * Converts local/loaded images to a bounded WebP data URL so database requests
 * do not fail on multi-megabyte base64 payloads. WebP keeps transparency.
 */
export const compressImage = (
  source: File | string,
  { maxDimension = 1400, maxBytes = 1_500_000, quality = 0.82 }: CompressImageOptions = {},
): Promise<string> => new Promise((resolve, reject) => {
  const load = (src: string) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
      canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
      const context = canvas.getContext('2d');
      if (!context) return reject(new Error('Não foi possível preparar a imagem.'));
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      let width = canvas.width;
      let height = canvas.height;
      let result = '';
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const current = document.createElement('canvas');
        current.width = width;
        current.height = height;
        const currentContext = current.getContext('2d');
        if (!currentContext) break;
        currentContext.imageSmoothingEnabled = true;
        currentContext.imageSmoothingQuality = 'high';
        currentContext.drawImage(canvas, 0, 0, width, height);
        result = current.toDataURL('image/webp', Math.max(0.45, quality - attempt * 0.07));
        if (dataUrlBytes(result) <= maxBytes) return resolve(result);
        width = Math.max(320, Math.round(width * 0.8));
        height = Math.max(320, Math.round(height * 0.8));
      }
      if (result && dataUrlBytes(result) <= maxBytes * 1.15) return resolve(result);
      reject(new Error('Imagem ainda muito grande após a compressão.'));
    };
    image.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    image.src = src;
  };

  if (typeof source === 'string') return load(source);
  const reader = new FileReader();
  reader.onload = () => load(reader.result as string);
  reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
  reader.readAsDataURL(source);
});
