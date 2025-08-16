import React from 'react';
import AdDisplay from './AdDisplay';

interface BottomMainAdProps {
  className?: string;
}

const BottomMainAd: React.FC<BottomMainAdProps> = ({ className = '' }) => {
  return (
    <div className={`bottom-main-ad ${className}`}>
      <AdDisplay 
        position="bottom_main" 
        className="w-full max-w-4xl mx-auto"
        style={{ minHeight: '90px' }}
      />
    </div>
  );
};

export default BottomMainAd;