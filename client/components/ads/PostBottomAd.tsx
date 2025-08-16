import React from 'react';
import AdDisplay from './AdDisplay';

interface PostBottomAdProps {
  className?: string;
}

const PostBottomAd: React.FC<PostBottomAdProps> = ({ className = '' }) => {
  return (
    <div className={`post-bottom-ad ${className}`}>
      <AdDisplay 
        position="post_bottom" 
        className="w-full"
        style={{ minHeight: '100px' }}
      />
    </div>
  );
};

export default PostBottomAd;