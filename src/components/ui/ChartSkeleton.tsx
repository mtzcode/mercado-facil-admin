'use client';

interface ChartSkeletonProps {
  type?: 'line' | 'pie' | 'bar';
  height?: string;
  title?: string;
}

export default function ChartSkeleton({ type = 'line', height = 'h-80', title }: ChartSkeletonProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'pie':
        return (
          <div className="flex items-center justify-center">
            <div className="w-40 h-40 rounded-full border-8 border-gray-200 border-t-gray-300 animate-pulse"></div>
          </div>
        );
      
      case 'bar':
        return (
          <div className="flex items-end justify-center space-x-2 px-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 animate-pulse rounded-t"
                style={{
                  width: '40px',
                  height: `${Math.random() * 60 + 40}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
          </div>
        );
      
      case 'line':
      default:
        return (
          <div className="relative">
            {/* Grid lines */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-0">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="border-r border-b border-gray-100"></div>
              ))}
            </div>
            
            {/* Animated line */}
            <svg className="absolute inset-0 w-full h-full">
              <path
                d="M 50 200 Q 150 100 250 150 T 450 120"
                stroke="#e5e7eb"
                strokeWidth="2"
                fill="none"
                className="animate-pulse"
              />
              <path
                d="M 50 180 Q 150 120 250 170 T 450 140"
                stroke="#d1d5db"
                strokeWidth="2"
                fill="none"
                className="animate-pulse"
                style={{ animationDelay: '0.5s' }}
              />
            </svg>
            
            {/* Data points */}
            <div className="absolute inset-0 flex items-center justify-around">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          {title ? (
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
          ) : (
            <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
          )}
          <div className="h-4 bg-gray-100 rounded animate-pulse w-24"></div>
        </div>
        <div className="flex space-x-2">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      
      {/* Chart skeleton */}
      <div className={`${height} flex items-center justify-center`}>
        {renderSkeleton()}
      </div>
      
      {/* Legend skeleton */}
      <div className="mt-4 flex justify-center space-x-6">
        {[...Array(type === 'pie' ? 4 : 2)].map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
          </div>
        ))}
      </div>
      
      {/* Stats skeleton (for some charts) */}
      {type === 'pie' && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}