import React from 'react';
import { ForecastData, formatBerlinTime, formatBerlinDay } from '@/services/brightSkyService';

interface PrecipitationChartProps {
  data: ForecastData[];
  isLoading: boolean;
  closestTimestamp: string;
  currentDay: string;
}

const PrecipitationChart: React.FC<PrecipitationChartProps> = ({ 
  data, 
  isLoading, 
  closestTimestamp, 
  currentDay 
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse h-8 bg-slate-700/50 rounded-lg"></div>
    );
  }

  if (!data.length) {
    return <div className="p-2 text-gray-300">No precipitation data available</div>;
  }

  return (
    <div className="relative" style={{ marginLeft: '60px', marginRight: '20px' }}>
      <div className="border border-slate-600 rounded relative" style={{ height: '32px' }}>
        {/* Precipitation bars */}
        <div className="h-full flex items-end justify-start absolute inset-0">
          {data.map((item, index) => {
            const totalWidth = data.length > 0 ? (100 / data.length) : 0;
            return (
              <div
                key={`precip-${index}`}
                className="flex flex-col items-center justify-end"
                style={{ 
                  width: `${totalWidth}%`,
                  height: '30px'
                }}
              >
                {item.precipitationProbability >= 10 && (
                  <div
                    className="bg-blue-500 opacity-70 rounded-t-sm"
                    style={{ 
                      height: `${(item.precipitationProbability / 100) * 30}px`,
                      width: '6px',
                      minHeight: '2px'
                    }}
                    title={`${formatBerlinTime(item.timestamp, 'HH:mm')}: ${item.precipitationProbability}% chance of rain`}
                  />
                )}
              </div>
            );
          })}
        </div>
        
        {/* "Now" line extension */}
        {data.some(entry => formatBerlinDay(entry.timestamp) === currentDay) && (() => {
          const nowIndex = data.findIndex(item => item.timestamp === closestTimestamp);
          const leftPosition = nowIndex >= 0 ? (nowIndex / (data.length - 1)) * 100 : 0;
          return (
            <div 
              className="absolute top-0 bottom-0 border-l-2 border-blue-400" 
              style={{ 
                left: `${leftPosition}%`,
                width: '2px',
                pointerEvents: 'none',
                fontWeight: 'bold',
              }}
            />
          );
        })()}
      </div>
    </div>
  );
};

export default PrecipitationChart;