'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060e20]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b6a0ff]"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden bg-[#060e20]">
      {/* Background Ambient Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#b6a0ff]/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#00e3fd]/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-[#0f1930] rounded-xl overflow-hidden shadow-2xl relative z-10">
        {/* Left Side: Visual/Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-[#141f38] relative overflow-hidden">
          <div className="relative z-20">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#006875]/30 text-[#00e3fd] text-[10px] font-bold tracking-widest uppercase mb-6 border border-[#00e3fd]/20">
              Secure Access Point
            </div>
            <h1 className="text-5xl font-bold text-[#dee5ff] leading-tight tracking-tighter mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              The Intelligence <br />
              <span className="text-[#b6a0ff]">Behind the Truth.</span>
            </h1>
            <p className="text-[#a3aac4] text-lg max-w-md leading-relaxed">
              Access the most advanced forensic analysis suite. Our neural networks process data with 99.8% precision for legal and investigative clarity.
            </p>
          </div>

          <div className="mt-12 space-y-6 relative z-20">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-[#060e20]/40 border border-[#40485d]/10">
              <span className="material-symbols-outlined text-[#00e3fd]">verified_user</span>
              <div>
                <p className="text-sm font-semibold text-[#dee5ff]">End-to-End Encryption</p>
                <p className="text-xs text-[#a3aac4]">Protocols meet Tier-4 security standards for sensitive data handling.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-[#060e20]/40 border border-[#40485d]/10">
              <span className="material-symbols-outlined text-[#b6a0ff]">psychology</span>
              <div>
                <p className="text-sm font-semibold text-[#dee5ff]">Neural Audit Trail</p>
                <p className="text-xs text-[#a3aac4]">Every analysis is logged with immutable cryptographic signatures.</p>
              </div>
            </div>
          </div>

          {/* Decorative Image Overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3GawoeGBJQsc1ObBYQ47v5niPg3DBTm1XmivqtdqAaskqyPzX5FLKH5mpLjk24jY1I2GBxgaqdnELUNBJNTPzTKooNQBtUf3Mi4SgtY0Hw4vsHZ86Qo8WXT5eQQOmNGZ70vRIPeJ2nuR_SjaPWVswx9rXM8BAeOXkHy3YA9XG-DVX8nVggyEMMIIUJSmvkksTFrFJrVqlr06xb_wJbXNVvYY0hw1v6fA_4pNCcP8SEp7yPpqM40ZxKwPZjBaQMsmN0pPwl3uNiEs"
              alt="Abstract digital matrix"
              fill
              className="object-cover grayscale mix-blend-overlay"
            />
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 lg:p-16 bg-[#060e20] flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-[#dee5ff] mb-2 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Sign In
            </h2>
            <p className="text-[#a3aac4] text-sm">Welcome back. Sign in to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#a3aac4] ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6d758c] group-focus-within:text-[#00e3fd] transition-colors">
                  alternate_email
                </span>
                <input
                  className="w-full bg-black border border-[#40485d]/20 rounded-lg py-4 pl-12 pr-4 text-[#dee5ff] focus:outline-none focus:border-[#00e3fd] focus:ring-1 focus:ring-[#00e3fd]/20 transition-all placeholder:text-[#6d758c]/50"
                  id="email"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#a3aac4] ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6d758c] group-focus-within:text-[#00e3fd] transition-colors">
                  lock
                </span>
                <input
                  className="w-full bg-black border border-[#40485d]/20 rounded-lg py-4 pl-12 pr-12 text-[#dee5ff] focus:outline-none focus:border-[#00e3fd] focus:ring-1 focus:ring-[#00e3fd]/20 transition-all placeholder:text-[#6d758c]/50"
                  id="password"
                  placeholder="••••••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#6d758c] cursor-pointer hover:text-[#dee5ff]"
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-[#a70138]/20 border border-[#ff6e84]/30 rounded-lg text-[#ff6e84] text-sm">
                {error}
              </div>
            )}

            <button
              className="w-full bg-gradient-to-r from-[#b6a0ff] to-[#7e51ff] text-[#340090] font-bold py-4 rounded-lg shadow-lg hover:shadow-[#b6a0ff]/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#340090]"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-sm text-[#a3aac4]">
            Don&apos;t have an account?{' '}
            <Link className="text-[#b6a0ff] font-semibold hover:underline underline-offset-4 decoration-[#b6a0ff]/30" href="/signup">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
