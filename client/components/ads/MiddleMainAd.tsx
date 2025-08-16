import React from 'react';
import AdDisplay from './AdDisplay';

interface MiddleMainAdProps {
  className?: string;
}

const MiddleMainAd: React.FC<MiddleMainAdProps> = ({ className = '' }) => {
  return (
    <div className={`middle-main-ad ${className}`}>
      <AdDisplay 
        position="middle_main" 
        className="w-full max-w-4xl mx-auto"
        style={{ minHeight: '120px' }}
      />
    </div>
  );
};

export default MiddleMainAd;