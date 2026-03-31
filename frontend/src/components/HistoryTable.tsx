'use client';

import { format, formatDistanceToNow } from 'date-fns';

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

interface HistoryTableProps {
  predictions: Prediction[];
  onViewDetails?: (prediction: Prediction) => void;
}

export function HistoryTable({ predictions, onViewDetails }: HistoryTableProps) {
  if (predictions.length === 0) {
    return (
      <div className="rounded-xl border border-[#40485d]/30 p-12 text-center" style={{ background: 'rgba(25, 37, 64, 0.6)', backdropFilter: 'blur(20px)' }}>
        <div className="w-20 h-20 mx-auto rounded-xl bg-[#b6a0ff]/20 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-4xl text-[#b6a0ff]">inbox</span>
        </div>
        <h3 className="text-lg font-bold text-[#dee5ff]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>No Analysis Records</h3>
        <p className="text-[#a3aac4] mt-2 max-w-md mx-auto">Your forensic analysis history will appear here. Submit content for verification to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#40485d]/30 overflow-hidden" style={{ background: 'rgba(25, 37, 64, 0.6)', backdropFilter: 'blur(20px)' }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0f1930]/80 border-b border-[#40485d]/30">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-[#a3aac4] uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-[#a3aac4] uppercase tracking-wider">
                Verdict
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-[#a3aac4] uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-[#a3aac4] uppercase tracking-wider">
                Modality
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-[#a3aac4] uppercase tracking-wider">
                Feedback
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-[#a3aac4] uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-[#a3aac4] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#40485d]/20">
            {predictions.map((prediction) => {
              const isReal = prediction.label === 'REAL';
              return (
                <tr key={prediction.id} className="hover:bg-[#141f38]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate font-medium text-[#dee5ff]">
                      {prediction.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                      isReal
                        ? 'bg-[#00e3fd]/15 text-[#00e3fd] border border-[#00e3fd]/30' 
                        : 'bg-[#ff6e84]/15 text-[#ff6e84] border border-[#ff6e84]/30'
                    }`}>
                      <span className="material-symbols-outlined text-sm">{isReal ? 'verified' : 'warning'}</span>
                      {prediction.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#060e20] rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${isReal ? 'bg-gradient-to-r from-[#00e3fd] to-[#00d7f0]' : 'bg-gradient-to-r from-[#ff6e84] to-[#d73357]'}`}
                          style={{ width: `${prediction.confidence * 100}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold ${isReal ? 'text-[#00e3fd]' : 'text-[#ff6e84]'}`}>
                        {(prediction.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-[#a3aac4]">
                      <span className="material-symbols-outlined text-sm text-[#b6a0ff]">
                        {prediction.modality === 'multimodal' ? 'image' : 'description'}
                      </span>
                      {prediction.modality === 'multimodal' ? 'Multi' : 'Text'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {prediction.feedback ? (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        prediction.feedback === 'correct'
                          ? 'bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30'
                          : 'bg-[#ff6e84]/15 text-[#ff6e84] border border-[#ff6e84]/30'
                      }`}>
                        <span className="material-symbols-outlined text-sm">
                          {prediction.feedback === 'correct' ? 'thumb_up' : 'thumb_down'}
                        </span>
                        {prediction.feedback}
                      </span>
                    ) : (
                      <span className="text-[#6d758c] text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#a3aac4]" title={format(new Date(prediction.createdAt), 'PPpp')}>
                      {formatDistanceToNow(new Date(prediction.createdAt), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onViewDetails?.(prediction)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#b6a0ff] hover:text-[#dee5ff] hover:bg-[#b6a0ff]/10 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
