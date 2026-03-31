'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[921px] flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAluzKub2JPwcq6foOtwTIa-_smLc6l2C_QCjzK-_Yl9Jt2Y7uaYMPGCujrxQtczdsE4X5BqpEU9SWTMsZ7PsBu2D8KVRk5e-VDvGgLRzZXq1ZV_czUYPrfTMPdnSg4cB-wZlTDcEfftnWWGRsBxr5tC_rGBjcf5zx6NQ6hscovUa-mA-SR19QPWtl8xPdTHH7LTebDhJp5QQBRs0TIXC2etVVElNVdLtIJkgDVOiLuW4NvFdyqZXZVdeeI5E7Whb__7lHUd7UOl0I"
            alt="Neural Network Visualization"
            fill
            className="object-cover opacity-30 grayscale brightness-50"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060e20] via-transparent to-[#060e20]/80"></div>
        </div>
        
        <div className="relative z-10 max-w-[1440px] mx-auto px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center space-x-3 px-3 py-1 rounded-full bg-[#00e3fd]/10 border border-[#00e3fd]/20 text-[#00e3fd] text-xs font-semibold tracking-widest uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e3fd] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e3fd]"></span>
              </span>
              <span>Multi-Modal Engine Active</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight text-[#dee5ff]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Uncover the Truth with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b6a0ff] to-[#7e51ff]">Multimodal AI</span>
            </h1>
            
            <p className="text-lg md:text-xl text-[#a3aac4] max-w-2xl leading-relaxed font-light">
              The world&apos;s most advanced forensic intelligence platform for detecting synthetic media and coordinated disinformation across text, imagery, and video metadata.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              {user ? (
                <>
                  <Link
                    href="/predict"
                    className="px-8 py-4 bg-gradient-to-r from-[#b6a0ff] to-[#7e51ff] text-[#340090] font-extrabold rounded-md shadow-[0_0_25px_rgba(126,81,255,0.4)] hover:brightness-110 transition-all active:scale-95"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Analyze Article
                  </Link>
                  <Link
                    href="/history"
                    className="px-8 py-4 bg-transparent border border-[#40485d]/30 text-[#00e3fd] font-bold rounded-md hover:bg-[#192540]/40 transition-all active:scale-95"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    View History
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="px-8 py-4 bg-gradient-to-r from-[#b6a0ff] to-[#7e51ff] text-[#340090] font-extrabold rounded-md shadow-[0_0_25px_rgba(126,81,255,0.4)] hover:brightness-110 transition-all active:scale-95"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/login"
                    className="px-8 py-4 bg-transparent border border-[#40485d]/30 text-[#00e3fd] font-bold rounded-md hover:bg-[#192540]/40 transition-all active:scale-95"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    View Demo
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-5 hidden lg:block">
            <div className="glass-panel p-1 rounded-xl border border-[#40485d]/20 shadow-2xl" style={{ background: 'rgba(25, 37, 64, 0.6)', backdropFilter: 'blur(20px)' }}>
              <div className="bg-[#0f1930] rounded-lg p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-[#40485d]/10 pb-4">
                  <span className="text-sm font-semibold tracking-wider text-[#a3aac4] uppercase">Investigation Log #882</span>
                  <span className="material-symbols-outlined text-[#00e3fd]">security</span>
                </div>
                <div className="space-y-4">
                  <div className="h-2 bg-[#192540] rounded-full w-3/4"></div>
                  <div className="h-2 bg-[#192540] rounded-full w-full"></div>
                  <div className="h-2 bg-[#192540] rounded-full w-1/2"></div>
                </div>
                <div className="pt-4">
                  <div className="text-xs text-[#a3aac4] mb-2">AI CONFIDENCE INDEX</div>
                  <div className="w-full h-3 bg-[#1f2b49] rounded-full overflow-hidden relative">
                    <div className="absolute inset-y-0 left-0 w-[92%]" style={{ background: 'linear-gradient(to right, #00e3fd, #ff6e84)' }}></div>
                    <div className="absolute top-0 right-[8%] h-full w-1 bg-[#dee5ff] shadow-[0_0_8px_white]"></div>
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-[#a3aac4] uppercase tracking-tighter">
                    <span>Verified</span>
                    <span className="text-[#ff6e84]">Fabricated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-[#091328]">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-[#00e3fd]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>99.8%</div>
              <div className="text-xs uppercase tracking-widest text-[#a3aac4] font-semibold">Detection Accuracy</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-[#b6a0ff]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>12ms</div>
              <div className="text-xs uppercase tracking-widest text-[#a3aac4] font-semibold">Analysis Speed</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-[#00e3fd]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>1.2B</div>
              <div className="text-xs uppercase tracking-widest text-[#a3aac4] font-semibold">Sources Indexed</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-[#b6a0ff]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>24/7</div>
              <div className="text-xs uppercase tracking-widest text-[#a3aac4] font-semibold">Neural Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-32 bg-[#060e20]">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="mb-16 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Advanced Forensic Modules</h2>
            <p className="text-[#a3aac4] max-w-xl">Our multi-modal approach analyzes the nexus between linguistic patterns and visual artifacts to identify sophisticated deepfakes.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Text Analysis */}
            <div className="md:col-span-8 group relative overflow-hidden bg-[#141f38] rounded-xl p-8 hover:bg-[#1f2b49] transition-all duration-300">
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-[#b6a0ff]/20 text-[#b6a0ff]">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'opsz' 32" }}>description</span>
                  </div>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Linguistic Forensics</h3>
                  <p className="text-[#a3aac4] max-w-md leading-relaxed">
                    Analyze semantic inconsistencies, stylistic markers, and sentiment manipulation tactics across 120+ languages using our proprietary LLM core.
                  </p>
                </div>
                <div className="mt-8 flex items-center text-[#b6a0ff] font-semibold text-sm cursor-pointer group-hover:translate-x-2 transition-transform">
                  Explore Semantic Analysis <span className="material-symbols-outlined ml-2">arrow_forward</span>
                </div>
              </div>
              <div className="absolute bottom-[-20%] right-[-5%] opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-[240px]">code</span>
              </div>
            </div>
            
            {/* Image Analysis */}
            <div className="md:col-span-4 bg-[#141f38] rounded-xl p-8 border border-[#40485d]/10 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-[#00e3fd]/20 text-[#00e3fd]">
                  <span className="material-symbols-outlined">image_search</span>
                </div>
                <h3 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Visual Integrity</h3>
                <p className="text-[#a3aac4] leading-relaxed">
                  Pixel-level scrutiny for ELA (Error Level Analysis) and GAN-generated artifacts.
                </p>
              </div>
              <div className="mt-6 rounded-lg overflow-hidden h-32 relative">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCX9OEe8YQAWmHuqlUg5iGNWZjVzSbro9aELLIPkyHxcV0nolHdR3S5mpiwbz909iC5pFR38Vct0IH7eALQHLQHmgY22rR9r3MrtRav1daRlI6hx8UMmh_NeDCKCeAAtKhqXYglKhGESouI5DXR3kwe3xEniF7mkIBjQkL0LQZbrduw6r_Cem7yxXakBC-HKsSuRWOvcNHxBIU-Z1QFdwb4WMMbPpFuFc4rwFJhsuQkrUcisDQbxaLOTDAkhxQ_oL0IDsSyronIQVA"
                  alt="Digital Grid Analysis"
                  fill
                  className="object-cover grayscale opacity-40"
                />
                <div className="absolute inset-0 bg-[#00e3fd]/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold tracking-widest text-[#00e3fd] uppercase bg-[#0f1930] px-2 py-1 rounded">Scanning...</span>
                </div>
              </div>
            </div>
            
            {/* Data Fusion */}
            <div className="md:col-span-4 bg-[#141f38] rounded-xl p-8 border border-[#40485d]/10">
              <div className="space-y-4">
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-[#ff96bb]/20 text-[#ff96bb]">
                  <span className="material-symbols-outlined">hub</span>
                </div>
                <h3 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Cross-Modal Fusion</h3>
                <p className="text-[#a3aac4] leading-relaxed">
                  Our unique engine correlates text claims with visual evidence to find contradictions.
                </p>
              </div>
            </div>
            
            {/* Real-time Monitoring */}
            <div className="md:col-span-8 bg-[#141f38] rounded-xl p-8 border border-[#40485d]/10 overflow-hidden relative">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 space-y-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-[#00e3fd]/20 text-[#00e3fd]">
                    <span className="material-symbols-outlined">sensors</span>
                  </div>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Global Intelligence Feed</h3>
                  <p className="text-[#a3aac4] leading-relaxed">
                    Live ingestion from social platforms and news wires, providing a heat-map of emerging disinformation campaigns before they go viral.
                  </p>
                </div>
                <div className="flex-1 w-full h-40 bg-[#000000] rounded-lg border border-[#40485d]/5 p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#ff6e84] animate-pulse"></div>
                    <div className="h-2 w-full bg-[#192540] rounded"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#00e3fd]"></div>
                    <div className="h-2 w-2/3 bg-[#192540] rounded"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#b6a0ff]"></div>
                    <div className="h-2 w-3/4 bg-[#192540] rounded"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#00e3fd]"></div>
                    <div className="h-2 w-1/2 bg-[#192540] rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#b6a0ff] to-[#7e51ff] rounded-2xl p-12 md:p-20 text-center space-y-8">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuVnijGA6N5Usths_mF63i5agRToaVU67S8izxYrkY969MqsRXzmvNKj-Z-IgrnIMenGhoFUoJK71Uq6Clx-KAJAB0blUp3xLyl19O-xwftpko9NTHIrag3U7uew51JRNtYyRotcUS4le25eOen8D3-F6P3Pn56cctNmSQ19TZ-ZUz3vjVsBUZysLStJ0T8lAfqBfCu_yhm-DEsM61ifF05aqUYDM6G-AAigiX1PACNq-qO-LgAXTCN-IR2Rsu7XTqsQTTJtw7qqo"
                alt="Server Pattern"
                fill
                className="object-cover"
              />
            </div>
            
            <h2 className="text-4xl md:text-6xl font-extrabold text-[#340090] tracking-tighter relative z-10" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Ready to Secure the Truth?
            </h2>
            
            <p className="text-[#340090]/80 text-lg md:text-xl max-w-2xl mx-auto relative z-10 font-medium">
              Join elite investigative units and global intelligence agencies using Sentry One for high-fidelity news authentication.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 relative z-10">
              {user ? (
                <>
                  <Link
                    href="/predict"
                    className="w-full sm:w-auto px-10 py-5 bg-[#340090] text-[#b6a0ff] font-extrabold rounded-md shadow-2xl hover:scale-105 transition-transform"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Start Analyzing Now
                  </Link>
                  <Link
                    href="/history"
                    className="w-full sm:w-auto px-10 py-5 bg-transparent border-2 border-[#340090]/30 text-[#340090] font-bold rounded-md hover:bg-[#340090]/10 transition-all"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    View History
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="w-full sm:w-auto px-10 py-5 bg-[#340090] text-[#b6a0ff] font-extrabold rounded-md shadow-2xl hover:scale-105 transition-transform"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Request Access
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-10 py-5 bg-transparent border-2 border-[#340090]/30 text-[#340090] font-bold rounded-md hover:bg-[#340090]/10 transition-all"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
