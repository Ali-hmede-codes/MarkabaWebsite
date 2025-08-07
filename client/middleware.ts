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
  
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: http:",
    "media-src 'self' https:",
    "frame-src 'self' https://www.youtube.com https://youtube.com",
    "connect-src 'self' https://www.google-analytics.com https://api.markaba.news http://localhost:5000"
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};
