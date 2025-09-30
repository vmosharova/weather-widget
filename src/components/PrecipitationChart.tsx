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


  // TODO remove later: show some example rain in development to preview the UI.
  const hasVisibleBars = data.some(item => (item as any).precipitationProbability >= 10);
  const displayData = React.useMemo(() => {
    if (hasVisibleBars || !import.meta.env.DEV) {
      return data;
    }
    const cloned = data.map(d => ({ ...d }));
    const exampleValues = [15, 40, 75, 55];
    if (cloned.length >= exampleValues.length) {
      let startIndex = Math.max(0, Math.floor(cloned.length / 2) - Math.floor(exampleValues.length / 2));
      if (startIndex + exampleValues.length > cloned.length) {
        startIndex = cloned.length - exampleValues.length;
      }
      for (let j = 0; j < exampleValues.length; j++) {
        (cloned[startIndex + j] as any).precipitationProbability = exampleValues[j];
      }
    }
    return cloned;
  }, [data, hasVisibleBars]);

  return (
    <div className="relative" style={{ marginLeft: '60px', marginRight: '20px' }}>
      <div className="border border-slate-600 rounded relative" style={{ height: '32px' }}>
        {/* Precipitation bars */}
        <div className="h-full flex items-end justify-start absolute inset-0">
          {displayData.map((item, index) => {
            const totalWidth = displayData.length > 0 ? (100 / displayData.length) : 0;
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
        {displayData.some(entry => formatBerlinDay(entry.timestamp) === currentDay) && (() => {
          const nowIndex = displayData.findIndex(item => item.timestamp === closestTimestamp);
          const leftPosition = nowIndex >= 0 ? (nowIndex / (displayData.length - 1)) * 100 : 0;
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