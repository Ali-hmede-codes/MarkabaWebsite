import React from 'react';
import AdDisplay from './AdDisplay';

interface PostSidebarAdProps {
  className?: string;
}

const PostSidebarAd: React.FC<PostSidebarAdProps> = ({ className = '' }) => {
  return (
    <div className={`w-full mb-6 ${className}`}>
      <AdDisplay 
        position="post_sidebar"
        className="w-full"
        style={{ 
          height: '300px',
          minHeight: '300px',
          maxHeight: '300px'
        }}
      />
    </div>
  );
};

export default PostSidebarAd;