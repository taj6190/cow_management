'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GiCow } from 'react-icons/gi';
import { FiLock, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('Something went wrong. Try again.');
    }
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    setEmail('admin@gorufarm.com');
    setPassword('admin123');

    try {
      const result = await signIn('credentials', {
        email: 'admin@gorufarm.com',
        password: 'admin123',
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('Something went wrong. Try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 mx-auto flex items-center justify-center shadow-lg mb-4">
            <GiCow className="text-white text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">GoruFarm</h1>
          <p className="text-sm text-surface-500 mt-1">Farm Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-0 border border-surface-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-surface-900 mb-1">Sign In</h2>
          <p className="text-sm text-surface-500 mb-6">Enter your credentials to access the dashboard</p>

          {/* CV / Demo Access Credentials Box */}
          <div className="mb-6 p-4 bg-primary-50 border border-primary-200 text-sm">
            <div className="flex items-center justify-between mb-3 border-b border-primary-200 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-800 flex items-center gap-1.5">
                <span>🔑</span> Demo Access (For Reviewers)
              </span>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="text-xs font-semibold text-primary-700 hover:text-primary-950 transition-colors flex items-center gap-1 cursor-pointer bg-primary-100 hover:bg-primary-200 px-2 py-1 border border-primary-300"
              >
                ⚡ Instant Login
              </button>
            </div>
            <div className="space-y-1.5 text-xs text-surface-700">
              <div className="flex justify-between items-center">
                <span className="font-medium text-surface-600">Email:</span>
                <code className="bg-surface-100 px-1.5 py-0.5 font-mono text-surface-800 select-all border border-surface-200">
                  admin@gorufarm.com
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-surface-600">Password:</span>
                <code className="bg-surface-100 px-1.5 py-0.5 font-mono text-surface-800 select-all border border-surface-200">
                  admin123
                </code>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 text-sm font-medium flex items-center gap-2">
              <FiLock size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1.5">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gorufarm.com"
                  className="input pl-10"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-surface-100 text-center">
            <p className="text-xs text-surface-400">
              🔒 This is a private system. Contact admin for access.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-surface-400 mt-4">
          🇧🇩 GoruFarm Management System • All amounts in BDT (৳)
        </p>
      </div>
    </div>
  );
}
