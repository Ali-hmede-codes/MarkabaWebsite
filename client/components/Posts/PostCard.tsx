'use client';

import React from 'react';
import Link from 'next/link';
// import Image from 'next/image'; // Removed to fix CORS issues
import { Post } from '../API/types';
import { getImageUrl } from '../../lib/utils';

interface PostCardProps {
  post: Post;
  className?: string;
  showExcerpt?: boolean;
  showCategory?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  className = '',
  showExcerpt = true,
  showCategory = true,
  showAuthor = true,
  showDate = true
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <article className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${className}`}>
      {/* Featured Image */}
      {post.featured_image && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={getImageUrl(post.featured_image)}
            alt={post.title_ar || post.title}
            className="w-full h-full object-cover rounded-t-lg"
            loading="lazy"
          />
        </div>
      )}
      
      <div className="p-4">
        {/* Category */}
        {showCategory && post.category && (
          <div className="mb-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded" dir="rtl">
              {post.category.name_ar}
            </span>
          </div>
        )}
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2" dir="rtl">
          <Link 
            href={`/posts/${post.slug}`}
            className="hover:text-blue-600 transition-colors"
          >
            {post.title_ar || post.title}
          </Link>
        </h3>
        
        {/* Excerpt */}
        {showExcerpt && (post.excerpt_ar || post.excerpt) && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3" dir="rtl">
            {post.excerpt_ar || post.excerpt}
          </p>
        )}
        
        {/* Meta Information */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            {showAuthor && post.author && (
              <span>By {post.author.name || post.author.username}</span>
            )}
            {showDate && post.created_at && (
              <span>{formatDate(post.created_at)}</span>
            )}
          </div>
          
          {post.views && (
            <span>{post.views} views</span>
          )}
        </div>
      </div>
    </article>
  );
};

export default PostCard;