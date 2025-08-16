import React from 'react';
import AdDisplay from './AdDisplay';

interface FooterBannerAdProps {
  className?: string;
}

const FooterBannerAd: React.FC<FooterBannerAdProps> = ({ className = '' }) => {
  return (
    <div className={`w-full mt-6 mb-4 ${className}`}>
      <AdDisplay 
        position="footer_banner"
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

export default FooterBannerAd;