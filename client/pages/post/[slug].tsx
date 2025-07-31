import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { Post } from '../../components/API/types';
import Head from 'next/head';
import Layout from '../../components/Layout/Layout';
import PostContent from './PostContent';
import { getImageUrl } from '../../utils/imageUtils';

// Types
interface PostPageProps {
  post: Post | null;
  relatedPosts: Post[];
  meta: MetaData;
  error?: string;
}

interface MetaData {
  title: string;
  description: string;
  image: string;
  url: string;
  author: string;
  category: string;
  tags: string[];
  published: string;
  updated: string;
  siteName: string;
  locale: string;
}

// Meta generation function
const generateMetaData = (post: Post | null, slug: string): MetaData => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news';
  const defaultImage = `${baseUrl}/images/logo_new.png`;
  
  if (!post) {
    return {
      title: 'المنشور غير موجود | أخبار مركبا',
      description: 'موقع أخبار مركبا - آخر الأخبار والمستجدات',
      image: defaultImage,
      url: `${baseUrl}/post/${slug}`,
      author: 'أخبار مركبا',
      category: 'أخبار',
      tags: [],
      published: new Date().toISOString(),
      updated: new Date().toISOString(),
      siteName: 'موقع مــركبــا الاخباري',
      locale: 'ar_AR'
    };
  }

  // Extract and clean description
  const description = (post.excerpt_ar || post.excerpt || 
    (post.content_ar || post.content)?.replace(/<[^>]*>/g, '').substring(0, 160) || 
    'موقع أخبار مركبا - آخر الأخبار والمستجدات'
  ).trim();

  // Handle tags properly
  let tags: string[] = [];
  if (post.tags) {
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

  // Handle image URL
  let imageUrl = defaultImage;
  try {
    imageUrl = (post.featured_image || post.image) ? 
      getImageUrl(post.featured_image || post.image) : defaultImage;
  } catch (e) {
    console.error('Error generating image URL:', e);
  }

  return {
    title: (post.title_ar || post.title || 'أخبار مركبا').trim(),
    description,
    image: imageUrl,
    url: `${baseUrl}/post/${post.slug}`,
    author: typeof post.author === 'string' ? post.author : 
      (post.author?.username || 'أخبار مركبا'),
    category: typeof post.category === 'string' ? post.category : 
      (post.category?.name_ar || 'أخبار'),
    tags,
    published: post.created_at || new Date().toISOString(),
    updated: post.updated_at || post.created_at || new Date().toISOString(),
    siteName: 'موقع مــركبــا الاخباري',
    locale: 'ar_AR'
  };
};

// Main Component
const SinglePostPage: React.FC<PostPageProps> = ({ 
  post, 
  relatedPosts, 
  meta,
  error 
}) => {
  const router = useRouter();

  // Handle route changes
  useEffect(() => {
    const handleRouteChange = () => {
      window.scrollTo(0, 0);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Error state
  if (error || !post) {
    return (
      <>
        <Head>
          <title>{meta.title}</title>
          <meta name="description" content={meta.description} />
          <meta property="og:title" content={meta.title} />
          <meta property="og:description" content={meta.description} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={meta.url} />
          <meta property="og:site_name" content={meta.siteName} />
          <meta property="og:image" content={meta.image} />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={meta.title} />
          <meta name="twitter:description" content={meta.description} />
          <meta name="twitter:image" content={meta.image} />
        </Head>
        <Layout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center py-10 text-gray-600">
              {error || 'المنشور غير موجود'}
            </div>
          </div>
        </Layout>
      </>
    );
  }

  // Main render with complete meta tags
  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.tags.join(', ')} />
        <meta name="author" content={meta.author} />
        <link rel="canonical" href={meta.url} />
        
        {/* Open Graph */}
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={meta.url} />
        <meta property="og:site_name" content={meta.siteName} />
        <meta property="og:image" content={meta.image} />
        <meta property="og:locale" content={meta.locale} />
        <meta property="article:author" content={meta.author} />
        <meta property="article:published_time" content={meta.published} />
        <meta property="article:modified_time" content={meta.updated} />
        <meta property="article:section" content={meta.category} />
        {meta.tags.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta httpEquiv="content-language" content="ar" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": meta.title,
              "description": meta.description,
              "image": meta.image,
              "author": {
                "@type": "Person",
                "name": meta.author
              },
              "publisher": {
                "@type": "Organization",
                "name": meta.siteName,
                "logo": {
                  "@type": "ImageObject",
                  "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news'}/images/logo_new.png`
                }
              },
              "datePublished": meta.published,
              "dateModified": meta.updated,
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": meta.url
              }
            })
          }}
        />
      </Head>
      <Layout>
        <PostContent post={post} relatedPosts={relatedPosts} />
      </Layout>
    </>
  );
};

// Server-side rendering function
export const getServerSideProps: GetServerSideProps<PostPageProps> = async (context) => {
  const { slug } = context.params as { slug: string };
  
  if (!slug) {
    const meta = generateMetaData(null, '');
    return {
      props: {
        post: null,
        relatedPosts: [],
        meta,
        error: 'الرابط غير صحيح'
      }
    };
  }

  try {
    // API configuration
    const isDevelopment = process.env.NODE_ENV === 'development';
    const API_URL = isDevelopment ? 'http://localhost:5000/api' : 'https://api.markaba.news/api/v2';
    
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'NewsMarkaba-SSR/1.0',
    };

    // Get post by slug
    const postsResponse = await fetch(
      `${API_URL}/posts?slug=${encodeURIComponent(slug)}&limit=1&page=1`, 
      { headers }
    );

    if (!postsResponse.ok) {
      const meta = generateMetaData(null, slug);
      return {
        props: {
          post: null,
          relatedPosts: [],
          meta,
          error: 'المنشور غير موجود'
        }
      };
    }

    const postsData = await postsResponse.json();
    
    if (!postsData.success || !postsData.data?.posts?.length) {
      const meta = generateMetaData(null, slug);
      return {
        props: {
          post: null,
          relatedPosts: [],
          meta,
          error: 'المنشور غير موجود'
        }
      };
    }

    const post = postsData.data.posts[0];
    
    // Fetch full post with related content
    let fullPost = post;
    let relatedPosts: Post[] = [];
    
    try {
      const fullPostResponse = await fetch(
        `${API_URL}/posts/${post.id}/${slug}?include_related=true&track_view=false`, 
        { headers }
      );

      if (fullPostResponse.ok) {
        const fullPostData = await fullPostResponse.json();
        if (fullPostData.success && fullPostData.data) {
          fullPost = fullPostData.data.post || post;
          relatedPosts = fullPostData.data.related_posts || [];
        }
      }
    } catch (e) {
      console.error('Error fetching full post:', e);
    }

    // Parse tags
    if (fullPost.tags && typeof fullPost.tags === 'string') {
      try {
        fullPost.tags = JSON.parse(fullPost.tags);
      } catch {
        fullPost.tags = fullPost.tags.split(',').map((t: string) => t.trim());
      }
    }
    
    // Generate meta data on server
    const meta = generateMetaData(fullPost, slug);

    return {
      props: {
        post: fullPost,
        relatedPosts,
        meta
      }
    };
  } catch (error) {
    const meta = generateMetaData(null, slug);
    return {
      props: {
        post: null,
        relatedPosts: [],
        meta,
        error: 'حدث خطأ أثناء تحميل المنشور'
      }
    };
  }
};

export default SinglePostPage;