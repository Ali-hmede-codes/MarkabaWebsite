import React from 'react';
import AdDisplay from './AdDisplay';

interface SquarePostMiddleAdProps {
  className?: string;
}

const SquarePostMiddleAd: React.FC<SquarePostMiddleAdProps> = ({ className = '' }) => {
  return (
    <div className={`square-post-middle-ad ${className}`}>
      <AdDisplay 
        position="square_post_middle" 
        className="w-full max-w-xs mx-auto"
        style={{ minHeight: '250px', maxWidth: '300px' }}
      />
    </div>
  );
};

export default SquarePostMiddleAd;