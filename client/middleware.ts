import { NextRequest } from 'next/server';
import { middleware as authMiddleware } from './middleware/auth';

export function middleware(request: NextRequest) {
  return authMiddleware(request);
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/admin/administratorpage/:path*',
    '/auth/:path*'
  ]
};
