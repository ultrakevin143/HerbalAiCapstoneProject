'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function SignUpPage() {
  const { signup } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Dynamic password strength evaluation
  const getPasswordStrength = () => {
    if (password.length === 0) return { label: 'Enter at least 8 characters', colorClass: 'bg-[#6a7282]/20', width: 'w-0' };
    if (password.length < 8) return { label: 'Too Short (Weak)', colorClass: 'bg-rose-500', width: 'w-1/3' };
    if (password.length < 12) return { label: 'Safe (Medium)', colorClass: 'bg-[#c9a040]', width: 'w-2/3' };
    return { label: 'Strong', colorClass: 'bg-[#40916c]', width: 'w-full' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate fields locally
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }

    setLoading(true);

    try {
      await signup({
        name: `${firstName} ${lastName}`.trim(),
        username,
        email,
        password,
      });

      setSuccess('Signup successful! Please check your email to verify your account.');
      setTimeout(() => {
        router.push('/signin');
      }, 5000);

    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please check your inputs.'
      );
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col lg:flex-row bg-transparent font-sans">
      {/* Left side - brand */}
      <div className="flex flex-col justify-center items-center lg:items-start lg:w-1/2 p-8 lg:p-20 bg-gradient-to-br from-[#1b4332] to-[#40916c] text-[#ffffff] text-center lg:text-left border-b lg:border-b-0 lg:border-r border-green-700/20">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-[#ffffff] text-4xl mb-6 shadow-md">
          🌿
        </div>
        <h1 className="text-4xl lg:text-6xl font-serif-custom italic font-normal tracking-tight mb-4">Herbal-Ai</h1>
        <p className="text-lg lg:text-xl font-bold opacity-90 max-w-md">
          Join contributors preserving Philippine traditional herbal medicine knowledge.
        </p>
      </div>

      {/* Right side - form */}
      <div className="flex flex-col justify-center items-center lg:w-1/2 p-6 lg:p-12">
        <div className="w-full max-w-md glass-card bg-white/60 dark:bg-panel/80 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-6 lg:p-8 shadow-xl">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1b4332] dark:text-ink mb-6">Create your account</h2>

          {error && (
            <div
              role="alert"
              className="mb-6 p-4 border border-rose-200 bg-rose-50 text-rose-800 font-bold rounded-xl text-sm"
            >
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div
              role="alert"
              className="mb-6 p-4 border border-[#40916c] bg-[#eef5f0] text-[#2d6a4f] font-bold rounded-xl text-sm"
            >
              🎉 {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-1" htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  placeholder="Maria"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
                />
              </div>
              <div>
                <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-1" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  placeholder="Santos"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-1" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                placeholder="maria_santos"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
              />
            </div>

            <div>
              <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-1" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
              />
            </div>

            <div>
              <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
              />
              {/* Strength indicator */}
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full bg-gray-200 dark:bg-line rounded-full overflow-hidden">
                  <div className={`h-full ${strength.colorClass} ${strength.width} transition-all duration-300`} />
                </div>
                <p className="text-xs text-gray-500 dark:text-muted font-bold">{strength.label}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-gradient bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white font-semibold text-base px-8 py-3.5 rounded-full shadow-sm hover:brightness-105 transition-all w-full cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm font-bold text-[#6a7282] dark:text-muted mt-6">
            Already have an account?{' '}
            <Link href="/signin" className="text-[#2d6a4f] dark:text-[#74c69d] hover:underline font-extrabold">
              Sign in
            </Link>
          </p>
          <Link
            href="/"
            className="mt-5 flex min-h-11 w-full items-center justify-center rounded-full border border-black/15 bg-white/70 px-5 py-3 text-sm font-semibold text-[#1b4332] transition-colors hover:bg-white dark:border-line dark:bg-soft dark:text-ink dark:hover:bg-panel"
          >
            Continue as guest
          </Link>
        </div>
      </div>
    </main>
  );
}
