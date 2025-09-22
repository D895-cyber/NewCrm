import React from 'react';

interface LoadingProgressProps {
  progress: number;
  isLoading: boolean;
  message?: string;
}

export function LoadingProgress({ progress, isLoading, message = "Loading data..." }: LoadingProgressProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-dark-card border-b border-dark-border">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-dark-primary">{message}</span>
          <span className="text-sm text-dark-secondary">{progress}%</span>
        </div>
        <div className="w-full bg-dark-tag rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
