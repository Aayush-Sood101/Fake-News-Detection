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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analyze Article</h1>
        <p className="mt-2 text-gray-600">
          Submit an article title, content, and optionally an image to detect if it might be fake news.
        </p>
      </div>

      {/* Prediction Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
        {/* Title Input */}
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Article Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter the article headline..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            disabled={isLoading}
          />
        </div>

        {/* Body Input */}
        <div className="mb-6">
          <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
            Article Content (Optional)
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Paste the article content here for more accurate analysis..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
            disabled={isLoading}
          />
        </div>

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Article Image (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            {imagePreview ? (
              <div className="space-y-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-64 mx-auto rounded-lg shadow"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">📷</div>
                <p className="text-gray-600 mb-2">Drag & drop an image or click to select</p>
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
                  className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-md cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  Choose File
                </label>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Adding an image enables multimodal analysis for better accuracy
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading || !title.trim()}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Analyzing...
              </>
            ) : (
              <>
                🔍 Analyze Article
              </>
            )}
          </button>
          {result && (
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              New Analysis
            </button>
          )}
        </div>
      </form>

      {/* Prediction Result */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Result</h2>
          <PredictionResult 
            result={result} 
            onFeedback={handleFeedback}
            feedbackSubmitted={feedbackSubmitted}
          />
        </div>
      )}
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
