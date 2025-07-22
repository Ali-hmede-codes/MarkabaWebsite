/**
 * Custom image loader for Next.js to bypass optimization and CORS issues
 * This loader simply returns the original src URL without any modifications
 */

export default function imageLoader({ src, width, quality }) {
  // Return the original src without any modifications
  // This bypasses Next.js image optimization completely
  return src;
}