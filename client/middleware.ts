import { NextRequest, NextResponse } from 'next/server';
import { middleware as authMiddleware } from './middleware/auth';

export function middleware(request: NextRequest) {
  // First handle auth middleware for protected routes
  if (request.nextUrl.pathname.startsWith('/admin/administratorpage') || 
      request.nextUrl.pathname.startsWith('/auth')) {
    return authMiddleware(request);
  }

  // Add CSP headers for all other routes
  const response = NextResponse.next();
  
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.youtube.com https://youtube.com https://s.ytimg.com https://www.markaba.news ${isDev ? "'unsafe-eval' 'unsafe-inline'" : ''};
    script-src-elem 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.youtube.com https://youtube.com https://s.ytimg.com https://www.markaba.news ${isDev ? "'unsafe-eval' 'unsafe-inline'" : ''};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' blob: data: https: http:;
    media-src 'self' https:;
    frame-src 'self' https://youtube.com https://www.youtube.com https://*.youtube.com;
    connect-src 'self' https://www.google-analytics.com https://api.markaba.news http://localhost:5000 https://www.youtube.com https://youtube.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\n/g, '');

  response.headers.set('x-nonce', nonce);
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/((?!api|_next|favicon.ico|robots.txt|sitemap.xml).*)',
  ]
};
