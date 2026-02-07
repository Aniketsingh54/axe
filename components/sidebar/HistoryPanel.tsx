'use client';

import { Clock, RotateCcw, Play, FileText } from 'lucide-react';

export default function HistoryPanel() {
  const mockHistory = [
    {
      id: '1',
      name: 'Product Marketing Kit',
      timestamp: '2024-01-15 14:30',
      status: 'success',
      duration: '12.4s',
      scope: 'Full Workflow'
    },
    {
      id: '2',
      name: 'Image Processing Batch',
      timestamp: '2024-01-15 12:15',
      status: 'partial',
      duration: '8.2s',
      scope: '2 nodes selected'
    },
    {
      id: '3',
      name: 'LLM Response Generation',
      timestamp: '2024-01-15 10:45',
      status: 'failed',
      duration: '3.1s',
      scope: 'Single Node'
    }
  ];

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-dark-text">Workflow History</h2>
        <button className="p-1.5 rounded-md hover:bg-dark-muted transition-colors">
          <RotateCcw className="w-4 h-4 text-dark-text-muted" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {mockHistory.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border ${item.status === 'success'
                  ? 'border-green-800/50 bg-green-900/20'
                  : item.status === 'partial'
                    ? 'border-yellow-800/50 bg-yellow-900/20'
                    : 'border-red-800/50 bg-red-900/20'
                }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-dark-text">{item.name}</h3>
                  <div className="flex items-center mt-1 text-xs text-dark-text-muted">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{item.timestamp}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'success'
                      ? 'bg-green-900/50 text-green-400'
                      : item.status === 'partial'
                        ? 'bg-yellow-900/50 text-yellow-400'
                        : 'bg-red-900/50 text-red-400'
                    }`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-dark-text-muted">
                <span>{item.duration}</span>
                <span className="flex items-center">
                  <Play className="w-3 h-3 mr-1" />
                  {item.scope}
                </span>
              </div>

              <button className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-wy-500 hover:text-wy-400 py-1.5 px-2 rounded border border-dark-border hover:bg-dark-muted transition-colors">
                <FileText className="w-3 h-3" />
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}