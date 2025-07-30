/**
 * Image utility functions for handling image URLs
 * Fixes the double /uploads/ issue and ensures images are served from the correct backend port
 */

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
 * Validates if an image URL is accessible
 * @param imageUrl - The image URL to validate
 * @returns Promise<boolean> - True if the image is accessible
 */
export const validateImageUrl = async (imageUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

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