'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { predictApi } from '@/lib/api';
import { PredictionResult } from '@/components/PredictionResult';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface PredictionResponse {
  id: number;
  label: string;
  confidence: number;
  explanation: string;
  modality: string;
}

function PredictPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setFeedbackSubmitted(false);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('body', body);
      if (image) {
        formData.append('image', image);
      }

      const response = await predictApi.submit(formData);
      setResult(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      setError(error.response?.data?.error || error.response?.data?.message || 'Prediction failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (feedback: 'correct' | 'incorrect') => {
    if (!result) return;
    
    try {
      await predictApi.submitFeedback(result.id.toString(), feedback);
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    setFeedbackSubmitted(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#060e20]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-[#b6a0ff]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-[#b6a0ff]">search</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#dee5ff]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Forensic Analysis Terminal
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#00e3fd] animate-pulse"></span>
                <span className="text-xs text-[#00e3fd] font-semibold uppercase tracking-wider">Neural Engine Ready</span>
              </div>
            </div>
          </div>
          <p className="text-[#a3aac4]">
            Submit content for multi-modal authenticity verification. Our neural network analyzes text and visual patterns to detect potential fabrications.
          </p>
        </div>

        {/* Prediction Form */}
        <form onSubmit={handleSubmit} className="rounded-xl border border-[#40485d]/30 p-6 mb-8" style={{ background: 'rgba(25, 37, 64, 0.6)', backdropFilter: 'blur(20px)' }}>
          {/* Title Input */}
          <div className="mb-6">
            <label htmlFor="title" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a3aac4] mb-3">
              <span className="material-symbols-outlined text-sm text-[#b6a0ff]">title</span>
              Article Title <span className="text-[#ff6e84]">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter the article headline..."
              className="w-full px-4 py-3 bg-[#060e20] border border-[#40485d]/50 rounded-lg text-[#dee5ff] placeholder-[#6d758c] focus:ring-2 focus:ring-[#00e3fd]/50 focus:border-[#00e3fd] transition-all outline-none"
              disabled={isLoading}
            />
          </div>

          {/* Body Input */}
          <div className="mb-6">
            <label htmlFor="body" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a3aac4] mb-3">
              <span className="material-symbols-outlined text-sm text-[#b6a0ff]">description</span>
              Article Content <span className="text-[#6d758c]">(Optional)</span>
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste the article content here for more accurate analysis..."
              rows={6}
              className="w-full px-4 py-3 bg-[#060e20] border border-[#40485d]/50 rounded-lg text-[#dee5ff] placeholder-[#6d758c] focus:ring-2 focus:ring-[#00e3fd]/50 focus:border-[#00e3fd] transition-all outline-none resize-y"
              disabled={isLoading}
            />
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a3aac4] mb-3">
              <span className="material-symbols-outlined text-sm text-[#b6a0ff]">image</span>
              Visual Evidence <span className="text-[#6d758c]">(Optional)</span>
            </label>
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${imagePreview ? 'border-[#00e3fd]/50 bg-[#00e3fd]/5' : 'border-[#40485d]/50 hover:border-[#00e3fd]/30 bg-[#060e20]/50'}`}>
              {imagePreview ? (
                <div className="space-y-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-64 mx-auto rounded-lg border border-[#40485d]/30"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="inline-flex items-center gap-2 text-[#ff6e84] hover:text-[#ff6e84]/80 text-sm font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Remove Image
                  </button>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 mx-auto rounded-xl bg-[#b6a0ff]/10 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-3xl text-[#b6a0ff]">add_photo_alternate</span>
                  </div>
                  <p className="text-[#a3aac4] mb-3">Drag & drop an image or click to select</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#141f38] text-[#dee5ff] border border-[#40485d]/50 rounded-lg cursor-pointer hover:bg-[#1f2b49] transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">upload</span>
                    Choose File
                  </label>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-[#6d758c] flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">info</span>
              Adding an image enables multimodal analysis for enhanced detection accuracy
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-[#ff6e84]/10 border border-[#ff6e84]/30 rounded-lg">
              <div className="flex items-center gap-2 text-[#ff6e84]">
                <span className="material-symbols-outlined">error</span>
                <span className="font-medium">Error</span>
              </div>
              <p className="text-[#ff6e84]/80 mt-1">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-[#b6a0ff] to-[#7e51ff] text-white font-bold rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(182,160,255,0.3)]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Analyzing Neural Patterns...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">neurology</span>
                  Initiate Analysis
                </>
              )}
            </button>
            {result && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-4 bg-[#141f38] text-[#dee5ff] font-medium rounded-lg border border-[#40485d]/50 hover:bg-[#1f2b49] transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined">refresh</span>
                New Analysis
              </button>
            )}
          </div>
        </form>

        {/* Prediction Result */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#b6a0ff]">fact_check</span>
              <h2 className="text-xl font-bold text-[#dee5ff]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Analysis Result</h2>
            </div>
            <PredictionResult 
              result={result} 
              onFeedback={handleFeedback}
              feedbackSubmitted={feedbackSubmitted}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PredictPageWrapper() {
  return (
    <ProtectedRoute>
      <PredictPage />
    </ProtectedRoute>
  );
}
