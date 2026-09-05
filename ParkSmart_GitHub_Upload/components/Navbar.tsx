'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Car, Building2, LogOut, User, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [localUser, setLocalUser] = useState<{ role: 'driver' | 'owner'; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      // 1. Check Supabase Auth session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (err) {
        console.warn('Navbar auth check:', err);
      }

      // 2. Check Local Storage fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('parksmart_user');
        if (stored) {
          try {
            setLocalUser(JSON.parse(stored));
          } catch {}
        }
      }

      setLoading(false);
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}

    if (typeof window !== 'undefined') {
      localStorage.removeItem('parksmart_user');
    }

    setUser(null);
    setLocalUser(null);
    router.push('/');
    router.refresh();
  };

  // Determine if user is logged in
  const isDashboardPage = pathname.startsWith('/driver-dashboard') || pathname.startsWith('/owner-dashboard');
  const isLoggedIn = !!user || !!localUser || isDashboardPage;

  // Determine active role
  const activeRole: 'driver' | 'owner' =
    user?.user_metadata?.role ||
    localUser?.role ||
    (pathname.startsWith('/owner-dashboard') ? 'owner' : 'driver');

  const displayName =
    user?.user_metadata?.full_name ||
    localUser?.name ||
    user?.email ||
    (activeRole === 'owner' ? 'Parking Owner' : 'Driver');

  const switchRole = (newRole: 'driver' | 'owner') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parksmart_user', JSON.stringify({
        role: newRole,
        name: displayName,
      }));
    }
    setLocalUser({ role: newRole, name: displayName });
    const target = newRole === 'owner' ? '/owner-dashboard' : '/driver-dashboard';
    router.push(target);
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-blue-600 font-bold text-xl tracking-tight">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Car className="w-5 h-5" />
              </div>
              <span>ParkSmart</span>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === '/' ? 'text-blue-600 font-semibold' : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Home
            </Link>

            {isLoggedIn && (
              <>
                <Link
                  href="/driver-dashboard"
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === '/driver-dashboard'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  Driver View
                </Link>

                <Link
                  href="/owner-dashboard"
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === '/owner-dashboard'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'text-slate-600 hover:text-amber-700 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-amber-600" />
                  Rent My Spot (Owner)
                </Link>
              </>
            )}

            {!loading && (
              <>
                {isLoggedIn ? (
                  <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-full ${
                          activeRole === 'owner' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        <User className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-slate-800">{displayName}</div>
                        <div className="text-slate-500 capitalize">{activeRole}</div>
                      </div>
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-red-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/login"
                      className="text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors shadow-sm"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 p-2 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 rounded-md"
          >
            Home
          </Link>

          {isLoggedIn && activeRole === 'driver' && (
            <Link
              href="/driver-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-md"
            >
              Driver Dashboard
            </Link>
          )}

          {isLoggedIn && activeRole === 'owner' && (
            <Link
              href="/owner-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-amber-700 hover:bg-amber-50 rounded-md"
            >
              Owner Dashboard
            </Link>
          )}

          {isLoggedIn ? (
            <div className="pt-2 border-t border-slate-100">
              <div className="px-3 py-2 text-sm text-slate-700 font-semibold">{displayName} ({activeRole})</div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-3 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-md"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-3 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
