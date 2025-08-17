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
          height: '300px',
          maxWidth: '1280px',
          margin: '0 auto'
        }}
      />
    </div>
  );
};

export default MainTopAd;