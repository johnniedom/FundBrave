"use client";
import { useAuth } from "../../components/ui/hooks/useAuth";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean; // If true, requires authentication (for protected pages)
  redirectTo?: string; // Where to redirect if auth requirement not met
}

export default function AuthGuard({
  children,
  requireAuth = false,
  redirectTo = "/",
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Don't redirect while loading

    if (requireAuth && !isAuthenticated) {
      // User needs to be authenticated but isn't
      router.push("/login");
      return;
    }

    if (!requireAuth && isAuthenticated) {
      // User shouldn't be authenticated but is (for login/signup pages)
      router.push(redirectTo);
      return;
    }
  }, [isAuthenticated, isLoading, requireAuth, router, redirectTo]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render children if auth requirements aren't met
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (!requireAuth && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
