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
          height: 'clamp(80px, 12vw, 140px)',
          maxWidth: '100%',
          margin: '0 auto',
          aspectRatio: '16/3'
        }}
      />
    </div>
  );
};

export default BottomMainAd;