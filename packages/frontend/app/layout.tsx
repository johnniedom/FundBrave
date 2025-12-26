import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/theme";
import { PostsProvider } from "./provider/PostsContext";



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
      <body className="custom-scrollbar">
        <ThemeProvider defaultTheme="dark" storageKey="fundbrave-theme">
          <PostsProvider>
            {children}
          </PostsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

