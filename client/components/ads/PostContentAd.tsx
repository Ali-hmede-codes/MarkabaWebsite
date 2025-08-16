import React from 'react';
import AdDisplay from './AdDisplay';

interface PostContentAdProps {
  className?: string;
}

const PostContentAd: React.FC<PostContentAdProps> = ({ className = '' }) => {
  return (
    <div className={`w-full my-8 flex justify-center ${className}`}>
      <div className="max-w-2xl w-full">
        <AdDisplay 
          position="post_content"
          className="w-full"
          style={{ 
            height: '250px',
            minHeight: '250px',
            maxHeight: '250px'
          }}
        />
      </div>
    </div>
  );
};

export default PostContentAd;