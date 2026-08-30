import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { API_BASE_URL } from '../../lib/api/config';
import { getImageUrl } from '../../utils/imageUtils';

interface Ad {
  id: number;
  title: string;
  image_url: string;
  link_url: string;
  position: string;
  is_active: boolean;
  expires_at: string;
  clicks: number;
}

interface AdDisplayProps {
  position: string;
  className?: string;
  style?: React.CSSProperties;
}

const AdDisplay: React.FC<AdDisplayProps> = ({ position, className = '', style }) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAd();
  }, [position]);

  const fetchAd = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/ads/position/${position}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No ad found for this position
          setAd(null);
          return;
        }
        throw new Error('Failed to fetch ad');
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        // Transform backend response to match frontend interface
        const backendAd = data.data;
        const transformedAd: Ad = {
          id: backendAd.id,
          title: backendAd.title,
          image_url: backendAd.image_path, // Backend uses image_path
          link_url: backendAd.link_url,
          position: backendAd.position_name,
          is_active: true, // If we got it, it's active
          expires_at: '', // Not needed for display
          clicks: 0 // Not needed for display
        };
        setAd(transformedAd);
      } else {
        setAd(null);
      }
    } catch (err) {
      console.error('Error fetching ad:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setAd(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = async (e: React.MouseEvent) => {
    if (!ad) return;
    
    try {
      // Track the click using Next.js API route
      await fetch(`/api/ads/${ad.id}/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.error('Error tracking ad click:', err);
      // Continue with navigation even if tracking fails
    }
  };

  // Don't render anything if loading, error, or no ad
  if (loading || error || !ad) {
    return null;
  }

  // Check if ad is expired
  const isExpired = new Date(ad.expires_at) < new Date();
  if (isExpired || !ad.is_active) {
    return null;
  }

  return (
    <a 
      href={ad.link_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`ad-container cursor-pointer transition-all duration-300 hover:opacity-90 block ${className}`}
      style={style}
      onClick={handleAdClick}
    >
      <div className="relative w-full h-full overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 bg-gray-100">
        <Image
          src={getImageUrl(ad.image_url)}
          alt={ad.title}
          fill
          className="w-full h-full"
          style={{
            objectFit: 'fill',
            objectPosition: 'center'
          }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Optional overlay with title for accessibility */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300 flex items-end">
          <div className="w-full p-2 bg-gradient-to-t from-black/50 to-transparent">
            <p className="text-white text-xs font-medium truncate opacity-0 hover:opacity-100 transition-opacity duration-300">
              {ad.title}
            </p>
          </div>
        </div>
      </div>
      
      {/* Screen reader only text */}
      <span className="sr-only">
        إعلان: {ad.title}
      </span>
    </a>
  );
};

export default AdDisplay;