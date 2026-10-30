'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'DONOR' | 'ADMIN';
  bloodGroup?: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadSession() {
      try {
        const res = await fetch('/api/auth');
        if (res.ok && isMounted) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSession();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              🩸
            </span>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">
              Blood<span className="text-red-600">Connect</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className={`transition-colors ${
                isActive('/') ? 'text-red-600 font-semibold' : 'text-gray-600 hover:text-red-600'
              }`}
            >
              Home
            </Link>
            <Link
              href="/donors"
              className={`transition-colors ${
                isActive('/donors') ? 'text-red-600 font-semibold' : 'text-gray-600 hover:text-red-600'
              }`}
            >
              Find Donors
            </Link>
            <Link
              href="/requests"
              className={`transition-colors ${
                isActive('/requests') ? 'text-red-600 font-semibold' : 'text-gray-600 hover:text-red-600'
              }`}
            >
              Blood Requests
            </Link>

            {user && (
              <Link
                href="/dashboard"
                className={`transition-colors ${
                  isActive('/dashboard') ? 'text-red-600 font-semibold' : 'text-gray-600 hover:text-red-600'
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* User Auth Buttons / Profile */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-full" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold text-gray-800 leading-tight">
                    {user.name}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full inline-block self-end mt-0.5 ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : user.role === 'DONOR'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 transition"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-red-600 px-3 py-2 transition"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-red-600 focus:outline-none"
              aria-label="Toggle Menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-gray-700 hover:text-red-600"
          >
            Home
          </Link>
          <Link
            href="/donors"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-gray-700 hover:text-red-600"
          >
            Find Donors
          </Link>
          <Link
            href="/requests"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-gray-700 hover:text-red-600"
          >
            Blood Requests
          </Link>
          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-gray-700 hover:text-red-600"
            >
              Dashboard
            </Link>
          )}

          <div className="pt-3 border-t border-gray-100">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex space-x-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-medium bg-red-600 text-white rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
