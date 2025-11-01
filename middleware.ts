import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes, API routes, and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/' ||
    pathname === '/register' ||
    pathname === '/payment-required'
  ) {
    return NextResponse.next();
  }

  // Check if user is trying to access school dashboard areas
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/app')) {
    // In a real implementation, you would:
    // 1. Get the user's school ID from the session/token
    // 2. Check the school's status in the database
    // 3. Redirect to payment page if school is locked
    
    // For now, we'll handle this at the component level
    // since we need to check the user's school status after authentication
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};