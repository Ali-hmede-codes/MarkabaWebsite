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
          height: '300px',
          maxWidth: '1280px',
          margin: '0 auto'
        }}
      />
    </div>
  );
};

export default MiddleMainAd;