'use client';

interface PredictionResultProps {
  result: {
    id: number;
    label: string;
    confidence: number;
    explanation: string;
    modality: string;
  };
  onFeedback?: (feedback: 'correct' | 'incorrect') => void;
  feedbackSubmitted?: boolean;
}

export function PredictionResult({ result, onFeedback, feedbackSubmitted }: PredictionResultProps) {
  const isReal = result.label === 'REAL';
  const confidencePercent = (result.confidence * 100).toFixed(1);
  
  return (
    <div className="rounded-xl border border-[#40485d]/20 overflow-hidden" style={{ background: 'rgba(25, 37, 64, 0.6)', backdropFilter: 'blur(20px)' }}>
      {/* Header with label */}
      <div className={`px-6 py-5 ${isReal ? 'bg-gradient-to-r from-[#00e3fd]/20 to-[#006875]/20 border-b border-[#00e3fd]/30' : 'bg-gradient-to-r from-[#ff6e84]/20 to-[#a70138]/20 border-b border-[#ff6e84]/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isReal ? 'bg-[#00e3fd]/20' : 'bg-[#ff6e84]/20'}`}>
              <span className={`material-symbols-outlined text-3xl ${isReal ? 'text-[#00e3fd]' : 'text-[#ff6e84]'}`}>
                {isReal ? 'verified' : 'warning'}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#dee5ff]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {isReal ? 'Verified Authentic' : 'Potential Fabrication'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`material-symbols-outlined text-sm ${isReal ? 'text-[#00e3fd]' : 'text-[#ff6e84]'}`}>
                  {result.modality === 'multimodal' ? 'image' : 'description'}
                </span>
                <p className="text-[#a3aac4] text-sm">
                  {result.modality === 'multimodal' ? 'Multimodal Analysis (Text + Image)' : 'Text-Only Analysis'}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${isReal ? 'text-[#00e3fd]' : 'text-[#ff6e84]'}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {confidencePercent}%
            </div>
            <div className="text-[#a3aac4] text-xs uppercase tracking-wider font-semibold">Confidence Index</div>
          </div>
        </div>
      </div>

      {/* Confidence gauge */}
      <div className="px-6 py-4 bg-[#0f1930]/50 border-b border-[#40485d]/10">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#a3aac4]">Analysis Certainty</span>
          <div className="flex-1 h-2 bg-[#060e20] rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ease-out ${isReal ? 'bg-gradient-to-r from-[#00e3fd] to-[#00d7f0]' : 'bg-gradient-to-r from-[#ff6e84] to-[#d73357]'}`}
              style={{ width: `${result.confidence * 100}%` }}
            />
          </div>
          <span className={`text-sm font-bold ${isReal ? 'text-[#00e3fd]' : 'text-[#ff6e84]'}`}>{confidencePercent}%</span>
        </div>
      </div>

      {/* Explanation */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[#b6a0ff]">psychology</span>
          <h4 className="font-bold text-[#dee5ff] uppercase text-xs tracking-wider">Neural Analysis Report</h4>
        </div>
        <p className="text-[#a3aac4] leading-relaxed">{result.explanation}</p>
      </div>

      {/* Feedback section */}
      {onFeedback && (
        <div className="px-6 py-5 bg-[#060e20]/50 border-t border-[#40485d]/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#b6a0ff]">rate_review</span>
            <h4 className="font-bold text-[#dee5ff] uppercase text-xs tracking-wider">Feedback Protocol</h4>
          </div>
          {feedbackSubmitted ? (
            <div className="flex items-center gap-2 text-[#00e3fd]">
              <span className="material-symbols-outlined">check_circle</span>
              <span className="text-sm font-medium">Feedback logged. Thank you for improving our neural network.</span>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => onFeedback('correct')}
                className="flex-1 px-4 py-3 bg-[#00e3fd]/10 border border-[#00e3fd]/30 text-[#00e3fd] rounded-lg hover:bg-[#00e3fd]/20 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <span className="material-symbols-outlined">thumb_up</span>
                Accurate
              </button>
              <button
                onClick={() => onFeedback('incorrect')}
                className="flex-1 px-4 py-3 bg-[#ff6e84]/10 border border-[#ff6e84]/30 text-[#ff6e84] rounded-lg hover:bg-[#ff6e84]/20 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <span className="material-symbols-outlined">thumb_down</span>
                Inaccurate
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
