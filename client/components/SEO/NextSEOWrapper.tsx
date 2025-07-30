import React from 'react';
import { NextSeo, ArticleJsonLd, NewsArticleJsonLd } from 'next-seo';
import { useMeta } from '../../hooks/useMeta';

interface NextSEOWrapperProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  category?: string;
  tags?: string[];
  noindex?: boolean;
}

const NextSEOWrapper: React.FC<NextSEOWrapperProps> = ({
  title,
  description,
  imageUrl,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  category,
  tags = [],
  noindex = false
}) => {
  const { meta, openGraph, twitterCard } = useMeta({
    pageType: type === 'article' ? 'post' : 'custom',
    customMeta: {
      title,
      description,
      image: imageUrl,
      url,
      type,
      publishedTime,
      modifiedTime,
      author,
      section: category
    }
  });

  const seoConfig = {
    title: meta.title,
    description: meta.description,
    canonical: meta.url,
    noindex,
    openGraph: {
      type: openGraph.type,
      url: openGraph.url,
      title: openGraph.title,
      description: openGraph.description,
      images: [
        {
          url: openGraph.image,
          width: 1200,
          height: 630,
          alt: openGraph.title,
          type: 'image/jpeg',
        },
      ],
      siteName: openGraph.siteName,
      locale: openGraph.locale,
      ...(type === 'article' && {
        article: {
          publishedTime: openGraph.publishedTime,
          modifiedTime: openGraph.modifiedTime,
          authors: openGraph.author ? [openGraph.author] : [],
          section: openGraph.section,
          tags,
        },
      }),
    },
    twitter: {
      handle: twitterCard.creator,
      site: twitterCard.site,
      cardType: twitterCard.card,
    },
    additionalMetaTags: [
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'robots',
        content: noindex ? 'noindex,nofollow' : 'index,follow',
      },
      {
        name: 'author',
        content: author || 'أخبار مركبا',
      },
      {
        name: 'keywords',
        content: tags.join(', '),
      },
    ],
    additionalLinkTags: [
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
        sizes: '180x180',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
    ],
  };

  return (
    <>
      <NextSeo {...seoConfig} />
      
      {/* JSON-LD for Articles */}
      {type === 'article' && publishedTime && (
        <NewsArticleJsonLd
          url={meta.url}
          title={meta.title}
          images={[meta.image]}
          section={category || 'أخبار'}
          keywords={tags.join(',')}
          datePublished={publishedTime}
          dateCreated={publishedTime}
          dateModified={modifiedTime || publishedTime}
          authorName={author || 'أخبار مركبا'}
          publisherName="أخبار مركبا"
          publisherLogo="https://markaba.news/images/logo.png"
          description={meta.description}
          body={meta.description}
        />
      )}
      
      {/* Alternative Article JSON-LD */}
      {type === 'article' && publishedTime && (
        <ArticleJsonLd
          type="NewsArticle"
          url={meta.url}
          title={meta.title}
          images={[meta.image]}
          datePublished={publishedTime}
          dateModified={modifiedTime || publishedTime}
          authorName={author || 'أخبار مركبا'}
          publisherName="أخبار مركبا"
          publisherLogo="https://markaba.news/images/logo.png"
          description={meta.description}
        />
      )}
    </>
  );
};

export default NextSEOWrapper;