// src/utils/chartToImage.ts

/**
 * Converts an SVG element to a PNG data URL.
 * @param svgElement The <svg> element to convert.
 * @param width The desired width of the output PNG.
 * @param height The desired height of the output PNG.
 * @returns A promise that resolves with the base64 PNG data URL.
 */
export const svgToPng = (svgElement: SVGSVGElement, width: number, height: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Sanitize and serialize the SVG to an XML string
    const svgXml = new XMLSerializer().serializeToString(svgElement);

    // Create a base64-encoded SVG data URL.
    // Use `unescape` and `encodeURIComponent` to handle Unicode characters correctly.
    const svgBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgXml)))}`;

    const image = new Image();
    
    image.onload = () => {
      // Create a canvas to draw the image onto
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get 2D canvas context.'));
        return;
      }
      
      // Draw the SVG image onto the canvas
      ctx.drawImage(image, 0, 0, width, height);
      
      // Get the canvas content as a PNG data URL
      const pngDataUrl = canvas.toDataURL('image/png');
      resolve(pngDataUrl);
    };

    image.onerror = (e) => {
      console.error("Error loading SVG into Image object:", e);
      reject(new Error('Failed to load SVG into an image. The SVG might be malformed or contain unsupported elements.'));
    };

    // Set the source of the image to our SVG data URL
    image.src = svgBase64;
  });
};
