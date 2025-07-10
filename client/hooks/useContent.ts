import { useState, useEffect } from 'react';
import { ContentData } from '../types';

/*interface ContentData {
  site: {
    name: string;
    tagline: string;
    description: string;
    keywords: string;
    email: string;
    phone: string;
    address: string;
  };
  header: {
    search_placeholder: string;
    menu: string;
    close_menu: string;
    search: string;
    home: string;
  };
  navigation: {
    home: string;
    categories: string;
    about: string;
    contact: string;
    breaking_news: string;
  };
  homepage: {
    hero_title: string;
    hero_subtitle: string;
    featured_posts: string;
    latest_posts: string;
    trending_posts: string;
    load_more: string;
    read_more: string;
    no_posts: string;
    loading: string;
  };
  category: {
    posts_in: string;
    no_posts_found: string;
    back_to_home: string;
    page: string;
    of: string;
    previous: string;
    next: string;
    breadcrumb_home: string;
    breadcrumb_categories: string;
  };
  post: {
    by: string;
    published_on: string;
    reading_time: string;
    share: string;
    related_posts: string;
    tags: string;
  };
  footer: {
    about_title: string;
    categories_title: string;
    quick_links_title: string;
    stay_connected: string;
    newsletter_text: string;
    email_placeholder: string;
    subscribe: string;
    follow_us: string;
    rights_reserved: string;
    privacy: string;
    terms: string;
    sitemap: string;
    about: string;
    contact: string;
    advertising: string;
    quick_links: Array<{
      label: string;
      href: string;
    }>;
  };
  categories: {
    [key: string]: string;
  };
  common: {
    [key: string]: string;
  }
}*/

export const useContent = () => {
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch('/content/ar.json');
        if (!response.ok) {
          throw new Error('Failed to load content');
        }
        const data = await response.json();
        setContent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  return { content, loading, error };
};

export default useContent;