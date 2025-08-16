import React from 'react';
import AdDisplay from './AdDisplay';

interface HeaderBannerAdProps {
  className?: string;
}

const HeaderBannerAd: React.FC<HeaderBannerAdProps> = ({ className = '' }) => {
  return (
    <div className={`w-full mb-6 ${className}`}>
      <AdDisplay 
        position="header_banner"
        className="w-full"
        style={{ 
          height: '120px',
          minHeight: '120px',
          maxHeight: '120px'
        }}
      />
    </div>
  );
};

export default HeaderBannerAd;