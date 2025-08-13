import React, { useState, useEffect } from 'react';

interface Ad {
  id: number;
  title: string;
  description?: string;
  image_path: string;
  url: string;
  position: string;
  width: number;
  height: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  clicks: number;
  impressions: number;
  created_at: string;
  position_display_name?: string;
}

interface AdBannerProps {
  position: string;
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ position, className = '' }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impressionTracked, setImpressionTracked] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/ads?position=${position}&active_only=true`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch ads');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setAds(data.data || []);
        } else {
          throw new Error(data.message || 'Failed to load ads');
        }
      } catch (err) {
        console.error('Error fetching ads:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ads');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [position]);

  const trackImpression = async (adId: number) => {
    if (impressionTracked.has(adId)) return;
    
    try {
      await fetch(`/api/ads?id=${adId}&action=impression`, {
        method: 'POST',
      });
      setImpressionTracked(prev => new Set(prev).add(adId));
    } catch (error) {
      console.error('Failed to track impression:', error);
    }
  };

  const handleAdClick = async (adId: number, adUrl: string) => {
    try {
      const response = await fetch(`/api/ads?id=${adId}&action=click`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.redirect_url) {
          window.open(data.redirect_url, '_blank');
        } else {
          window.open(adUrl, '_blank');
        }
      } else {
        window.open(adUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to track click:', error);
      window.open(adUrl, '_blank');
    }
  };

  // Track impressions when ads are loaded and visible
  useEffect(() => {
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

      const adElements = document.querySelectorAll('.ad-item[data-ad-id]');
      adElements.forEach((el) => observer.observe(el));

      return () => observer.disconnect();
    }
  }, [ads]);

  if (loading) {
    return (
      <div className={`ad-banner-loading ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-lg h-32 w-full max-w-4xl mx-auto"></div>
      </div>
    );
  }

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
      url: whatsappUrl,
      width: defaultWidth,
      height: defaultHeight
    };
  };

  const handleDefaultAdClick = () => {
    const whatsappUrl = `https://wa.me/96178875636`;
    window.open(whatsappUrl, '_blank');
  };

  if (error || ads.length === 0) {
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
                 alt={defaultAd.title}
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
  }

  return (
    <div className={`ad-banner ${className} my-6`}>
      <div className="container mx-auto px-4">
        {ads.map((ad) => (
          <div
            key={ad.id}
            data-ad-id={ad.id}
            className="ad-item cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg mx-auto"
            onClick={() => handleAdClick(ad.id, ad.url)}
            style={{ maxWidth: `${ad.width}px` }}
          >
            <div className="relative overflow-hidden rounded-lg shadow-md">
              <img
                src={ad.image_path.startsWith('/') ? ad.image_path : `/${ad.image_path}`}
                alt={ad.title}
                className="w-full h-auto object-contain"
                style={{
                  aspectRatio: `${ad.width}/${ad.height}`,
                }}
                onError={(e) => {
                  console.error('Ad image failed to load:', ad.image_path);
                  e.currentTarget.parentElement?.parentElement?.remove();
                }}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                إعلان
              </div>
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

export default AdBanner;