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
        className="w-full max-w-sm mx-auto"
        style={{ 
          width: 'clamp(250px, 80vw, 350px)', 
          height: 'clamp(250px, 80vw, 350px)',
          aspectRatio: '1/1'
        }}
      />
    </div>
  );
};

export default SquarePostMiddleAd;