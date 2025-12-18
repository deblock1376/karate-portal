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
                    return null;
                }
                const { email, password } = credentials;

                const normalizedEmail = (email as string).toLowerCase().trim();
                const user = await prisma.user.findUnique({
                    where: { email: normalizedEmail }
                });

                if (!user) {
                    return null;
                }

                if (user.password) {
                    let passwordsMatch = false;

                    if (user.password.startsWith('$2')) {
                        try {
                            passwordsMatch = await bcrypt.compare(password as string, user.password);
                        } catch (e) {
                            console.error('[Auth] Bcrypt comparison failed:', e);
                        }
                    }

                    if (!passwordsMatch) {
                        if (user.password !== password) {
                            return null;
                        }
                    }
                }

                return user;
            },
        }),
    ],
});
