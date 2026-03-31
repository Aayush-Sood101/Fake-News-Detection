'use client';

interface StatsCardProps {
  stats: {
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
  };
}

export function StatsCards({ stats }: StatsCardProps) {
  const avgConfidencePercent = (stats.avgConfidence * 100).toFixed(1);
  const accuracyRate = stats.feedback.correct + stats.feedback.incorrect > 0
    ? ((stats.feedback.correct / (stats.feedback.correct + stats.feedback.incorrect)) * 100).toFixed(1)
    : 'N/A';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Predictions */}
      <div className="rounded-xl border border-[#40485d]/30 p-5" style={{ background: 'rgba(25, 37, 64, 0.6)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#a3aac4] mb-1">Total Analyses</p>
            <p className="text-3xl font-bold text-[#dee5ff]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stats.total}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#b6a0ff]/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-[#b6a0ff]">analytics</span>
          </div>
        </div>
      </div>

      {/* Avg Confidence */}
      <div className="rounded-xl border border-[#40485d]/30 p-5" style={{ background: 'rgba(25, 37, 64, 0.6)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#a3aac4] mb-1">Avg Confidence</p>
            <p className="text-3xl font-bold text-[#00e3fd]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{avgConfidencePercent}%</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#00e3fd]/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-[#00e3fd]">target</span>
          </div>
        </div>
        {/* Mini confidence bar */}
        <div className="mt-3 h-1.5 bg-[#060e20] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#00e3fd] to-[#00d7f0]"
            style={{ width: `${stats.avgConfidence * 100}%` }}
          />
        </div>
      </div>

      {/* Fake vs Real Breakdown */}
      <div className="rounded-xl border border-[#40485d]/30 p-5" style={{ background: 'rgba(25, 37, 64, 0.6)', backdropFilter: 'blur(20px)' }}>
        <p className="text-xs font-bold uppercase tracking-wider text-[#a3aac4] mb-3">Classification Breakdown</p>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff6e84]"></span>
            <span className="text-sm text-[#a3aac4]">Fake: <strong className="text-[#ff6e84]">{stats.breakdown.fake}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e3fd]"></span>
            <span className="text-sm text-[#a3aac4]">Real: <strong className="text-[#00e3fd]">{stats.breakdown.real}</strong></span>
          </div>
        </div>
        {/* Visual bar */}
        {stats.total > 0 && (
          <div className="h-2 rounded-full overflow-hidden bg-[#060e20] flex">
            <div 
              className="bg-gradient-to-r from-[#ff6e84] to-[#d73357] h-full transition-all duration-500"
              style={{ width: `${(stats.breakdown.fake / stats.total) * 100}%` }}
            />
            <div 
              className="bg-gradient-to-r from-[#00e3fd] to-[#00d7f0] h-full transition-all duration-500"
              style={{ width: `${(stats.breakdown.real / stats.total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* User Feedback Accuracy */}
      <div className="rounded-xl border border-[#40485d]/30 p-5" style={{ background: 'rgba(25, 37, 64, 0.6)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#a3aac4] mb-1">Feedback Accuracy</p>
            <p className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: accuracyRate === 'N/A' ? '#a3aac4' : '#4ade80' }}>
              {accuracyRate}{typeof accuracyRate === 'string' ? '' : '%'}
            </p>
            <p className="text-xs text-[#6d758c] mt-1">
              {stats.feedback.correct} correct / {stats.feedback.incorrect} incorrect
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#4ade80]/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-[#4ade80]">verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
