/** @type {import('next').NextConfig} */

import path from 'path';
import { config } from 'dotenv';

// Load environment variables from parent directory
config({ path: path.resolve(process.cwd(), '../.env') });

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Allow cross-origin requests from production server
  allowedDevOrigins: ['markaba.news', 'www.markaba.news', '69.62.115.12','api.markaba.news'],
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'markaba.news',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'production',
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    minimumCacheTTL: process.env.NODE_ENV === 'development' ? 0 : 60,
    dangerouslyAllowSVG: true,
  },
  
  // Environment variables loaded from parent .env file
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_UPLOAD_URL: process.env.NEXT_PUBLIC_UPLOAD_URL,
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_CLIENT_URL: process.env.NEXT_PUBLIC_CLIENT_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_ONESIGNAL_APP_ID: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
    NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID,
    NEXT_PUBLIC_ONESIGNAL_NOTIFY_BUTTON: process.env.NEXT_PUBLIC_ONESIGNAL_NOTIFY_BUTTON,
  },
  
  // Internationalization
  i18n: {
    locales: ['en', 'ar'],
    defaultLocale: 'ar',
    localeDetection: false,
  },
  
  // Redirects for SEO
  async redirects() {
    return [
      // Redirect old /posts/ URLs to new /post/ URLs
      {
        source: '/posts/:slug',
        destination: '/post/:slug',
        permanent: true,
      },
      // Redirect post URLs with IDs to clean URLs without IDs
      {
        source: '/post/:id(\\d+)/:slug',
        destination: '/post/:slug',
        permanent: true,
      },
      // Removed robots.txt and sitemap.xml redirects to fix Google Search Console indexing
      // These files should be served directly from /public folder
    ];
  },
  
  // Rewrites for clean URLs
  async rewrites() {
    const backend = (process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
    return [
      // Sitemap rewrites to serve API-generated sitemaps at root level
      {
        source: '/sitemap-posts.xml',
        destination: '/api/sitemap-posts.xml',
      },
      {
        source: '/sitemap-categories.xml',
        destination: '/api/sitemap-categories.xml',
      },
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap.xml',
      },
      {
        source: '/uploads/:path*',
        destination: `${backend}/uploads/:path*`,
      },
      {
        source: '/api/prayer/:path*',
        destination: `${backend}/api/prayer/:path*`,
      },
      {
        source: '/api/weather/:path*',
        destination: `${backend}/api/weather/:path*`,
      },
    ];
  },
  
  // Headers for SEO and security
  async headers() {
    return [
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400',
          },
        ],
      },
      {
        source: '/sitemap:path*.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
        ],
      },
      {
        source: '/api/sitemap:path*.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.youtube.com https://s.ytimg.com https://cdn.onesignal.com https://onesignal.com https://api.onesignal.com https://static.cloudflareinsights.com;
              connect-src 'self' https://markaba.news https://www.markaba.news https://www.google-analytics.com https://api.markaba.news http://127.0.0.1:5000 http://localhost:5000 https://www.youtube.com https://youtube.com https://cdn.onesignal.com https://api.onesignal.com https://onesignal.com https://*.onesignal.com https://static.cloudflareinsights.com https://firebase.googleapis.com https://firestore.googleapis.com https://securetoken.googleapis.com;
              img-src 'self' data: blob: https: http: https://www.google-analytics.com https://www.googletagmanager.com https://www.youtube.com https://s.ytimg.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://onesignal.com;
              font-src 'self' https://fonts.gstatic.com;
              frame-src https://www.youtube.com https://youtube.com https://onesignal.com;
              media-src 'self' https:;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
            `.replace(/\s{2,}/g, ' ').trim(),
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add any custom webpack configuration here
    return config;
  },
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: false, // Disabled to prevent HTML attributes in XML responses
    scrollRestoration: true,
  },
  
  // Compression
  compress: true,
  
  // PoweredByHeader
  poweredByHeader: false,
  
  // Generate ETags
  generateEtags: true,
  
  // Trailing slash
  trailingSlash: false,
};

export default nextConfig;
