import React, { useState } from 'react';
import { Post } from '../../components/API/types';
import { FiCopy, FiShare2, FiTag } from 'react-icons/fi';
import Image from 'next/image';
import { getImageUrl } from '../../utils/imageUtils';
import Layout from '../../components/Layout/Layout';
import Link from 'next/link';

interface PostContentProps {
  post: Post;
  relatedPosts: Post[];
}

const PostContent: React.FC<PostContentProps> = ({ post, relatedPosts }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Handle copy error silently
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title_ar || post.title,
          text: post.excerpt_ar || post.excerpt,
          url: window.location.href,
        });
      } catch {
        // Fallback to copy link if sharing fails
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Handle tags properly for display
  let tags: string[] = [];
  if (post?.tags) {
    if (Array.isArray(post.tags)) {
      tags = post.tags;
    } else if (typeof post.tags === 'string') {
      try {
        tags = JSON.parse(post.tags);
      } catch {
        const tagsString = post.tags as string;
        tags = tagsString.split(',').map((tag: string) => tag.trim());
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Post Header */}
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Featured Image */}
          {(post.featured_image || post.image) && (
            <div className="relative w-full h-64 md:h-96">
              <Image
                src={getImageUrl(post.featured_image || post.image)}
                alt={post.title_ar || post.title || 'صورة المقال'}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* Category */}
            {post.category_name && (
              <div className="mb-4">
                <Link 
                  href={`/category/${post.category_id}`}
                  className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                >
                  {post.category_name}
                </Link>
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title_ar || post.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
              <span>بواسطة: {typeof post.author === 'string' ? post.author : post.author?.username || 'أخبار مركبا'}</span>
              <span>•</span>
              <time dateTime={post.created_at}>
                {formatDate(post.created_at)}
              </time>
              {post.updated_at && post.updated_at !== post.created_at && (
                <>
                  <span>•</span>
                  <span>محدث: {formatDate(post.updated_at)}</span>
                </>
              )}
            </div>

            {/* Share Buttons */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiShare2 size={16} />
                مشاركة
              </button>
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  copied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FiCopy size={16} />
                {copied ? 'تم النسخ!' : 'نسخ الرابط'}
              </button>
            </div>

            {/* Excerpt */}
            {(post.excerpt_ar || post.excerpt) && (
              <div className="text-lg text-gray-700 mb-6 p-4 bg-gray-50 rounded-lg border-r-4 border-blue-500">
                {post.excerpt_ar || post.excerpt}
              </div>
            )}

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: post.content_ar || post.content || '' 
              }}
            />

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <FiTag className="text-gray-500" size={16} />
                  <span className="text-sm font-medium text-gray-700">الكلمات المفتاحية:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">مقالات ذات صلة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/${relatedPost.slug}`}
                  className="group block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {(relatedPost.featured_image || relatedPost.image) && (
                    <div className="relative w-full h-48">
                      <Image
                        src={getImageUrl(relatedPost.featured_image || relatedPost.image)}
                        alt={relatedPost.title_ar || relatedPost.title || 'صورة المقال'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {relatedPost.title_ar || relatedPost.title}
                    </h3>
                    {(relatedPost.excerpt_ar || relatedPost.excerpt) && (
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {relatedPost.excerpt_ar || relatedPost.excerpt}
                      </p>
                    )}
                    <div className="mt-3 text-xs text-gray-500">
                      {formatDate(relatedPost.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default PostContent;