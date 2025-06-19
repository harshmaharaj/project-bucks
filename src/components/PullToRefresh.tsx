
import React from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  isRefreshing: boolean;
  pullDistance: number;
  threshold?: number;
}

const PullToRefresh = ({ isRefreshing, pullDistance, threshold = 100 }: PullToRefreshProps) => {
  const opacity = Math.min(pullDistance / threshold, 1);
  const rotation = (pullDistance / threshold) * 180;

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center bg-white border-b shadow-sm transition-all duration-200"
      style={{
        height: Math.min(pullDistance, threshold),
        opacity: opacity
      }}
    >
      <div className="flex items-center space-x-2 text-blue-600">
        <RefreshCw 
          className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
          style={{ 
            transform: `rotate(${isRefreshing ? 0 : rotation}deg)`,
            transition: isRefreshing ? 'none' : 'transform 0.1s ease-out'
          }}
        />
        <span className="text-sm font-medium">
          {isRefreshing ? 'Refreshing...' : pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
    </div>
  );
};

export default PullToRefresh;
