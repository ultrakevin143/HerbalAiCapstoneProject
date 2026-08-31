'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Check if user is staff (admin or botanist)
  const isStaff = user && (user.role === 'admin' || user.role === 'botanist');

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Library', href: '/library' },
    { name: 'Dr.Ai', href: '/chat' },
    { name: 'About', href: '/about' },
  ];

  // Only show Community/Messenger to authenticated users
  const authLinks = isAuthenticated
    ? [
        { name: 'Community', href: '/community' },
        { name: 'Messenger', href: '/messenger' },
      ]
    : [];

  const allLinks = [...navLinks, ...authLinks];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/90 bg-[rgba(163,239,149,0.2)] backdrop-blur-md px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] text-lg font-bold shadow-sm transition-transform group-hover:scale-105 text-white">
            <span className="font-serif-custom italic font-black text-xl">H</span>
          </div>
          <span className="font-serif-custom text-xl font-black italic tracking-tight text-[#1b4332]">
            Herbal <span className="text-[#40916c]">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {allLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-extrabold transition-all border-2 border-transparent ${
                  isActive
                    ? 'bg-[#eef5f0] text-[#1b4332] border-[#2d6a4f]'
                    : 'text-[#2d6a4f] hover:bg-[#eef5f0] hover:text-[#1b4332]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Desktop Authentication / Action buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              {/* User Identity Badge (Read-Only) */}
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-extrabold border border-[#1b4332]/10 bg-white shadow-sm"
              >
                {user?.avatar?.startsWith('http') ? (
                  <img src={user.avatar} alt="Avatar" className="h-5 w-5 rounded-full object-cover shadow-sm" />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2d6a4f] text-[10px] font-bold text-white uppercase">
                    {user?.name ? user.name.charAt(0) : 'U'}
                  </span>
                )}
                <span className="text-[#1b4332] max-w-[120px] truncate">
                  {user?.name && user.name.toLowerCase() !== 'admin' ? user.name : 'Admin'}
                </span>
              </div>

              <Link
                href="/suggest"
                className="flat-button flat-button-primary !py-2 !px-4 text-sm"
              >
                {user?.role === 'admin' ? 'Add Herb' : 'Suggest Herb'}
              </Link>

              {/* Admin Panel (if admin or botanist) */}
              {isStaff && (
                <Link
                  href="/admin"
                  className="flat-button flat-button-secondary !py-2 !px-4 text-sm"
                >
                  Admin Panel
                </Link>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flat-button flat-button-secondary !py-2 !px-4 text-sm !border-rose-700 !text-rose-700 hover:!bg-rose-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="flat-button flat-button-secondary !py-2 !px-5 text-sm"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flat-button flat-button-primary !py-2 !px-5 text-sm"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobileMenu}
          className="flex flex-col gap-1.5 border-2 border-[#1b4332] p-2 bg-[#f7f5ef] rounded-lg md:hidden hover:bg-[#eef5f0] focus:outline-none"
          aria-expanded={isMobileMenuOpen}
          aria-label="Toggle Navigation Menu"
        >
          <span className={`h-0.5 w-6 bg-[#1b4332] transition-transform ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`h-0.5 w-6 bg-[#1b4332] transition-opacity ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`h-0.5 w-6 bg-[#1b4332] transition-transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg md:hidden">
          {/* Navigation Links */}
          <div className="flex flex-col gap-2 border-b-2 border-[#1b4332]/25 pb-3">
            {allLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm font-extrabold border-2 border-transparent ${
                    isActive
                      ? 'bg-[#eef5f0] text-[#1b4332] border-[#2d6a4f]'
                      : 'text-[#2d6a4f] hover:bg-[#eef5f0]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Authentication Options */}
          <div className="flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2.5 px-3 py-2 border-2 border-[#1b4332]/10 bg-white rounded-lg">
                  {user?.avatar?.startsWith('http') ? (
                    <img src={user.avatar} alt="Avatar" className="h-7 w-7 rounded-full object-cover shadow-sm" />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2d6a4f] text-xs font-bold text-white uppercase">
                      {user?.name ? user.name.charAt(0) : 'U'}
                    </span>
                  )}
                  <div>
                    <p className="font-extrabold text-sm text-[#1b4332]">
                      {user?.name && user.name.toLowerCase() !== 'admin' ? user.name : 'Administrator'}
                    </p>
                    <p className="text-xs text-[#6a7282] capitalize">{user?.role}</p>
                  </div>
                </div>


                <Link
                  href="/suggest"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flat-button flat-button-primary w-full text-center"
                >
                  {user?.role === 'admin' ? 'Add Herb' : 'Suggest Herb'}
                </Link>

                {isStaff && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flat-button flat-button-secondary w-full text-center"
                  >
                    Admin Panel
                  </Link>
                )}

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flat-button flat-button-secondary w-full !border-rose-700 !text-rose-700 hover:!bg-rose-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/signin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flat-button flat-button-secondary text-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flat-button flat-button-primary text-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
