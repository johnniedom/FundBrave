// hooks/useAuth.ts
'use client';
import { useSession } from 'next-auth/react';

import { useRouter } from 'next/navigation';

import { useEffect, useState, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  totalPoints: number;
  referralCode: string;
  authProvider: string;
  image?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): AuthState => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        return true;
      } else {
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      return false;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    await checkAuthToken();
    setIsLoading(false);
  }, [checkAuthToken]);

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    if (session?.user) {
      // User is authenticated via OAuth
      setUser({
        id: session.user.id || '',
        email: session.user.email || '',
        name: session.user.name || '',
        username: session.user.username || '',
        totalPoints: session.user.totalPoints || 0,
        referralCode: session.user.referralCode || '',
        authProvider: 'oauth',
        image: session.user.image || undefined,
      });
      setIsLoading(false);
    } else {
      // Check for regular auth token
      checkAuthToken().finally(() => {
        setIsLoading(false);
      });
    }
  }, [session, status, checkAuthToken]);

  const logout = async () => {
    try {
      // If OAuth user, sign out from NextAuth
      if (session) {
        const { signOut } = await import('next-auth/react');
        await signOut({ redirect: false });
      }
      
      // Clear regular auth token
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshUser,
  };
};