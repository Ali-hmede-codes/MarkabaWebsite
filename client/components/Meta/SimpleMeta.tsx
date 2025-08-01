import Head from 'next/head';
import { siteConfig, defaultMeta } from '../../config/meta.config';

interface SimpleMetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  robots?: string;
  canonical?: string;
}

const SimpleMeta: React.FC<SimpleMetaProps> = ({
  title,
  description,
  keywords,
  author,
  robots,
  canonical
}) => {
  const pageTitle = title ? `${title} - ${siteConfig.name}` : defaultMeta.title;
  const pageDescription = description || defaultMeta.description;
  const pageKeywords = keywords || defaultMeta.keywords;
  const pageAuthor = author || defaultMeta.author;
  const pageRobots = robots || defaultMeta.robots;
  const currentUrl = canonical || siteConfig.url;

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      <meta name="author" content={pageAuthor} />
      <meta name="robots" content={pageRobots} />
      <meta name="viewport" content={defaultMeta.viewport} />
      <meta httpEquiv="Content-Language" content={siteConfig.locale} />
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={siteConfig.locale} />
      <meta property="og:site_name" content={siteConfig.name} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
    </Head>
  );
};

export default SimpleMeta;