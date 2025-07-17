import { useRouter } from 'next/router';
import React from 'react';
import { useAPI } from '../../components/API/hooks';
import Image from 'next/image';
import Head from 'next/head';

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

  const { data: response, loading, error } = useAPI<{ posts: Post[]; total: number }>('/posts', { params: { slug, limit: 1, page: 1 } });
  const post = response?.posts?.[0];

  if (!slug) return <div className="text-center py-10">جاري التحميل...</div>;


  if (loading) return <div className="text-center py-10">جاري التحميل...</div>;
  if (error || !post) return <div className="text-center py-10 text-red-500">المنشور غير موجود</div>;

  return (
    <>
      <Head>
        <title>{post.title_ar}</title>
        <meta name="description" content={post.excerpt_ar} />
      </Head>
      <article className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">{post.title_ar}</h1>
        <div className="flex items-center mb-6 text-gray-600">
          <span className="mr-4">{post.author_name}</span>
          <span className="mr-4">{new Date(post.created_at).toLocaleDateString('ar-EG')}</span>
          <span className="mr-4">{post.reading_time} دقائق قراءة</span>
          <span>{post.views} مشاهدات</span>
        </div>
        {post.featured_image && (
          <div className="relative w-full h-96 mb-8">
            <Image src={post.featured_image} alt={post.title_ar} fill className="object-cover rounded-lg" />
          </div>
        )}
        <div className="prose max-w-none mb-8" dangerouslySetInnerHTML={{ __html: post.content_ar }} />
        <div className="border-t pt-4">
          <span className="text-gray-500">التصنيف: {post.category_name_ar}</span>
        </div>
      </article>
    </>
  );
};

export default SinglePostPage;