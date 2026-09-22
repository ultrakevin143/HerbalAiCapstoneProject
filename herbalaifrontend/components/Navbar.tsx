'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ProfileEditorModal from './ProfileEditorModal';
import DisplayPreferences from './DisplayPreferences';
import BrandMark from './BrandMark';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const isStaff = user && (user.role === 'admin' || user.role === 'botanist');

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Library', href: '/library' },
    { name: 'Dr. Ai', href: '/chat' },
    { name: 'About', href: '/about' },
  ];

  const authLinks = isAuthenticated
    ? [
        { name: 'Community', href: '/community' },
        { name: 'Messenger', href: '/messenger' },
      ]
    : [];

  const allLinks = [...navLinks, ...authLinks];

  return (
    <>
      <nav aria-label="Main navigation" className="site-nav sticky top-0 z-50 w-full glass-header px-4 sm:px-6 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <BrandMark className="h-10 w-10 shrink-0 text-[#1b4332] dark:text-[#e6f1e7] transition-transform group-hover:scale-105" />
            <span className="font-sans text-xl font-extrabold tracking-tight text-[#1b4332] dark:text-ink whitespace-nowrap shrink-0">
              Herbal-<span className="text-[#2d6a4f] dark:text-[#b4e858]">Ai</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden xl:flex items-center gap-1 shrink-0">
            {allLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition-all border-2 border-transparent whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#eef5f0] dark:bg-soft text-[#1b4332] dark:text-ink border-[#2d6a4f]'
                      : 'text-[#2d6a4f] dark:text-muted hover:bg-[#eef5f0] dark:hover:bg-soft hover:text-[#1b4332] dark:hover:text-ink'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Desktop Authentication / Action buttons */}
          <div className="hidden xl:flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <>
                <Link
                  href="/suggest"
                  className="bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white font-bold text-xs px-4 py-2 rounded-full shadow-xs hover:brightness-105 transition-all shrink-0 whitespace-nowrap inline-flex items-center justify-center gap-1.5"
                >
                  <span>🌱</span>
                  <span>Suggest Herb</span>
                </Link>

                <NotificationBell />

                {/* Account / User Menu Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    aria-label="User account menu"
                    aria-expanded={isUserMenuOpen}
                    className="flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5 text-xs font-extrabold border border-black/10 dark:border-line bg-white/80 dark:bg-panel shadow-xs hover:bg-[#eef5f0] dark:hover:bg-soft transition-all cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    {user?.avatar?.startsWith('http') ? (
                      <img src={user.avatar} alt="Avatar" className="h-6 w-6 rounded-full object-cover shadow-xs" />
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2d6a4f] text-[10px] font-bold text-white uppercase">
                        {user?.name ? user.name.charAt(0) : 'U'}
                      </span>
                    )}
                    <span className="text-[#1b4332] dark:text-ink max-w-[120px] truncate">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-muted transition-transform duration-200">
                      {isUserMenuOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-black/10 dark:border-line bg-white/95 dark:bg-[#18221b]/95 backdrop-blur-xl shadow-xl p-3 space-y-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* User Info Header */}
                      <div className="px-3 py-2 border-b border-black/5 dark:border-line flex items-center gap-3">
                        {user?.avatar?.startsWith('http') ? (
                          <img src={user.avatar} alt="Avatar" className="h-9 w-9 rounded-full object-cover shadow-sm" />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] text-xs font-bold text-white uppercase shadow-sm">
                            {user?.name ? user.name.charAt(0) : 'U'}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-[#1b4332] dark:text-ink truncate">{user?.name}</p>
                          <p className="text-xs text-[#2d6a4f] dark:text-muted truncate capitalize">{user?.role || 'Member'}</p>
                        </div>
                      </div>

                      {/* Dropdown Options */}
                      <div className="space-y-1">
                        {isStaff && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-bold text-[#1b4332] dark:text-ink hover:bg-[#eef5f0] dark:hover:bg-soft transition-colors"
                          >
                            <span className="text-sm">🛡️</span>
                            <span>Admin Panel</span>
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsProfileEditorOpen(true);
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-bold text-[#1b4332] dark:text-ink hover:bg-[#eef5f0] dark:hover:bg-soft transition-colors text-left cursor-pointer"
                        >
                          <span className="text-sm">✏️</span>
                          <span>Edit Profile</span>
                        </button>

                        <div className="px-1 py-1">
                          <DisplayPreferences />
                        </div>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-black/5 dark:border-line pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
                        >
                          <span className="text-sm">🚪</span>
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <DisplayPreferences />
                <Link
                  href="/signin"
                  className="text-xs font-extrabold text-[#2d6a4f] dark:text-ink px-3 py-1.5 hover:underline shrink-0 whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white font-bold text-xs px-4 py-2 rounded-full shadow-xs hover:brightness-105 transition-all shrink-0 whitespace-nowrap inline-flex items-center justify-center"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-2 xl:hidden">
            <DisplayPreferences />
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={toggleMobileMenu}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 dark:border-line bg-white/80 dark:bg-panel text-[#1b4332] dark:text-ink cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="text-xl">{isMobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-black/10 dark:border-line mt-3 pt-3 space-y-2 pb-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {allLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block rounded-2xl px-4 py-2.5 text-sm font-extrabold transition-all ${
                    isActive
                      ? 'bg-[#eef5f0] dark:bg-soft text-[#1b4332] dark:text-ink'
                      : 'text-[#2d6a4f] dark:text-muted hover:bg-[#eef5f0] dark:hover:bg-soft'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            <div className="border-t border-black/10 dark:border-line pt-3 space-y-2">
              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsProfileEditorOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-[#1b4332] dark:text-ink bg-white/60 dark:bg-soft"
                  >
                    <span>👤 Profile ({user?.name})</span>
                  </button>

                  {isStaff && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block rounded-2xl px-4 py-2.5 text-sm font-extrabold text-[#2d6a4f] dark:text-[#74c69d]"
                    >
                      Admin Panel
                    </Link>
                  )}

                  <Link
                    href="/suggest"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block rounded-2xl px-4 py-2.5 text-sm font-extrabold text-[#2d6a4f] dark:text-[#74c69d]"
                  >
                    Suggest Herb
                  </Link>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left rounded-2xl px-4 py-2.5 text-sm font-extrabold text-rose-600"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-2 pt-1">
                  <Link
                    href="/signin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn btn-outline border-2 border-[#2d6a4f] text-[#2d6a4f] dark:text-ink font-bold text-center py-2.5 rounded-full"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn btn-gradient bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white font-bold text-center py-2.5 rounded-full shadow-sm"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Profile Editor Modal */}
      <ProfileEditorModal
        isOpen={isProfileEditorOpen}
        onClose={() => setIsProfileEditorOpen(false)}
      />
    </>
  );
}
