import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  subtext?: string;
}

export function LoadingSpinner({ size = 'md', text = 'Loading...', subtext }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        {/* Outer rotating ring */}
        <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
        
        {/* Inner pulsing ring */}
        <div className={`absolute inset-0 ${sizeClasses[size]} border-4 border-transparent border-r-blue-400 rounded-full animate-pulse`}></div>
        
        {/* Center dot with 3D effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce shadow-lg"></div>
        </div>
      </div>
      
      {text && (
        <p className="mt-4 text-gray-600 font-medium animate-pulse">{text}</p>
      )}
      
      {subtext && (
        <p className="text-sm text-gray-500 mt-2">{subtext}</p>
      )}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        
        {/* Rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-gray-400">Chart loading...</div>
        </div>
      </div>
    </div>
  );
}




