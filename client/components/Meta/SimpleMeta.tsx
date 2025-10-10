import Head from 'next/head';
import { siteConfig, defaultMeta } from '../../config/meta.config';

interface SimpleMetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  robots?: string;
  canonical?: string;
  image?: string;
  structuredData?: any;
}

const SimpleMeta: React.FC<SimpleMetaProps> = ({
  title,
  description,
  keywords,
  author,
  robots,
  canonical,
  image,
  structuredData
}) => {
  const pageTitle = title ? `${title} - ${siteConfig.name}` : defaultMeta.title;
  const pageDescription = description || defaultMeta.description;
  const pageKeywords = keywords || defaultMeta.keywords;
  const pageAuthor = author || defaultMeta.author;
  const pageRobots = robots || defaultMeta.robots;
  const currentUrl = canonical || siteConfig.url;
  const pageImage = image || siteConfig.logo;

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
      {pageImage && <meta property="og:image" content={pageImage} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      {pageImage && <meta name="twitter:image" content={pageImage} />}
      
      {/* Structured Data */}
      {structuredData && (
        Array.isArray(structuredData) ? (
          structuredData.map((data, index) => (
            <script
              key={index}
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(data)
              }}
            />
          ))
        ) : (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData)
            }}
          />
        )
      )}
    </Head>
  );
};

export default SimpleMeta;