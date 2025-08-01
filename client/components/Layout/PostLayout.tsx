import React, { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'author';
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name_ar: string;
  slug: string;
  description_ar?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  posts_count?: number;
  created_at: string;
  updated_at: string;
}

interface PostData {
  id: number;
  title: string;
  title_ar?: string;
  content: string;
  content_ar?: string;
  excerpt?: string;
  excerpt_ar?: string;
  meta_description?: string;
  meta_description_ar?: string;
  meta_keywords?: string;
  meta_keywords_ar?: string;
  featured_image?: string;
  slug: string;
  author?: User;
  category?: Category;
  created_at: string;
  updated_at: string;
  status?: string;
}

interface PostLayoutProps {
  children: ReactNode;
  post?: PostData;
  title?: string;
  description?: string;
  className?: string;
  containerClassName?: string;
}

const PostLayout: React.FC<PostLayoutProps> = ({
  children,
  post,
  title,
  description,
  className = '',
  containerClassName = '',
}) => {



  return (
    <div className={`min-h-screen flex flex-col bg-white ${className}`}>
      <Header />
      <main className={`flex-grow ${containerClassName}`}>
        {children}
      </main>
      <Footer />
      <Toaster position="top-right" />
    </div>
  );
  };




export default PostLayout;