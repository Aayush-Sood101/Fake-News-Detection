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
    <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
      {/* Header with label */}
      <div className={`px-6 py-4 ${isReal ? 'bg-green-500' : 'bg-red-500'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{isReal ? '✅' : '⚠️'}</span>
            <div>
              <h3 className="text-xl font-bold text-white">
                {isReal ? 'Likely Real' : 'Likely Fake'}
              </h3>
              <p className="text-white/80 text-sm">
                {result.modality === 'multimodal' ? '📷 Text + Image Analysis' : '📝 Text Analysis Only'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{confidencePercent}%</div>
            <div className="text-white/80 text-sm">Confidence</div>
          </div>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="px-6 py-3 bg-gray-50 border-b">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 w-20">Confidence:</span>
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${isReal ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${result.confidence * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 w-14">{confidencePercent}%</span>
        </div>
      </div>

      {/* Explanation */}
      <div className="px-6 py-4">
        <h4 className="font-semibold text-gray-700 mb-2">Analysis Explanation</h4>
        <p className="text-gray-600 leading-relaxed">{result.explanation}</p>
      </div>

      {/* Feedback section */}
      {onFeedback && (
        <div className="px-6 py-4 bg-gray-50 border-t">
          <h4 className="font-semibold text-gray-700 mb-3">Was this prediction helpful?</h4>
          {feedbackSubmitted ? (
            <p className="text-green-600 flex items-center gap-2">
              <span>✓</span> Thank you for your feedback!
            </p>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => onFeedback('correct')}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center gap-2"
              >
                <span>👍</span> Correct
              </button>
              <button
                onClick={() => onFeedback('incorrect')}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center gap-2"
              >
                <span>👎</span> Incorrect
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
