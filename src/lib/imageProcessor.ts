export async function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }

        // Apply a slight crop to remove status bar and bottom nav (approx 5% top and bottom)
        const cropY = img.height * 0.08;
        const cropHeight = img.height - (cropY * 2);
        
        canvas.width = img.width;
        canvas.height = cropHeight;

        // Draw cropped image
        ctx.drawImage(img, 0, cropY, img.width, cropHeight, 0, 0, canvas.width, canvas.height);

        // Apply "document scanner" filter: Grayscale and high contrast
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Weighted grayscale
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          // Increase contrast (thresholding)
          if (gray > 160) {
            gray = 255; // White background
          } else {
            gray = Math.max(0, gray - 50); // Darker text
          }

          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
