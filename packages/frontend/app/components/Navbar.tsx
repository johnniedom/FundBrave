"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme";
import { useTheme } from "./theme/theme-provider";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  const { theme } = useTheme();

  const logoSrc =
    theme === "dark" ? "/FundBrave_light_logo.png" : "/FundBrave_dark_logo.png";
  return (
    <nav className="border-b border-border dark:bg-background shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image
              src={logoSrc}
              alt="FundBrave Logo"
              height={100}
              width={100}
              className="object-contain dark:block"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4 cursor-pointer">
          <div className="flex items-center space-x-6">
            <Link
              href="#"
              className="text-primary-900 dark:text-white hover:text-primary transition-colors"
            >
              Explore
            </Link>
            <Link
              href="#"
              className="text-primary-900 dark:text-white hover:text-primary transition-colors"
            >
              Start a Campaign
            </Link>
            <Link
              href="#"
              className="text-primary-900 dark:text-white hover:text-primary transition-colors"
            >
              About
            </Link>
          </div>
          <ThemeToggle />
          <button className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors font-medium">
            Connect Wallet
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center space-x-3">
          <ThemeToggle />
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-primary-900 dark:text-white" />
            ) : (
              <Menu className="h-6 w-6 text-primary-900 dark:text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-background border-t border-border">
          <div className="container mx-auto px-4 py-3 space-y-4">
            <Link
              href="#"
              className="block py-2 text-primary-900 dark:text-white hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Explore
            </Link>
            <Link
              href="#"
              className="block py-2 text-primary-900 dark:text-white hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start a Campaign
            </Link>
            <Link
              href="#"
              className="block py-2 text-primary-900 dark:text-white hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <div className="pt-2">
              <button className="w-full bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors font-medium">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
