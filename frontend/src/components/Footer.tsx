'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function Footer() {
  const { user } = useAuth();

  return (
    <footer className="w-full py-12 border-t border-[#40485d]/10 bg-[#060e20]">
      <div className="bg-[#0f1930] py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-12 max-w-[1440px] mx-auto">
          <div className="space-y-6">
            <div className="font-bold text-2xl text-[#dee5ff]/80" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Forensic Intelligence
            </div>
            <p className="text-[#a3aac4] text-sm max-w-sm leading-relaxed">
              Setting the global standard for multi-modal verification and synthetic media detection since 2024.
            </p>
            <div className="flex space-x-4">
              <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#192540] hover:text-[#00e3fd] transition-colors cursor-pointer">
                <span className="material-symbols-outlined">terminal</span>
              </span>
              <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#192540] hover:text-[#00e3fd] transition-colors cursor-pointer">
                <span className="material-symbols-outlined">lan</span>
              </span>
              <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#192540] hover:text-[#00e3fd] transition-colors cursor-pointer">
                <span className="material-symbols-outlined">data_object</span>
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-widest text-[#dee5ff]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Platform
              </h4>
              <ul className="space-y-2 text-xs text-[#dee5ff]/40">
                {user ? (
                  <>
                    <li>
                      <Link className="hover:text-[#dee5ff] transition-colors underline-offset-4 hover:underline" href="/predict">
                        Analyze Article
                      </Link>
                    </li>
                    <li>
                      <Link className="hover:text-[#dee5ff] transition-colors underline-offset-4 hover:underline" href="/history">
                        My History
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link className="hover:text-[#dee5ff] transition-colors underline-offset-4 hover:underline" href="/login">
                        Sign In
                      </Link>
                    </li>
                    <li>
                      <Link className="hover:text-[#dee5ff] transition-colors underline-offset-4 hover:underline" href="/signup">
                        Sign Up
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <Link className="hover:text-[#dee5ff] transition-colors underline-offset-4 hover:underline" href="/">
                    Home
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-widest text-[#dee5ff]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Features
              </h4>
              <ul className="space-y-2 text-xs text-[#dee5ff]/40">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">description</span> Text Analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">image_search</span> Image Analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">hub</span> Cross-Modal Fusion
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center text-[10px] text-[#dee5ff]/20 px-12 max-w-[1440px] mx-auto border-t border-[#40485d]/10 pt-8">
          © 2024 Digital Sentry Forensic Labs. All Rights Reserved. Verified Secure Node.
        </div>
      </div>
    </footer>
  );
}
