'use client';

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

interface HistoryTableProps {
  predictions: Prediction[];
  onViewDetails?: (prediction: Prediction) => void;
}

export function HistoryTable({ predictions, onViewDetails }: HistoryTableProps) {
  if (predictions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-lg font-semibold text-gray-700">No predictions yet</h3>
        <p className="text-gray-500 mt-2">Submit your first article to see results here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Result
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Feedback
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {predictions.map((prediction) => (
              <tr key={prediction.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="max-w-xs truncate font-medium text-gray-900">
                    {prediction.title}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    prediction.label === 'REAL' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {prediction.label === 'REAL' ? '✅' : '⚠️'} {prediction.label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${prediction.label === 'REAL' ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${prediction.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {(prediction.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {prediction.modality === 'multimodal' ? '📷 Multi' : '📝 Text'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {prediction.feedback ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                      prediction.feedback === 'correct'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {prediction.feedback === 'correct' ? '👍' : '👎'} {prediction.feedback}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {format(new Date(prediction.createdAt), 'MMM d, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onViewDetails?.(prediction)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
