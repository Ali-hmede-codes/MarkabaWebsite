import React from 'react';
import MetaTags from './MetaTags';

// Example usage for different page types

// 1. Home Page Example
export const HomePageSEO: React.FC = () => (
  <MetaTags 
    pageType="home" 
    language="ar"
  />
);

// 2. Category Page Example
interface CategoryPageSEOProps {
  category: {
    id: number;
    name_ar: string;
    name_en: string;
    description_ar?: string;
    description_en?: string;
    slug: string;
    post_count?: number;
  };
}

export const CategoryPageSEO: React.FC<CategoryPageSEOProps> = ({ category }) => (
  <MetaTags 
    pageType="category" 
    pageData={category}
    language="ar"
  />
);

// 3. Post Page Example
interface PostPageSEOProps {
  post: {
    id: number;
    title_ar: string;
    title_en: string;
    content_ar: string;
    content_en: string;
    excerpt_ar?: string;
    excerpt_en?: string;
    slug: string;
    featured_image?: string;
    author_name?: string;
    category_name_ar?: string;
    category_name_en?: string;
    created_at: string;
    updated_at: string;
    meta_description_ar?: string;
    meta_description_en?: string;
    meta_keywords_ar?: string;
    meta_keywords_en?: string;
    tags?: string[];
  };
}

export const PostPageSEO: React.FC<PostPageSEOProps> = ({ post }) => (
  <MetaTags 
    pageType="post" 
    pageData={post}
    language="ar"
  />
);

// 4. Search Page Example
interface SearchPageSEOProps {
  query: string;
  resultsCount?: number;
}

export const SearchPageSEO: React.FC<SearchPageSEOProps> = ({ query, resultsCount }) => (
  <MetaTags 
    pageType="search" 
    pageData={{ query, resultsCount }}
    language="ar"
  />
);

// 5. About Page Example
export const AboutPageSEO: React.FC = () => (
  <MetaTags 
    pageType="about" 
    language="ar"
  />
);

// 6. Contact Page Example
export const ContactPageSEO: React.FC = () => (
  <MetaTags 
    pageType="contact" 
    language="ar"
  />
);

// 7. Custom Page Example with Custom Meta
interface CustomPageSEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
}

export const CustomPageSEO: React.FC<CustomPageSEOProps> = ({ 
  title, 
  description, 
  keywords, 
  image 
}) => (
  <MetaTags 
    pageType="custom" 
    customMeta={{
      title,
      description,
      keywords,
      image
    }}
    language="ar"
  />
);

// Usage Examples in Pages:

/*
// pages/index.tsx
import { HomePageSEO } from '../components/SEO/SEOExamples';

export default function HomePage() {
  return (
    <>
      <HomePageSEO />
      <div>Your page content here</div>
    </>
  );
}

// pages/category/[slug].tsx
import { CategoryPageSEO } from '../../components/SEO/SEOExamples';

export default function CategoryPage({ category }) {
  return (
    <>
      <CategoryPageSEO category={category} />
      <div>Your category content here</div>
    </>
  );
}

// pages/post/[slug].tsx
import { PostPageSEO } from '../../components/SEO/SEOExamples';

export default function PostPage({ post }) {
  return (
    <>
      <PostPageSEO post={post} />
      <div>Your post content here</div>
    </>
  );
}

// pages/search.tsx
import { SearchPageSEO } from '../components/SEO/SEOExamples';

export default function SearchPage({ query, results }) {
  return (
    <>
      <SearchPageSEO query={query} resultsCount={results.length} />
      <div>Your search results here</div>
    </>
  );
}

// For custom pages with specific SEO needs:
import { CustomPageSEO } from '../components/SEO/SEOExamples';

export default function SpecialPage() {
  return (
    <>
      <CustomPageSEO 
        title="عنوان مخصص للصفحة"
        description="وصف مخصص للصفحة"
        keywords={['كلمة مفتاحية 1', 'كلمة مفتاحية 2']}
        image="/images/special-page.jpg"
      />
      <div>Your special page content here</div>
    </>
  );
}
*/