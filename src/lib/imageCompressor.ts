/**
 * Utility to compress and resize images client-side before uploading/saving.
 * This prevents bloating the JSON database and ensures fast loading times.
 */
export function compressImage(
  file: File,
  maxWidthOrHeight: number = 1200,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If the file is an SVG or PDF, do not compress, just read as data URL
    if (file.type === "image/svg+xml" || file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error("Falha ao ler arquivo."));
        }
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo."));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidthOrHeight) {
              height = Math.round((height * maxWidthOrHeight) / width);
              width = maxWidthOrHeight;
            }
          } else {
            if (height > maxWidthOrHeight) {
              width = Math.round((width * maxWidthOrHeight) / height);
              height = maxWidthOrHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string); // Fallback to original if canvas context fails
            return;
          }

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Get the compressed base64 string
          // We use image/jpeg for compression support. PNG transparent logos can fallback to png if needed.
          const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
          const dataUrl = canvas.toDataURL(outputType, quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Erro ao carregar imagem para compressão."));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo de imagem."));
    reader.readAsDataURL(file);
  });
}
