"use client";
import React, { Children } from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { Session } from "next-auth";

interface SessionProviderProps {
  children: React.ReactNode;
  session?: Session | null; // Adjust the type based on your session structure
}
export default function SessionProvider({
  children,
  session,
}: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
