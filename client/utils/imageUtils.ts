/**
 * Image utility functions for handling image URLs with performance optimizations
 * Fixes the double /uploads/ issue and ensures images are served from the correct backend port
 * Includes lazy loading, WebP support, and image optimization features
 */

const LEGACY_IMAGE_HOSTS = new Set([
  'api.markaba.news',
  'localhost',
  '127.0.0.1',
  '69.62.115.12',
]);

function toUploadsPath(rawPath: string): string {
  let cleanPath = rawPath.replace(/^\/+/, '');

  if (cleanPath.startsWith('uploads/uploads/')) {
    cleanPath = cleanPath.replace('uploads/uploads/', 'uploads/');
  }

  if (!cleanPath.startsWith('uploads/')) {
    cleanPath = `uploads/${cleanPath}`;
  }

  return `/${cleanPath}`;
}

/**
 * Same-origin /uploads/... so CloudPanel → Next.js can rewrite to Express.
 */
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return '/placeholder.svg';
  }

  if (imagePath.startsWith('blob:') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    try {
      const parsed = new URL(imagePath);
      if (LEGACY_IMAGE_HOSTS.has(parsed.hostname) && parsed.pathname.includes('uploads')) {
        return parsed.pathname;
      }
    } catch {
      return imagePath;
    }
    return imagePath;
  }

  return toUploadsPath(imagePath);
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

/**
 * Performance optimization options for images
 */
export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  lazy?: boolean;
  priority?: boolean;
  blur?: boolean;
}

/**
 * Checks if the browser supports WebP format
 * @returns boolean - True if WebP is supported
 */
export const supportsWebP = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

/**
 * Gets optimized image URL with performance parameters
 * @param imagePath - The image path from the database
 * @param options - Optimization options
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (imagePath: string | null | undefined, options: ImageOptimizationOptions = {}): string => {
  const baseUrl = getImageUrl(imagePath);
  
  if (baseUrl === '/placeholder.svg') {
    return baseUrl;
  }

  const {
    width,
    height,
    quality = 85,
    format = 'auto'
  } = options;

  // Build query parameters for image optimization
  const params = new URLSearchParams();
  
  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  if (quality !== 85) params.append('q', quality.toString());
  
  // Auto-detect WebP support
  if (format === 'auto') {
    if (supportsWebP()) {
      params.append('f', 'webp');
    }
  } else if (format !== 'jpeg') {
    params.append('f', format);
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Creates image attributes for lazy loading and performance
 * @param imagePath - The image path
 * @param options - Optimization options
 * @returns Object with image attributes
 */
export const getImageAttributes = (imagePath: string | null | undefined, options: ImageOptimizationOptions = {}) => {
  const {
    width,
    height,
    lazy = true,
    priority = false,
    blur = true
  } = options;

  const optimizedUrl = getOptimizedImageUrl(imagePath, options);
  const placeholderUrl = '/placeholder.svg';

  const attributes: Record<string, any> = {
    src: priority ? optimizedUrl : placeholderUrl,
    'data-src': lazy ? optimizedUrl : undefined,
    alt: '',
    loading: lazy && !priority ? 'lazy' : 'eager',
    decoding: 'async',
  };

  if (width) attributes.width = width;
  if (height) attributes.height = height;

  // Add blur placeholder for better UX
  if (blur && lazy && !priority) {
    attributes.style = {
      filter: 'blur(5px)',
      transition: 'filter 0.3s ease'
    };
    attributes.onLoad = () => {
      attributes.style.filter = 'none';
    };
  }

  return attributes;
};

/**
 * Preloads critical images for better performance
 * @param imagePaths - Array of image paths to preload
 * @param options - Optimization options
 */
export const preloadImages = (imagePaths: string[], options: ImageOptimizationOptions = {}): void => {
  if (typeof window === 'undefined') return;

  imagePaths.forEach(imagePath => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = getOptimizedImageUrl(imagePath, { ...options, quality: 75 });
    
    // Add WebP support check
    if (supportsWebP()) {
      link.type = 'image/webp';
    }
    
    document.head.appendChild(link);
  });
};

/**
 * Lazy loading observer for images
 * @param callback - Function to call when image enters viewport
 * @returns IntersectionObserver instance
 */
export const createLazyLoadObserver = (callback: (entry: IntersectionObserverEntry) => void): IntersectionObserver | null => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry);
        }
      });
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.1
    }
  );
};

/**
 * Optimized image component props generator
 * @param imagePath - The image path
 * @param options - Optimization options
 * @returns Props object for image components
 */
export const getOptimizedImageProps = (imagePath: string | null | undefined, options: ImageOptimizationOptions = {}) => {
  const attributes = getImageAttributes(imagePath, options);
  const optimizedUrl = getOptimizedImageUrl(imagePath, options);
  
  return {
    ...attributes,
    src: optimizedUrl,
    onError: (e: any) => {
      e.target.src = '/placeholder.svg';
    },
    onLoad: (e: any) => {
      if (attributes.style?.filter) {
        e.target.style.filter = 'none';
      }
      e.target.classList.add('loaded');
    }
  };
};