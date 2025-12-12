"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <Link href="/" className="text-2xl font-bold text-foreground">
                README Generator
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center flex-1 justify-center">
              <div className="flex items-center space-x-8">
                <Link
                  href="#features"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Features
                </Link>

                <Link
                  href="/docs"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Docs
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center space-x-4">
                {!isLoading &&
                  (user ? (
                    <Link href="/dashboard">
                      <Button className="text-sm bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600">
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/auth/login">
                        <Button variant="ghost" className="text-sm">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/auth/sign-up">
                        <Button className="text-sm bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  ))}
              </div>
              
              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 pt-16 bg-background/95 backdrop-blur-sm">
          <div className="px-4 py-6 space-y-6 border-t border-border">
            <div className="flex flex-col space-y-4">
              <Link
                href="#features"
                className="px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>

              <Link
                href="/docs"
                className="px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
            </div>

            <div className="pt-6 border-t border-border">
              <div className="flex flex-col space-y-4 px-4">
                {!isLoading &&
                  (user ? (
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full text-sm bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600">
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full text-sm">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/auth/sign-up" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full text-sm bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}