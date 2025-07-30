/**
 * Enhanced image utility functions for handling image URLs with performance optimizations
 * Includes WebP support, caching, and better error handling
 */

// Cache for validated image URLs
const imageUrlCache = new Map<string, boolean>();

// Get the backend URL for serving images
const getBackendUrl = (): string => {
  // Use the configured server URL, preserving HTTPS in production
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://api.markaba.news';
  
  // In development, use HTTP and port 5000
  if (process.env.NODE_ENV === 'development') {
    return serverUrl.replace(':3443', ':5000').replace('https:', 'http:');
  }
  
  // In production, keep HTTPS and use the configured domain
  return serverUrl;
};

/**
 * Check if browser supports WebP format
 */
const supportsWebP = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

/**
 * Generate optimized image URL with WebP support and size parameters
 */
const getOptimizedImageUrl = (imagePath: string, width?: number, height?: number, quality: number = 75): string => {
  const baseUrl = getImageUrl(imagePath);
  
  // If it's already a complete URL or placeholder, return as is
  if (baseUrl === '/placeholder.svg' || baseUrl.startsWith('data:')) {
    return baseUrl;
  }
  
  const params = new URLSearchParams();
  
  // Add WebP format if supported
  if (supportsWebP()) {
    params.append('format', 'webp');
  }
  
  // Add size parameters
  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  
  // Add quality parameter
  if (quality !== 75) params.append('q', quality.toString());
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Constructs the correct image URL from a given image path
 * @param imagePath - The image path from the database (e.g., '/uploads/general/image.jpg' or 'uploads/general/image.jpg')
 * @returns The complete URL to access the image
 */
export const getImageUrl = (imagePath: string | null | undefined): string => {
  // Return placeholder if no image path
  if (!imagePath) {
    return '/placeholder.svg';
  }

  // If it's already a complete URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Remove any leading slashes and duplicate 'uploads' paths
  let cleanPath = imagePath.replace(/^\/+/, ''); // Remove leading slashes
  
  // Handle the double /uploads/ issue
  if (cleanPath.startsWith('uploads/uploads/')) {
    cleanPath = cleanPath.replace('uploads/uploads/', 'uploads/');
  }
  
  // Ensure the path starts with 'uploads/'
  if (!cleanPath.startsWith('uploads/')) {
    cleanPath = `uploads/${cleanPath}`;
  }

  // Construct the full URL using the backend server
  const backendUrl = getBackendUrl();
  return `${backendUrl}/${cleanPath}`;
};

/**
 * Validates if an image URL is accessible with caching
 * @param imageUrl - The image URL to validate
 * @returns Promise<boolean> - True if the image is accessible
 */
export const validateImageUrl = async (imageUrl: string): Promise<boolean> => {
  // Check cache first
  if (imageUrlCache.has(imageUrl)) {
    return imageUrlCache.get(imageUrl)!;
  }
  
  try {
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      cache: 'force-cache' // Use browser cache
    });
    const isValid = response.ok;
    
    // Cache the result for 5 minutes
    imageUrlCache.set(imageUrl, isValid);
    setTimeout(() => imageUrlCache.delete(imageUrl), 5 * 60 * 1000);
    
    return isValid;
  } catch {
    // Cache negative result for 1 minute
    imageUrlCache.set(imageUrl, false);
    setTimeout(() => imageUrlCache.delete(imageUrl), 60 * 1000);
    return false;
  }
};

/**
 * Preload an image for better performance
 * @param imageUrl - The image URL to preload
 * @returns Promise<void>
 */
export const preloadImage = (imageUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imageUrl;
  });
};

/**
 * Generate responsive image sizes string
 * @param breakpoints - Object with breakpoint sizes
 * @returns Sizes string for responsive images
 */
export const generateSizes = (breakpoints: { mobile?: string; tablet?: string; desktop?: string } = {}): string => {
  const {
    mobile = '100vw',
    tablet = '50vw', 
    desktop = '33vw'
  } = breakpoints;
  
  return `(max-width: 768px) ${mobile}, (max-width: 1200px) ${tablet}, ${desktop}`;
};

/**
 * Export the optimized image URL function
 */
export { getOptimizedImageUrl, supportsWebP };

/**
 * Gets the image URL with fallback to placeholder
 * @param imagePath - The image path from the database
 * @param fallbackUrl - Optional fallback URL (defaults to placeholder)
 * @returns The image URL or fallback
 */
export const getImageUrlWithFallback = (imagePath: string | null | undefined, fallbackUrl: string = '/placeholder.svg'): string => {
  const imageUrl = getImageUrl(imagePath);
  return imageUrl === '/placeholder.svg' ? fallbackUrl : imageUrl;
};