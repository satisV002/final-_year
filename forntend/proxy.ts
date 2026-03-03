import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register', '/home', '/about'];
const PROTECTED_PREFIXES = ['/dashboard', '/map', '/data', '/overview', '/forecast', '/stations', '/reports', '/rainfall'];

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const token = req.cookies.get('gw_token')?.value;

    const isPublic = PUBLIC_ROUTES.some(r => pathname === r) || pathname === '/';
    const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));

    if (isProtected && !token) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('from', pathname);
        return NextResponse.redirect(url);
    }

    if (isPublic && token && pathname !== '/' && pathname !== '/home' && pathname !== '/about') {
        const url = req.nextUrl.clone();
        url.pathname = '/overview';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
