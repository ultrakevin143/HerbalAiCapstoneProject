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
    if (password.length < 8) return { label: 'Too Short (Weak)', colorClass: 'bg-danger', width: 'w-1/3' };
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

    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
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
    <main className="flex min-h-screen flex-col lg:flex-row bg-[#fafaf8]">
      {/* Left side - brand */}
      <div className="flex flex-col justify-center items-center lg:items-start lg:w-1/2 p-8 lg:p-20 bg-gradient-to-br from-[#1b4332] to-[#40916c] text-[#ffffff] text-center lg:text-left border-b lg:border-b-0 lg:border-r border-green-700/20">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-[#ffffff] text-4xl mb-6 shadow-md">
          🌿
        </div>
        <h1 className="text-4xl lg:text-6xl font-black tracking-tight mb-4">Herbal AI</h1>
        <p className="text-lg lg:text-xl font-bold opacity-90 max-w-md">
          Join contributors preserving Philippine traditional herbal medicine knowledge.
        </p>
      </div>

      {/* Right side - form */}
      <div className="flex flex-col justify-center items-center lg:w-1/2 p-6 lg:p-12">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-6 lg:p-8 shadow-xl">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1b4332] mb-6">Create your account</h2>

          {error && (
            <div
              role="alert"
              className="mb-6 p-4 border-2 border-danger bg-red-50 text-danger font-bold rounded-lg text-sm"
            >
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div
              role="alert"
              className="mb-6 p-4 border-2 border-[#40916c] bg-[#eef5f0] text-[#2d6a4f] font-bold rounded-lg text-sm"
            >
              🎉 {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-extrabold text-[#1b4332] mb-1" htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  placeholder="Maria"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="flat-input"
                />
              </div>
              <div>
                <label className="block text-sm font-extrabold text-[#1b4332] mb-1" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  placeholder="Santos"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="flat-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-extrabold text-[#1b4332] mb-1" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                placeholder="maria_santos"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flat-input"
              />
            </div>

            <div>
              <label className="block text-sm font-extrabold text-[#1b4332] mb-1" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flat-input"
              />
            </div>

            <div>
              <label className="block text-sm font-extrabold text-[#1b4332] mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flat-input"
              />
              
              {/* Password strength meter */}
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden mt-2">
                <div className={`h-full transition-all duration-300 ${strength.colorClass} ${strength.width}`} />
              </div>
              <span className="text-xs font-bold text-[#6a7282] mt-1 block">
                Safety: {strength.label}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flat-button flat-button-primary w-full mt-4"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm font-bold text-[#6a7282]">
            Already have an account?{' '}
            <Link href="/signin" className="text-[#2d6a4f] hover:underline font-extrabold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
