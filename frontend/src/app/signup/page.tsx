'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signup, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/\d/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password, name, 'user');
      router.push('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Signup failed. Please try again.');
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
    <div className="flex flex-col md:flex-row w-full flex-1 bg-[#060e20]">
      {/* Left Side: Interactive Branding & Content */}
      <div className="hidden md:flex md:w-[45%] lg:w-[55%] relative flex-col justify-between p-16 overflow-hidden bg-black">
        {/* Background Abstract */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full bg-[#b6a0ff]/10 blur-[120px]"></div>
          <div className="absolute bottom-[-5%] left-[-5%] w-[60%] h-[60%] rounded-full bg-[#00e3fd]/10 blur-[100px]"></div>
        </div>

        {/* Header Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#b6a0ff] to-[#7e51ff] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(182,160,255,0.3)]">
              <span className="material-symbols-outlined text-[#340090] text-2xl">security</span>
            </div>
            <span className="font-bold text-2xl tracking-tighter uppercase text-[#dee5ff]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Forensic Intelligence
            </span>
          </div>
        </div>

        {/* Center Content: Value Proposition */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-5xl lg:text-7xl font-bold leading-none tracking-tight mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b6a0ff] to-[#7e51ff]">Digital Sentry</span> for Veracity.
          </h1>
          <p className="text-[#a3aac4] text-lg leading-relaxed mb-12">
            Access our forensic-grade suite for deep-fake detection, source verification, and neural network narrative analysis.
          </p>

          {/* Bento Style Feature Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-xl bg-[#0f1930] border border-[#40485d]/10">
              <span className="material-symbols-outlined text-[#00e3fd] mb-4">psychology</span>
              <h3 className="font-semibold text-[#dee5ff] mb-2">Neural Analysis</h3>
              <p className="text-xs text-[#a3aac4]">Real-time LLM fingerprinting and narrative tracing.</p>
            </div>
            <div className="p-6 rounded-xl bg-[#0f1930] border border-[#40485d]/10">
              <span className="material-symbols-outlined text-[#b6a0ff] mb-4">layers</span>
              <h3 className="font-semibold text-[#dee5ff] mb-2">Cross-Reference</h3>
              <p className="text-xs text-[#a3aac4]">Instant validation against global forensic databases.</p>
            </div>
          </div>
        </div>

        {/* Footer Quote/Testimonial */}
        <div className="relative z-10">
          <div className="p-6 rounded-xl border border-[#40485d]/15 flex gap-4 items-start max-w-md" style={{ background: 'rgba(25, 37, 64, 0.6)', backdropFilter: 'blur(20px)' }}>
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBn3oJ58WFswB1b_xPD_CsG-rnIiVO18rn1HpXIoQbD5R0TZlMxpMXYVm3BiuDEx8wAPaaLAY4i7rqnaUqQI0IQPTKj9oHCIMChNzbhic9R64hFCy26l-elo7xdOZ43YO7-G_gPMokLjuN5VJPtHcM16mLFjG1iNitTGVs4xDQq6olgw_xwiDLesmZwFpt2qFXTY5wSYm_qnOnCCiPAuYfl2ntjmgeR08agmvjezRfO2p5L2qrLtGR5HqJMkrNyMGQMOFK2rraV0ko"
              alt="Data Scientist Portrait"
              width={48}
              height={48}
              className="rounded-full object-cover grayscale"
            />
            <div>
              <p className="text-sm italic text-[#dee5ff]/80">&quot;In an era of synthetic truth, Sentry One provides the precision required to protect institutional integrity.&quot;</p>
              <p className="text-xs font-bold mt-2 text-[#b6a0ff]">DR. ELIAS VANCE — CHIEF ANALYST</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Sign-Up Form */}
      <div className="w-full md:w-[55%] lg:w-[45%] bg-[#060e20] flex flex-col justify-center px-8 py-16 md:px-20 lg:px-32 relative">
        {/* Mobile Branding Only */}
        <div className="md:hidden flex items-center gap-2 mb-12">
          <span className="material-symbols-outlined text-[#b6a0ff] text-3xl">security</span>
          <span className="font-bold text-xl uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Forensic Intelligence</span>
        </div>

        <div className="max-w-md mx-auto w-full">
          <header className="mb-10">
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Create Account</h2>
            <p className="text-[#a3aac4]">Sign up to access the detection suite.</p>
          </header>

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#a3aac4] ml-1" htmlFor="fullname">
                Full Name
              </label>
              <input
                className="w-full bg-black border border-[#40485d]/15 rounded-md px-4 py-3 text-[#dee5ff] focus:ring-1 focus:ring-[#00e3fd] focus:border-[#00e3fd] placeholder:text-[#a3aac4]/30 outline-none transition-all duration-200"
                id="fullname"
                name="fullname"
                placeholder="John Doe"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#a3aac4] ml-1" htmlFor="email">
                Email Address
              </label>
              <input
                className="w-full bg-black border border-[#40485d]/15 rounded-md px-4 py-3 text-[#dee5ff] focus:ring-1 focus:ring-[#00e3fd] focus:border-[#00e3fd] placeholder:text-[#a3aac4]/30 outline-none transition-all duration-200"
                id="email"
                name="email"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#a3aac4] ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full bg-black border border-[#40485d]/15 rounded-md px-4 py-3 text-[#dee5ff] focus:ring-1 focus:ring-[#00e3fd] focus:border-[#00e3fd] placeholder:text-[#a3aac4]/30 outline-none transition-all duration-200"
                  id="password"
                  name="password"
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
                  className="material-symbols-outlined absolute right-4 top-3 text-[#a3aac4]/50 cursor-pointer hover:text-[#00e3fd] transition-colors"
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </button>
              </div>
              <p className="mt-1 text-xs text-[#a3aac4]/50 ml-1">
                Must be at least 8 characters with one number
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#a3aac4] ml-1" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                className="w-full bg-black border border-[#40485d]/15 rounded-md px-4 py-3 text-[#dee5ff] focus:ring-1 focus:ring-[#00e3fd] focus:border-[#00e3fd] placeholder:text-[#a3aac4]/30 outline-none transition-all duration-200"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••••••"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-[#a70138]/20 border border-[#ff6e84]/30 rounded-lg text-[#ff6e84] text-sm">
                {error}
              </div>
            )}

            <button
              className="w-full bg-gradient-to-r from-[#b6a0ff] to-[#7e51ff] py-4 rounded-md font-bold text-black uppercase tracking-widest text-sm hover:shadow-[0_0_15px_rgba(126,81,255,0.4)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </>
              )}
            </button>
          </form>

          <footer className="mt-12 text-center">
            <p className="text-sm text-[#a3aac4]">
              Already have an account?{' '}
              <Link className="text-[#b6a0ff] font-bold hover:text-[#a98fff] transition-colors" href="/login">
                Sign In
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
