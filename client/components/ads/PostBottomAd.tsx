import React from 'react';
import AdDisplay from './AdDisplay';

interface PostBottomAdProps {
  className?: string;
}

const PostBottomAd: React.FC<PostBottomAdProps> = ({ className = '' }) => {
  return (
    <div className={`post-bottom-ad ${className} w-full max-w-6xl mx-auto`}>
      <AdDisplay 
        position="post_bottom" 
        className="w-full"
        style={{ 
          height: 'clamp(100px, 15vw, 180px)',
          maxWidth: '100%',
          margin: '0 auto',
          aspectRatio: '16/4'
        }}
      />
    </div>
  );
};

export default PostBottomAd;