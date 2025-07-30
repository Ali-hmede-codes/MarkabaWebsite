/**
 * Open Graph Debugging Utilities
 * This file contains utilities to help debug and validate Open Graph meta tags
 */

export interface OGDebugInfo {
  url: string;
  title: string;
  description: string;
  image: string;
  type: string;
  siteName: string;
  locale: string;
  imageWidth: string;
  imageHeight: string;
  imageAlt: string;
  twitterCard: string;
  twitterSite: string;
  twitterCreator: string;
}

/**
 * Extract Open Graph meta tags from the current page
 */
export const extractOGTags = (): OGDebugInfo => {
  const getMetaContent = (property: string, name?: string): string => {
    let element = document.querySelector(`meta[property="${property}"]`);
    if (!element && name) {
      element = document.querySelector(`meta[name="${name}"]`);
    }
    return element?.getAttribute('content') || '';
  };

  return {
    url: getMetaContent('og:url'),
    title: getMetaContent('og:title'),
    description: getMetaContent('og:description'),
    image: getMetaContent('og:image'),
    type: getMetaContent('og:type'),
    siteName: getMetaContent('og:site_name'),
    locale: getMetaContent('og:locale'),
    imageWidth: getMetaContent('og:image:width'),
    imageHeight: getMetaContent('og:image:height'),
    imageAlt: getMetaContent('og:image:alt'),
    twitterCard: getMetaContent('twitter:card', 'twitter:card'),
    twitterSite: getMetaContent('twitter:site', 'twitter:site'),
    twitterCreator: getMetaContent('twitter:creator', 'twitter:creator')
  };
};

/**
 * Validate Open Graph image URL
 */
export const validateOGImage = async (imageUrl: string): Promise<{
  isValid: boolean;
  error?: string;
  imageInfo?: {
    width: number;
    height: number;
    aspectRatio: number;
    size: number;
  };
}> => {
  try {
    if (!imageUrl) {
      return { isValid: false, error: 'No image URL provided' };
    }

    // Check if URL is accessible
    const response = await fetch(imageUrl, { method: 'HEAD' });
    if (!response.ok) {
      return { isValid: false, error: `Image not accessible: ${response.status}` };
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return { isValid: false, error: `Invalid content type: ${contentType}` };
    }

    // Get image dimensions
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const isOptimalSize = img.width >= 1200 && img.height >= 630;
        const isOptimalRatio = aspectRatio >= 1.9 && aspectRatio <= 1.91; // Close to 1.91:1

        resolve({
          isValid: true,
          imageInfo: {
            width: img.width,
            height: img.height,
            aspectRatio,
            size: parseInt(response.headers.get('content-length') || '0')
          }
        });
      };
      img.onerror = () => {
        resolve({ isValid: false, error: 'Failed to load image' });
      };
      img.src = imageUrl;
    });
  } catch (error) {
    return { isValid: false, error: `Validation error: ${error}` };
  }
};

/**
 * Generate debugging report
 */
export const generateOGReport = async (): Promise<{
  tags: OGDebugInfo;
  imageValidation: Awaited<ReturnType<typeof validateOGImage>>;
  recommendations: string[];
}> => {
  const tags = extractOGTags();
  const imageValidation = await validateOGImage(tags.image);
  const recommendations: string[] = [];

  // Check for missing required tags
  if (!tags.title) recommendations.push('Missing og:title tag');
  if (!tags.description) recommendations.push('Missing og:description tag');
  if (!tags.image) recommendations.push('Missing og:image tag');
  if (!tags.url) recommendations.push('Missing og:url tag');
  if (!tags.type) recommendations.push('Missing og:type tag');

  // Check image requirements
  if (imageValidation.imageInfo) {
    const { width, height, aspectRatio } = imageValidation.imageInfo;
    if (width < 1200) recommendations.push('Image width should be at least 1200px');
    if (height < 630) recommendations.push('Image height should be at least 630px');
    if (aspectRatio < 1.9 || aspectRatio > 1.91) {
      recommendations.push('Image aspect ratio should be close to 1.91:1 (1200x630)');
    }
  }

  // Check Twitter Card tags
  if (!tags.twitterCard) recommendations.push('Missing twitter:card tag');
  if (!tags.twitterSite) recommendations.push('Missing twitter:site tag');

  return {
    tags,
    imageValidation,
    recommendations
  };
};

/**
 * Debug URLs for social media platforms
 */
export const getDebugUrls = (pageUrl: string) => {
  const encodedUrl = encodeURIComponent(pageUrl);
  return {
    facebook: `https://developers.facebook.com/tools/debug/?q=${encodedUrl}`,
    twitter: `https://cards-dev.twitter.com/validator`,
    linkedin: `https://www.linkedin.com/post-inspector/inspect/${encodedUrl}`,
    opengraph: `https://www.opengraph.xyz/url/${encodedUrl}`,
    whatsapp: 'WhatsApp does not have a public debugger - test by sharing the URL'
  };
};

/**
 * Console debugging helper
 */
export const debugOGTags = async () => {
  console.group('🔍 Open Graph Debug Report');
  
  const report = await generateOGReport();
  
  console.log('📋 Current OG Tags:', report.tags);
  console.log('🖼️ Image Validation:', report.imageValidation);
  
  if (report.recommendations.length > 0) {
    console.warn('⚠️ Recommendations:', report.recommendations);
  } else {
    console.log('✅ All checks passed!');
  }
  
  const debugUrls = getDebugUrls(window.location.href);
  console.log('🔗 Debug URLs:', debugUrls);
  
  console.groupEnd();
  
  return report;
};

// Make it available globally for easy debugging
if (typeof window !== 'undefined') {
  (window as any).debugOG = debugOGTags;
}