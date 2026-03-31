'use client';

import { useState, useEffect, useCallback } from 'react';
import { historyApi, predictApi } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { StatsCards } from '@/components/StatsCards';
import { HistoryTable } from '@/components/HistoryTable';
import { format } from 'date-fns';

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
      setPredictions(prev => prev.map(p => 
        p.id === predictionId ? { ...p, feedback } : p
      ));
      const statsRes = await historyApi.getStats();
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  if (isLoading && !predictions.length) {
    return (
      <div className="min-h-screen bg-[#060e20] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00e3fd]"></div>
          <span className="text-[#a3aac4] text-sm">Loading analysis records...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060e20]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-[#00e3fd]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-[#00e3fd]">history</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#dee5ff]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Analysis Archive
              </h1>
              <p className="text-[#a3aac4] text-sm">Complete record of forensic verifications</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && <StatsCards stats={stats} />}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-[#ff6e84]/10 border border-[#ff6e84]/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#ff6e84]">
                <span className="material-symbols-outlined">error</span>
                <span>{error}</span>
              </div>
              <button 
                onClick={() => fetchData()} 
                className="text-[#00e3fd] hover:underline text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6 flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a3aac4]">
            <span className="material-symbols-outlined text-sm text-[#b6a0ff]">filter_list</span>
            Filter by:
          </label>
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-4 py-2 bg-[#0f1930] border border-[#40485d]/50 rounded-lg text-[#dee5ff] focus:ring-2 focus:ring-[#00e3fd]/50 focus:border-[#00e3fd] transition-all outline-none"
          >
            <option value="">All Analyses</option>
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
              className="px-4 py-2 bg-[#141f38] border border-[#40485d]/50 rounded-lg text-[#dee5ff] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1f2b49] transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
              Previous
            </button>
            <span className="px-4 py-2 text-[#a3aac4]">
              Page <span className="text-[#00e3fd] font-semibold">{pagination.page}</span> of <span className="text-[#00e3fd] font-semibold">{pagination.pages}</span>
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-4 py-2 bg-[#141f38] border border-[#40485d]/50 rounded-lg text-[#dee5ff] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1f2b49] transition-colors flex items-center gap-1"
            >
              Next
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}

        {/* Detail Modal */}
        {selectedPrediction && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#40485d]/30" style={{ background: 'rgba(15, 25, 48, 0.95)', backdropFilter: 'blur(20px)' }}>
              {/* Modal Header */}
              <div className={`px-6 py-5 ${selectedPrediction.label === 'REAL' ? 'bg-gradient-to-r from-[#00e3fd]/20 to-[#006875]/20 border-b border-[#00e3fd]/30' : 'bg-gradient-to-r from-[#ff6e84]/20 to-[#a70138]/20 border-b border-[#ff6e84]/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedPrediction.label === 'REAL' ? 'bg-[#00e3fd]/20' : 'bg-[#ff6e84]/20'}`}>
                      <span className={`material-symbols-outlined text-xl ${selectedPrediction.label === 'REAL' ? 'text-[#00e3fd]' : 'text-[#ff6e84]'}`}>
                        {selectedPrediction.label === 'REAL' ? 'verified' : 'warning'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#dee5ff]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {selectedPrediction.label === 'REAL' ? 'Verified Authentic' : 'Potential Fabrication'}
                      </h3>
                      <p className="text-xs text-[#a3aac4]">Case File #{selectedPrediction.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPrediction(null)}
                    className="w-8 h-8 rounded-lg bg-[#060e20]/50 text-[#a3aac4] hover:text-[#dee5ff] hover:bg-[#060e20] transition-colors flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a3aac4] mb-2">
                    <span className="material-symbols-outlined text-sm text-[#b6a0ff]">title</span>
                    Content Title
                  </h4>
                  <p className="text-lg font-medium text-[#dee5ff]">{selectedPrediction.title}</p>
                </div>

                {/* Body */}
                {selectedPrediction.body && (
                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a3aac4] mb-2">
                      <span className="material-symbols-outlined text-sm text-[#b6a0ff]">description</span>
                      Content Body
                    </h4>
                    <p className="text-[#a3aac4] whitespace-pre-wrap bg-[#060e20]/50 p-4 rounded-lg border border-[#40485d]/20">{selectedPrediction.body}</p>
                  </div>
                )}

                {/* Confidence */}
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a3aac4] mb-2">
                    <span className="material-symbols-outlined text-sm text-[#b6a0ff]">speed</span>
                    Confidence Index
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2.5 bg-[#060e20] rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${selectedPrediction.label === 'REAL' ? 'bg-gradient-to-r from-[#00e3fd] to-[#00d7f0]' : 'bg-gradient-to-r from-[#ff6e84] to-[#d73357]'}`}
                        style={{ width: `${selectedPrediction.confidence * 100}%` }}
                      />
                    </div>
                    <span className={`text-xl font-bold ${selectedPrediction.label === 'REAL' ? 'text-[#00e3fd]' : 'text-[#ff6e84]'}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {(selectedPrediction.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a3aac4] mb-2">
                    <span className="material-symbols-outlined text-sm text-[#b6a0ff]">psychology</span>
                    Neural Analysis
                  </h4>
                  <p className="text-[#a3aac4] leading-relaxed">{selectedPrediction.explanation}</p>
                </div>

                {/* Modality & Timestamp */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a3aac4] mb-2">
                      <span className="material-symbols-outlined text-sm text-[#b6a0ff]">science</span>
                      Analysis Type
                    </h4>
                    <div className="flex items-center gap-2 text-[#dee5ff]">
                      <span className="material-symbols-outlined text-sm">
                        {selectedPrediction.modality === 'multimodal' ? 'image' : 'description'}
                      </span>
                      {selectedPrediction.modality === 'multimodal' ? 'Multimodal (Text + Image)' : 'Text Only'}
                    </div>
                  </div>
                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a3aac4] mb-2">
                      <span className="material-symbols-outlined text-sm text-[#b6a0ff]">schedule</span>
                      Timestamp
                    </h4>
                    <p className="text-[#dee5ff]">{format(new Date(selectedPrediction.createdAt), 'PPpp')}</p>
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a3aac4] mb-3">
                    <span className="material-symbols-outlined text-sm text-[#b6a0ff]">rate_review</span>
                    Feedback Protocol
                  </h4>
                  {selectedPrediction.feedback ? (
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                      selectedPrediction.feedback === 'correct'
                        ? 'bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30'
                        : 'bg-[#ff6e84]/15 text-[#ff6e84] border border-[#ff6e84]/30'
                    }`}>
                      <span className="material-symbols-outlined text-sm">
                        {selectedPrediction.feedback === 'correct' ? 'thumb_up' : 'thumb_down'}
                      </span>
                      Marked as {selectedPrediction.feedback === 'correct' ? 'Accurate' : 'Inaccurate'}
                    </span>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          handleFeedback(selectedPrediction.id, 'correct');
                          setSelectedPrediction({ ...selectedPrediction, feedback: 'correct' });
                        }}
                        className="flex-1 px-4 py-3 bg-[#00e3fd]/10 border border-[#00e3fd]/30 text-[#00e3fd] rounded-lg hover:bg-[#00e3fd]/20 transition-all flex items-center justify-center gap-2 font-medium"
                      >
                        <span className="material-symbols-outlined">thumb_up</span>
                        Accurate
                      </button>
                      <button
                        onClick={() => {
                          handleFeedback(selectedPrediction.id, 'incorrect');
                          setSelectedPrediction({ ...selectedPrediction, feedback: 'incorrect' });
                        }}
                        className="flex-1 px-4 py-3 bg-[#ff6e84]/10 border border-[#ff6e84]/30 text-[#ff6e84] rounded-lg hover:bg-[#ff6e84]/20 transition-all flex items-center justify-center gap-2 font-medium"
                      >
                        <span className="material-symbols-outlined">thumb_down</span>
                        Inaccurate
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-[#060e20]/50 border-t border-[#40485d]/20 flex justify-end">
                <button
                  onClick={() => setSelectedPrediction(null)}
                  className="px-5 py-2 bg-[#141f38] text-[#dee5ff] rounded-lg border border-[#40485d]/50 hover:bg-[#1f2b49] transition-colors font-medium"
                >
                  Close Case File
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
