import { useRouter } from 'next/router';
import React from 'react';
import { useAPI } from '../../components/API/hooks';
import { FiCalendar, FiClock } from 'react-icons/fi';
import Head from 'next/head';
import Layout from '../../components/Layout/Layout';

type LastNewsItem = {
  id: number;
  title_ar: string;
  content_ar: string;
  slug: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const SingleLastNewsPage: React.FC = () => {
  const router = useRouter();
  const { slug: slugParam } = router.query;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  const InnerLastNews = ({ slug }: { slug: string }) => {
    const { data: response, loading, error } = useAPI<{ success: boolean; data: LastNewsItem }>(`/last-news/slug/${slug}`, {
      immediate: true
    });
    const newsItem = response?.data;

    if (loading) return <div className="text-center py-10">جاري التحميل...</div>;
    if (error || !newsItem) return <div className="text-center py-10 text-red-500">الخبر غير موجود</div>;

    return (
      <Layout title={newsItem.title_ar} description={newsItem.content_ar?.substring(0, 160)}>
        <article className="max-w-4xl mx-auto px-4 py-8 bg-white text-blue-900" dir="rtl">
          <div className="mb-6">
            <div className="flex items-center mb-4 text-blue-600">
              <FiClock className="ml-2" />
              <span className="text-sm">آخر الأخبار</span>
            </div>
            <h1 className="text-3xl font-bold mb-4 text-blue-800">{newsItem.title_ar}</h1>
            <div className="flex items-center mb-6 text-blue-600">
              <FiCalendar className="ml-2" />
              <span>{new Date(newsItem.created_at).toLocaleDateString('ar-EG')}</span>
              {newsItem.updated_at !== newsItem.created_at && (
                <span className="mr-4">آخر تحديث: {new Date(newsItem.updated_at).toLocaleDateString('ar-EG')}</span>
              )}
            </div>
          </div>
          
          <div className="prose max-w-none mb-8 text-gray-800 leading-relaxed" 
               dangerouslySetInnerHTML={{ __html: newsItem.content_ar }} />
          
          <div className="border-t pt-4 border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-blue-500">أولوية الخبر: {newsItem.priority}</span>
              <button 
                onClick={() => router.back()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                العودة
              </button>
            </div>
          </div>
        </article>
      </Layout>
    );
  };

  if (!slug) return <div className="text-center py-10">جاري التحميل...</div>;

  return router.isReady ? <InnerLastNews slug={slug} key={slug} /> : <div className="text-center py-10">جاري التحميل...</div>;
};

export default SingleLastNewsPage;