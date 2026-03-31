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
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Predictions</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="text-4xl">📊</div>
        </div>
      </div>

      {/* Avg Confidence */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Avg Confidence</p>
            <p className="text-3xl font-bold text-blue-600">{avgConfidencePercent}%</p>
          </div>
          <div className="text-4xl">🎯</div>
        </div>
      </div>

      {/* Fake vs Real Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <p className="text-sm text-gray-500 mb-2">Classification Breakdown</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-sm">Fake: <strong>{stats.breakdown.fake}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-sm">Real: <strong>{stats.breakdown.real}</strong></span>
          </div>
        </div>
        {/* Visual bar */}
        {stats.total > 0 && (
          <div className="mt-3 h-2 rounded-full overflow-hidden bg-gray-200 flex">
            <div 
              className="bg-red-500 h-full"
              style={{ width: `${(stats.breakdown.fake / stats.total) * 100}%` }}
            />
            <div 
              className="bg-green-500 h-full"
              style={{ width: `${(stats.breakdown.real / stats.total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* User Feedback Accuracy */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Feedback Accuracy</p>
            <p className="text-3xl font-bold text-green-600">
              {accuracyRate}{typeof accuracyRate === 'string' ? '' : '%'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {stats.feedback.correct} correct / {stats.feedback.incorrect} incorrect
            </p>
          </div>
          <div className="text-4xl">✅</div>
        </div>
      </div>
    </div>
  );
}
