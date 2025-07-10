// Enhanced authentication middleware for admin pages
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if accessing admin pages
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Skip middleware for login page
    if (request.nextUrl.pathname === '/auth/login') {
      return NextResponse.next();
    }
    
    // Check for authentication token
    const token = request.cookies.get('token')?.value;
    const user = request.cookies.get('user')?.value;
    
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
  matcher: ['/admin/:path*']
};