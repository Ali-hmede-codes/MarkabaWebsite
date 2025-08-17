import React from 'react';
import AdDisplay from './AdDisplay';

interface BottomMainAdProps {
  className?: string;
}

const BottomMainAd: React.FC<BottomMainAdProps> = ({ className = '' }) => {
  return (
    <div className={`bottom-main-ad ${className} w-full max-w-6xl mx-auto`}>
      <AdDisplay 
        position="bottom_main" 
        className="w-full"
        style={{ 
          height: 'clamp(100px, 12vw, 150px)',
          maxWidth: '1280px',
          margin: '0 auto',
          aspectRatio: '1280/150'
        }}
      />
    </div>
  );
};

export default BottomMainAd;