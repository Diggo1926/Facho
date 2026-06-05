export function getMicrolinkScreenshot(url) {
  if (!url) return null;
  return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
}
