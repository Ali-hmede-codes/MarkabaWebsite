import React from 'react';
import AdDisplay from './AdDisplay';

interface MainTopAdProps {
  className?: string;
}

const MainTopAd: React.FC<MainTopAdProps> = ({ className = '' }) => {
  return (
    <div className={`main-top-ad ${className} w-full max-w-6xl mx-auto`}>
      <AdDisplay 
        position="main_top" 
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

export default MainTopAd;