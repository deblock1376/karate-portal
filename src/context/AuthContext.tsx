'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { useRouter } from 'next/navigation';
import { addUserAction, fetchUserAction, loginUserAction, fetchLinkedStudentsAction } from '@/app/actions';
import { useSession, signIn, signOut } from 'next-auth/react';

interface AuthContextType {
    user: User | null;
    activeProfile: User | null;
    linkedStudents: User[];
    switchProfile: (userId: string | null) => void;
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
    const [activeProfile, setActiveProfile] = useState<User | null>(null);
    const [linkedStudents, setLinkedStudents] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            if (status === 'authenticated' && session?.user?.email) {
                try {
                    const foundUser = await loginUserAction(session.user.email);
                    if (foundUser) {
                        const formattedUser: User = {
                            ...foundUser,
                            id: foundUser.id,
                            name: foundUser.name || '',
                            email: foundUser.email || '',
                            role: foundUser.role as any,
                            startDate: foundUser.startDate || undefined,
                            contractStartDate: foundUser.contractStartDate || undefined,
                            contractRenewal: (foundUser.contractRenewal as any) || undefined,
                            senseiNotes: foundUser.senseiNotes || undefined,
                            address: foundUser.address || undefined,
                            signedContract: foundUser.signedContract || undefined,
                            password: foundUser.password || undefined,
                        };
                        setUser(formattedUser);
                        setActiveProfile(formattedUser);

                        // Fetch linked students
                        const students = await fetchLinkedStudentsAction(foundUser.id);
                        setLinkedStudents(students.map((s: any) => ({
                            ...s,
                            id: s.id,
                            name: s.name || '',
                            email: s.email || '',
                            role: s.role as any,
                            startDate: s.startDate || undefined,
                            contractStartDate: s.contractStartDate || undefined,
                            nextTestDate: s.nextTestDate || undefined,
                        })));
                    }
                } catch (e) {
                    console.error("Failed to load user data", e);
                }
            } else if (status === 'unauthenticated') {
                setUser(null);
                setActiveProfile(null);
                setLinkedStudents([]);
            }

            if (status !== 'loading') {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [session, status]);

    const login = async (email: string, password?: string) => {
        try {
            console.log('[AuthContext] Calling signIn for:', email);
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password
            });

            console.log('[AuthContext] signIn result:', result);

            if (result?.error) {
                console.error("Login failed:", result.error);
                return false;
            }

            console.log('[AuthContext] Login success, refreshing router...');
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

    const switchProfile = (userId: string | null) => {
        if (!userId || userId === user?.id) {
            setActiveProfile(user);
            return;
        }
        const linked = linkedStudents.find(s => s.id === userId);
        if (linked) {
            setActiveProfile(linked);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            activeProfile,
            linkedStudents,
            switchProfile,
            login,
            register,
            logout,
            isLoading
        }}>
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
