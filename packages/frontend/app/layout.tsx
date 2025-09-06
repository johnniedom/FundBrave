import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/theme";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "FundBrave",
  description: "A decentralized fundraising platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="fundbrave-theme">
          <Navbar />    
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
