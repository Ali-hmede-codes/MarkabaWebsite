import React, { useState, useEffect } from 'react';
import AdsAPI from '../API/AdsAPI';
import { Ad } from '../API/types';

interface AdBannerProps {
  position: string;
  className?: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const AdBanner: React.FC<AdBannerProps> = ({ 
  position, 
  className = '', 
  limit = 1,
  autoRefresh = false,
  refreshInterval = 30000
}) => {
  const [impressionTracked, setImpressionTracked] = useState<Set<number>>(new Set());
  const [clickTracking, setClickTracking] = useState<Set<number>>(new Set());
  const [currentAds, setCurrentAds] = useState<Ad[]>([]);

  // Setup impression tracking when ads change
  useEffect(() => {
    const cleanup = setupImpressionTracking(currentAds);
    return cleanup;
  }, [currentAds]);

  const trackImpression = async (adId: number) => {
    if (impressionTracked.has(adId)) return;
    
    try {
      await fetch(`/api/ads/${adId}/impression`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip_address: null, // Will be determined by server
          user_agent: navigator.userAgent
        })
      });
      setImpressionTracked(prev => new Set(prev).add(adId));
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };

  const handleAdClick = async (ad: Ad, trackClick: (id: string | number, referrer?: string) => Promise<void>) => {
    if (clickTracking.has(ad.id)) return;
    
    setClickTracking(prev => new Set(prev).add(ad.id));
    
    try {
      await trackClick(ad.id, window.location.href);
    } catch (error) {
      console.error('Error tracking click:', error);
      // Still open the URL even if tracking fails
      if (ad.url) {
        window.open(ad.url, '_blank');
      }
    } finally {
      setClickTracking(prev => {
        const newSet = new Set(prev);
        newSet.delete(ad.id);
        return newSet;
      });
    }
  };

  // Track impressions when ads are loaded and visible
  const setupImpressionTracking = (ads: Ad[]) => {
    if (ads.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const adId = parseInt(entry.target.getAttribute('data-ad-id') || '0');
              if (adId) {
                trackImpression(adId);
              }
            }
          });
        },
        { threshold: 0.5 }
      );

      // Use a timeout to ensure DOM elements are rendered
      setTimeout(() => {
        const adElements = document.querySelectorAll('.ad-item[data-ad-id]');
        adElements.forEach((el) => observer.observe(el));
      }, 100);

      return () => observer.disconnect();
    }
  };



  // Default ad configuration
  const getDefaultAd = () => {
    const whatsappUrl = `https://wa.me/96178875636`;
    
    // Determine which default image to use based on position
    const isSquarePosition = position === 'post_square';
    const defaultImage = isSquarePosition ? 'https://api.markaba.news/uploads/ads-square-300.png' : 'https://api.markaba.news/uploads/ads-rectangle-1280.png';
    const defaultWidth = isSquarePosition ? 300 : 1280;
    const defaultHeight = isSquarePosition ? 300 : 200;
    
    return {
      id: 0,
      title: '',
      image_path: defaultImage,
      image_url: defaultImage,
      url: whatsappUrl,
      width: defaultWidth,
      height: defaultHeight,
      position,
      is_active: true,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      clicks: 0,
      impressions: 0,
      created_at: new Date().toISOString(),
      description: undefined
    } as Ad;
  };

  const handleDefaultAdClick = () => {
    const whatsappUrl = `https://wa.me/96178875636`;
    window.open(whatsappUrl, '_blank');
  };

  const renderDefaultAd = () => {
    const defaultAd = getDefaultAd();
    
    return (
      <div className={`ad-banner ${className} my-6`}>
        <div className="container mx-auto px-4">
          <div
            className="ad-item cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg mx-auto"
            onClick={handleDefaultAdClick}
            style={{ maxWidth: `${defaultAd.width}px` }}
          >
            <div className="relative overflow-hidden rounded-lg shadow-md">
              <img
                 src={defaultAd.image_path}
                 alt={defaultAd.title || 'إعلان افتراضي'}
                 className="w-full h-auto object-contain"
                onError={(e) => {
                  console.error('Default ad image failed to load:', defaultAd.image_path);
                }}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                إعلان
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAdBanner = (ads: Ad[], loading: boolean, error: string | null, trackClick: (id: string | number, referrer?: string) => Promise<void>) => {
    // Update current ads state for impression tracking
    if (JSON.stringify(ads) !== JSON.stringify(currentAds)) {
      setCurrentAds(ads);
    }

    if (loading) {
      return (
        <div className={`ad-banner-loading ${className} my-6`}>
          <div className="container mx-auto px-4">
            <div className="animate-pulse bg-gray-200 rounded-lg h-32 w-full max-w-4xl mx-auto"></div>
          </div>
        </div>
      );
    }

    if (error || ads.length === 0) {
      return renderDefaultAd();
    }

    return (
      <div className={`ad-banner ${className} my-6`}>
        <div className="container mx-auto px-4">
          {ads.map((ad) => (
            <div
              key={ad.id}
              data-ad-id={ad.id}
              className="ad-item cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg mx-auto relative"
              onClick={() => handleAdClick(ad, trackClick)}
              style={{ maxWidth: `${ad.width}px` }}
            >
              <div className="relative overflow-hidden rounded-lg shadow-md">
                <img
                  src={ad.image_url || ad.image_path}
                  alt={ad.title || 'إعلان'}
                  className="w-full h-auto object-contain"
                  style={{
                    aspectRatio: `${ad.width}/${ad.height}`,
                  }}
                  onError={(e) => {
                    console.error('Ad image failed to load:', ad.image_path);
                  }}
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  إعلان
                </div>
                {clickTracking.has(ad.id) && (
                  <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              {ad.title && (
                <p className="ad-title text-sm text-gray-600 mt-2 text-center font-medium">
                  {ad.title}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AdsAPI
      position={position}
      mode="public"
      autoRefresh={autoRefresh}
      refreshInterval={refreshInterval}
      onError={(error) => console.error('AdBanner error:', error)}
      onSuccess={(message) => console.log('AdBanner success:', message)}
    >
      {({ ads, loading, error, trackClick }) => 
        renderAdBanner(ads, loading, error, trackClick)
      }
    </AdsAPI>
  );
};

export default AdBanner;