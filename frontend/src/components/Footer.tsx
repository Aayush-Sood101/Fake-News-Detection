'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function Footer() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-bold text-white flex items-center gap-2">
              🔍 FakeNews Detector
            </Link>
            <p className="mt-4 text-gray-400 max-w-md">
              AI-powered fake news detection using advanced multimodal analysis. 
              Protect yourself from misinformation with our cutting-edge machine learning technology.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              {user ? (
                <>
                  <li>
                    <Link href="/predict" className="hover:text-white transition-colors">
                      Analyze Article
                    </Link>
                  </li>
                  <li>
                    <Link href="/history" className="hover:text-white transition-colors">
                      My History
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="hover:text-white transition-colors">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup" className="hover:text-white transition-colors">
                      Sign Up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span>📝</span> Text Analysis
              </li>
              <li className="flex items-center gap-2">
                <span>📷</span> Image Analysis
              </li>
              <li className="flex items-center gap-2">
                <span>🤖</span> AI-Powered
              </li>
              <li className="flex items-center gap-2">
                <span>📊</span> Confidence Scores
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {currentYear} FakeNews Detector. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>Built with Next.js & FastAPI</span>
              <span>•</span>
              <span>Multimodal ML</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
