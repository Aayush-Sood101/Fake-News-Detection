'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Detect Fake News with
              <span className="block text-yellow-300">AI-Powered Analysis</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10">
              Our advanced multimodal machine learning system analyzes both text and images 
              to help you identify misinformation and protect yourself from fake news.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link 
                    href="/predict"
                    className="px-8 py-4 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors text-lg shadow-lg"
                  >
                    🔍 Analyze an Article
                  </Link>
                  <Link 
                    href="/history"
                    className="px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors text-lg border border-white/30"
                  >
                    📊 View History
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/signup"
                    className="px-8 py-4 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors text-lg shadow-lg"
                  >
                    Get Started Free
                  </Link>
                  <Link 
                    href="/login"
                    className="px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors text-lg border border-white/30"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our system uses state-of-the-art machine learning to analyze news articles
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Submit Article</h3>
              <p className="text-gray-600">
                Paste the article title, content, and optionally upload an image for comprehensive analysis.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Analysis</h3>
              <p className="text-gray-600">
                Our multimodal ML model analyzes text patterns and image authenticity using deep learning.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Results</h3>
              <p className="text-gray-600">
                Receive a confidence score and detailed explanation of why the article may be real or fake.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2">95%</div>
              <div className="text-gray-400">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2">50K+</div>
              <div className="text-gray-400">Articles Analyzed</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2">2</div>
              <div className="text-gray-400">Analysis Modes</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2">&lt;3s</div>
              <div className="text-gray-400">Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Detail Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Multimodal Analysis
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our system doesn&apos;t just look at text. It combines multiple sources of information 
                to make more accurate predictions.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <div>
                    <strong className="text-gray-900">Text Analysis</strong>
                    <p className="text-gray-600">Analyzes writing patterns, sentiment, and linguistic features</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <div>
                    <strong className="text-gray-900">Image Analysis</strong>
                    <p className="text-gray-600">Detects manipulated images and visual inconsistencies</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <div>
                    <strong className="text-gray-900">Combined Intelligence</strong>
                    <p className="text-gray-600">Fuses both modalities for higher accuracy predictions</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📷</div>
                  <div className="flex-1">
                    <div className="h-3 bg-blue-200 rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-blue-500"></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Image Analysis: 80%</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">📝</div>
                  <div className="flex-1">
                    <div className="h-3 bg-green-200 rounded-full overflow-hidden">
                      <div className="w-[90%] h-full bg-green-500"></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Text Analysis: 90%</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">🎯</div>
                  <div className="flex-1">
                    <div className="h-3 bg-yellow-200 rounded-full overflow-hidden">
                      <div className="w-[95%] h-full bg-yellow-500"></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Combined Score: 95%</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 font-semibold">
                    <span>⚠️</span> Likely Fake News Detected
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Fight Misinformation?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of users who use our tool to verify news articles every day.
          </p>
          {user ? (
            <Link 
              href="/predict"
              className="inline-block px-10 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg shadow-lg"
            >
              Start Analyzing Now →
            </Link>
          ) : (
            <Link 
              href="/signup"
              className="inline-block px-10 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg shadow-lg"
            >
              Create Free Account →
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
