import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: 'jwt' },
    trustHost: true,
    providers: [
        Credentials({
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.log('[Auth] Missing email or password in credentials');
                    return null;
                }
                const { email, password } = credentials;
                console.log('[Auth] Attempting login for:', email);

                const normalizedEmail = (email as string).toLowerCase().trim();
                const user = await prisma.user.findUnique({
                    where: { email: normalizedEmail }
                });

                if (!user) {
                    console.log('[Auth] User not found:', normalizedEmail);
                    return null;
                }

                console.log('[Auth] User found, checking password for:', normalizedEmail);

                if (user.password) {
                    let passwordsMatch = false;

                    if (user.password.startsWith('$2')) {
                        try {
                            passwordsMatch = await bcrypt.compare(password as string, user.password);
                            console.log('[Auth] Bcrypt comparison result:', passwordsMatch);
                        } catch (e) {
                            console.error('[Auth] Bcrypt comparison failed:', e);
                        }
                    }

                    if (!passwordsMatch) {
                        const plainMatch = user.password === password;
                        console.log('[Auth] Plain text fallback comparison result:', plainMatch);
                        if (!plainMatch) {
                            return null;
                        }
                    }
                }

                console.log('[Auth] Login successful for:', normalizedEmail);
                return user;
            },
        }),
    ],
});
