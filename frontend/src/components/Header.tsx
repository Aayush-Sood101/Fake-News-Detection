'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="w-full top-0 sticky z-50 bg-[#060e20] shadow-[0_0_15px_rgba(124,77,255,0.08)]">
      <div className="flex justify-between items-center px-8 py-4 max-w-[1440px] mx-auto">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-[#dee5ff] uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Forensic Intelligence
        </Link>
        
        <div className="hidden md:flex items-center space-x-8 font-medium tracking-tight text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <Link className="text-[#00e3fd] border-b-2 border-[#00e3fd] pb-1" href="/">Analysis</Link>
          {user && (
            <>
              <Link className="text-[#dee5ff]/70 hover:text-[#dee5ff] transition-colors" href="/predict">Predict</Link>
              <Link className="text-[#dee5ff]/70 hover:text-[#dee5ff] transition-colors" href="/history">History</Link>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm text-[#dee5ff]/70 hidden md:block" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {user.name || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-5 py-2 text-sm font-semibold text-[#dee5ff]/70 hover:text-[#dee5ff] transition-all"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/login"
                className="px-5 py-2 text-sm font-semibold text-[#dee5ff]/70 hover:text-[#dee5ff] transition-all"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Sign In
              </Link>
              <Link 
                href="/signup"
                className="px-6 py-2 bg-[#b6a0ff] text-[#340090] font-bold text-sm rounded-md active:scale-95 duration-150 shadow-[0_0_15px_rgba(182,160,255,0.3)] hover:brightness-110 transition-all"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
