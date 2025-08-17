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
        className="w-full"
        style={{ 
          width: '300px', 
          height: '300px',
          maxWidth: '300px',
          maxHeight: '300px',
          aspectRatio: '1/1'
        }}
      />
    </div>
  );
};

export default SquarePostMiddleAd;