import React from 'react';
import AdDisplay from './AdDisplay';

interface MainTopAdProps {
  className?: string;
}

const MainTopAd: React.FC<MainTopAdProps> = ({ className = '' }) => {
  return (
    <div className={`main-top-ad ${className}`}>
      <AdDisplay 
        position="main_top" 
        className="w-full max-w-4xl mx-auto"
        style={{ minHeight: '90px' }}
      />
    </div>
  );
};

export default MainTopAd;