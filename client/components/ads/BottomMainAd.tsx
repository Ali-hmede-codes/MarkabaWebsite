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
          height: 'clamp(100px, 15vw, 180px)',
          maxWidth: '100%',
          margin: '0 auto',
          aspectRatio: '16/4'
        }}
      />
    </div>
  );
};

export default BottomMainAd;