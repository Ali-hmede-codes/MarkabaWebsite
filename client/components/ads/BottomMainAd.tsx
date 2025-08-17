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
          height: '300px',
          maxWidth: '1280px',
          margin: '0 auto'
        }}
      />
    </div>
  );
};

export default BottomMainAd;