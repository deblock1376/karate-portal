'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { useRouter } from 'next/navigation';
import { addUserAction, fetchUserAction, loginUserAction } from '@/app/actions';
import { useSession, signIn, signOut } from 'next-auth/react';

interface AuthContextType {
    user: User | null;
    login: (email: string, password?: string) => Promise<boolean>;
    register: (name: string, email: string, password: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            // Simply allow the user state to potentially be derived from session if we want,
            // or fetch additional data ONLY if needed and safe. 
            // With the new session callback populating user.id and user.role, 
            // we might not need to fetch the full user object immediately if we trust the session.
            // However, to keep existing functionality (fetching full profile), we'll keep the fetch 
            // but ensure we don't cause a loop. 

            // Check if session is actually established
            if (status === 'authenticated' && session?.user?.email) {
                // ... logic remains but relies on STABLE session status
                try {
                    const foundUser = await loginUserAction(session.user.email);
                    if (foundUser) {
                        setUser({
                            ...foundUser,
                            name: foundUser.name || '',
                            email: foundUser.email || '',
                            role: foundUser.role as any,
                            startDate: foundUser.startDate?.toISOString(),
                            contractStartDate: foundUser.contractStartDate?.toISOString(),
                            contractRenewal: (foundUser.contractRenewal as any) || undefined,
                            senseiNotes: foundUser.senseiNotes || undefined,
                            address: foundUser.address || undefined,
                            signedContract: foundUser.signedContract || undefined,
                            password: foundUser.password || undefined,
                        });
                    }
                } catch (e) {
                    console.error("Failed to load user data", e);
                }
            } else if (status === 'unauthenticated') {
                setUser(null);
            }

            if (status !== 'loading') {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [session, status]);

    const login = async (email: string, password?: string) => {
        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password
            });

            if (result?.error) {
                console.error("Login failed", result.error);
                return false;
            }

            router.refresh();
            return true;
        } catch (e) {
            console.error("Login exception", e);
            throw e;
        }
    };

    const register = async (name: string, email: string, password: string) => {
        try {
            await addUserAction({
                name,
                email,
                password,
                startDate: new Date(),
            });

            await login(email, password);
            return true;
        } catch (error) {
            console.error('Registration failed:', error);
            return false;
        }
    };

    const logout = () => {
        signOut({ callbackUrl: '/login' });
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
