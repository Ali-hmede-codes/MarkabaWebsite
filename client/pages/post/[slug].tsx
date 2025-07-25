import { useRouter } from 'next/router';
import React from 'react';
import { useAPI } from '../../components/API/hooks';
// import Image from 'next/image'; // Removed to fix CORS issues
import Head from 'next/head';
import Layout from '../../components/Layout/Layout';
import { getImageUrl } from '../../lib/utils';

type Post = {
  id: number;
  title_ar: string;
  content_ar: string;
  featured_image: string;
  excerpt_ar: string;
  author_name: string;
  created_at: string;
  category_name_ar: string;
  reading_time: number;
  views: number;
};

const SinglePostPage: React.FC = () => {
  const router = useRouter();
  const { slug: slugParam } = router.query;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  const InnerPost = ({ slug }: { slug: string }) => {
    const { data: response, loading, error } = useAPI<{ posts: Post[]; total: number }>('/posts', {
      immediate: true,
      params: { slug, limit: 1, page: 1 }
    });
    const post = response?.posts?.[0];

    if (loading) return <div className="text-center py-10">جاري التحميل...</div>;
    if (error || !post) return <div className="text-center py-10 text-red-500">المنشور غير موجود</div>;

    return (
      <Layout title={post.title_ar} description={post.excerpt_ar}>
        <article className="max-w-4xl mx-auto px-4 py-8 bg-white text-blue-900">
          <h1 className="text-3xl font-bold mb-4 text-blue-800">{post.title_ar}</h1>
          <div className="flex items-center mb-6 text-blue-600">
            <span className="mr-4">{post.author_name}</span>
            <span className="mr-4">{new Date(post.created_at).toLocaleDateString('ar-EG')}</span>
            <span className="mr-4">{post.reading_time} دقائق قراءة</span>
            <span>{post.views} مشاهدات</span>
          </div>
          {post.featured_image && (
            <div className="relative w-full h-96 mb-8 overflow-hidden">
              <img src={getImageUrl(post.featured_image)} alt={post.title_ar} className="w-full h-full object-cover rounded-lg" />
            </div>
          )}
          <div className="prose max-w-none mb-8 text-gray-800" dangerouslySetInnerHTML={{ __html: post.content_ar }} />
          <div className="border-t pt-4 border-blue-200">
            <span className="text-blue-500">التصنيف: {post.category_name_ar}</span>
          </div>
        </article>
      </Layout>
    );
  };

  if (!slug) return <div className="text-center py-10">جاري التحميل...</div>;

  return router.isReady ? <InnerPost slug={slug} key={slug} /> : <div className="text-center py-10">جاري التحميل...</div>;
};

export default SinglePostPage;