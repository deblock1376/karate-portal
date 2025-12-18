import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/sensei') || nextUrl.pathname.startsWith('/student');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // If logged in and on login/register page, redirect to dashboard based on role?
                // We can handle this in the page itself or here.
                // For now, let's just allow access to home page etc.
            }
            return true;
        },
        async session({ session, token }: any) {
            console.log('[Session Callback]', { tokenSub: token?.sub, tokenRole: token?.role });
            if (token && session.user) {
                session.user.id = token.sub;
                session.user.role = token.role;
            }
            return session;
        },
        async jwt({ token, user, trigger }: any) {
            console.log('[JWT Callback]', { trigger, hasUser: !!user, tokenSub: token?.sub });
            if (user) {
                token.role = user.role;
            }
            return token;
        }
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
