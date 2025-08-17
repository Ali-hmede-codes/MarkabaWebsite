import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { API_BASE_URL } from '../../lib/api/config';

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

  const handleAdClick = async () => {
    if (!ad) return;
    
    try {
      // Track the click
      await fetch(`${API_BASE_URL}/ads/${ad.id}/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Open the link
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error tracking ad click:', err);
      // Still open the link even if tracking fails
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
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
    <div 
      className={`ad-container cursor-pointer transition-all duration-300 hover:opacity-90 ${className}`}
      style={style}
      onClick={handleAdClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleAdClick();
        }
      }}
    >
      <div className="relative w-full h-full overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
        <Image
          src={`https://api.markaba.news${ad.image_url}`}
          alt={ad.title}
          fill
          className="object-contain"
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
    </div>
  );
};

export default AdDisplay;