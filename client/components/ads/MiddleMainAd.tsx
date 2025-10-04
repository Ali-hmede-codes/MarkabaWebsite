import React from 'react';
import AdDisplay from './AdDisplay';

interface MiddleMainAdProps {
  className?: string;
}

const MiddleMainAd: React.FC<MiddleMainAdProps> = ({ className = '' }) => {
  return (
    <div className={`middle-main-ad ${className} w-full max-w-6xl mx-auto`}>
      <AdDisplay 
        position="middle_main" 
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

export default MiddleMainAd;