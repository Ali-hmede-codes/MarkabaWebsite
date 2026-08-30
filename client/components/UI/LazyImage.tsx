import React, { useEffect, useRef, useState } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  aspectRatio?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  skeletonClassName = '',
  aspectRatio = 'aspect-video',
  priority = false,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [inView, setInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setInView(true);
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [priority]);

  const shouldLoad = priority || inView;

  const handleImageLoad = () => {
    setIsLoaded(true);
    setImageLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    setImageLoading(false);
    onError?.();
  };

  const handleImageStart = () => {
    setImageLoading(true);
  };

  // Skeleton component
  const Skeleton = () => (
    <div 
      className={`animate-pulse bg-gray-300 w-full h-full ${skeletonClassName}`}
      aria-label="Loading image..."
    >
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );

  // Error placeholder
  const ErrorPlaceholder = () => (
    <div className={`bg-gray-200 w-full h-full flex items-center justify-center ${skeletonClassName}`}>
      <div className="text-gray-500 text-center">
        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs">Failed to load</span>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${aspectRatio} ${className}`}>
      {/* Show skeleton while not loaded and not errored */}
      {!isLoaded && !hasError && <Skeleton />}
      
      {/* Show error placeholder if image failed to load */}
      {hasError && <ErrorPlaceholder />}
      
      {/* Actual image */}
      {shouldLoad && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onLoadStart={handleImageStart}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
      
      {/* Loading overlay for when image is being fetched */}
      {imageLoading && !isLoaded && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;