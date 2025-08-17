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
          height: '300px',
          maxWidth: '1280px',
          margin: '0 auto'
        }}
      />
    </div>
  );
};

export default PostBottomAd;