import React from 'react';
import AdDisplay from './AdDisplay';

interface SquarePostMiddleAdProps {
  className?: string;
}

const SquarePostMiddleAd: React.FC<SquarePostMiddleAdProps> = ({ className = '' }) => {
  return (
    <div className={`square-post-middle-ad ${className} flex justify-center my-8`}>
      <AdDisplay 
        position="square_post_middle" 
        className="w-full max-w-md mx-auto"
        style={{ 
          width: 'clamp(280px, 90vw, 400px)', 
          height: 'clamp(280px, 90vw, 400px)',
          aspectRatio: '1/1'
        }}
      />
    </div>
  );
};

export default SquarePostMiddleAd;