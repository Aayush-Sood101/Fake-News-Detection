'use client';

import { useState, useEffect, useCallback } from 'react';
import { historyApi, predictApi } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { StatsCards } from '@/components/StatsCards';
import { HistoryTable } from '@/components/HistoryTable';

interface Prediction {
  id: number;
  title: string;
  body?: string;
  label: string;
  confidence: number;
  explanation: string;
  modality: string;
  feedback: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  avgConfidence: number;
  breakdown: {
    fake: number;
    real: number;
  };
  modality: {
    multimodal: number;
    textOnly: number;
  };
  feedback: {
    correct: number;
    incorrect: number;
    pending: number;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function HistoryContent() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);

  const fetchData = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params: { page: number; limit: number; label?: string } = { page, limit: 10 };
      if (filter) {
        params.label = filter;
      }

      const [historyRes, statsRes] = await Promise.all([
        historyApi.list(params),
        historyApi.getStats()
      ]);

      setPredictions(historyRes.data.predictions);
      setPagination(historyRes.data.pagination);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError('Failed to load history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (newPage: number) => {
    fetchData(newPage);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };

  const handleFeedback = async (predictionId: number, feedback: 'correct' | 'incorrect') => {
    try {
      await predictApi.submitFeedback(predictionId.toString(), feedback);
      // Update local state
      setPredictions(prev => prev.map(p => 
        p.id === predictionId ? { ...p, feedback } : p
      ));
      // Refresh stats
      const statsRes = await historyApi.getStats();
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  if (isLoading && !predictions.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Prediction History</h1>
        <p className="mt-2 text-gray-600">View your past predictions and statistics</p>
      </div>

      {/* Stats Cards */}
      {stats && <StatsCards stats={stats} />}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button 
            onClick={() => fetchData()} 
            className="ml-4 text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Filter by:</label>
        <select
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Predictions</option>
          <option value="FAKE">Fake Only</option>
          <option value="REAL">Real Only</option>
        </select>
      </div>

      {/* History Table */}
      <HistoryTable 
        predictions={predictions} 
        onViewDetails={setSelectedPrediction}
      />

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className={`px-6 py-4 ${selectedPrediction.label === 'REAL' ? 'bg-green-500' : 'bg-red-500'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {selectedPrediction.label === 'REAL' ? '✅ Likely Real' : '⚠️ Likely Fake'}
                </h3>
                <button
                  onClick={() => setSelectedPrediction(null)}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Title */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-1">Title</h4>
                <p className="text-lg font-medium text-gray-900">{selectedPrediction.title}</p>
              </div>

              {/* Body */}
              {selectedPrediction.body && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-1">Content</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedPrediction.body}</p>
                </div>
              )}

              {/* Confidence */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-1">Confidence</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${selectedPrediction.label === 'REAL' ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${selectedPrediction.confidence * 100}%` }}
                    />
                  </div>
                  <span className="font-medium">{(selectedPrediction.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Explanation */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-1">Analysis Explanation</h4>
                <p className="text-gray-700">{selectedPrediction.explanation}</p>
              </div>

              {/* Modality */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-1">Analysis Type</h4>
                <p className="text-gray-700">
                  {selectedPrediction.modality === 'multimodal' ? '📷 Multimodal (Text + Image)' : '📝 Text Only'}
                </p>
              </div>

              {/* Feedback */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Your Feedback</h4>
                {selectedPrediction.feedback ? (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    selectedPrediction.feedback === 'correct'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedPrediction.feedback === 'correct' ? '👍 Marked as Correct' : '👎 Marked as Incorrect'}
                  </span>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        handleFeedback(selectedPrediction.id, 'correct');
                        setSelectedPrediction({ ...selectedPrediction, feedback: 'correct' });
                      }}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    >
                      👍 Correct
                    </button>
                    <button
                      onClick={() => {
                        handleFeedback(selectedPrediction.id, 'incorrect');
                        setSelectedPrediction({ ...selectedPrediction, feedback: 'incorrect' });
                      }}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      👎 Incorrect
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <button
                onClick={() => setSelectedPrediction(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}
