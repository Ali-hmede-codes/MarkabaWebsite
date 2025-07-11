// Enhanced authentication middleware for admin pages
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const user = request.cookies.get('user')?.value;
  
  // Check if accessing login page
  if (request.nextUrl.pathname === '/auth/login') {
    // If user is already authenticated and is admin, redirect to admin panel
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        if (userData.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      } catch (error) {
        // Invalid user data, clear cookies and continue to login
        const response = NextResponse.next();
        response.cookies.delete('token');
        response.cookies.delete('user');
        return response;
      }
    }
    return NextResponse.next();
  }
  
  // Check if accessing admin pages
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token || !user) {
      // Redirect to login page if not authenticated
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    try {
      // Parse user data to check role
      const userData = JSON.parse(user);
      
      // Only allow admin users
      if (userData.role !== 'admin') {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    } catch (error) {
      // Invalid user data, redirect to login
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*']
};