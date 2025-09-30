import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/theme";



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
        <ThemeProvider defaultTheme="dark" storageKey="fundbrave-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
