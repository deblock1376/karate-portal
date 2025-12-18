import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth((req) => {
    // Debug logging
    console.log('[Middleware]', {
        path: req.nextUrl.pathname,
        hasAuth: !!req.auth,
        cookies: req.cookies.getAll().map(c => c.name),
    });
});

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register|debug|.*\\..*).*)'],
};
