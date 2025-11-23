import React from 'react';
import { Cloud, Snowflake } from 'lucide-react';
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
      {/* 3-hour block rain icons above bars */}
      <div className="relative mb-1" style={{ height: '44px' }} aria-hidden="true">
        <div className="absolute inset-0">
          {(() => {
            const totalPoints = data.length > 1 ? data.length - 1 : 0;
            type BlockInfo = { indices: number[]; hasPrecip: boolean };
            const blocks = new Map<string, BlockInfo>();

            data.forEach((item, index) => {
              const day = formatBerlinDay(item.timestamp);
              const hour = parseInt(formatBerlinTime(item.timestamp, 'H'));
              const blockStartHour = Math.floor(hour / 4) * 4;
              const key = `${day}-${blockStartHour}`;
              if (!blocks.has(key)) {
                blocks.set(key, { indices: [], hasPrecip: false });
              }
              const info = blocks.get(key)!;
              info.indices.push(index);
              const isPast = day === currentDay && new Date(item.timestamp) < new Date(closestTimestamp);
              const precipActive = (isPast && (item.precipitation ?? 0) > 0) || (!isPast && ((item.precipitationProbability ?? 0) >= 5));
              if (precipActive) {
                info.hasPrecip = true;
              }
            });

            const icons: React.ReactNode[] = [];
            blocks.forEach((info) => {
              if (!info.hasPrecip || info.indices.length === 0) return;
              const middleIdx = info.indices[Math.floor(info.indices.length / 2)];
              const leftPosition = totalPoints > 0 ? (middleIdx / totalPoints) * 100 : 0;
              icons.push(
                <div
                  key={`precip-icon-${middleIdx}`}
                  className="absolute"
                  style={{ left: `${leftPosition}%`, transform: 'translateX(-50%)' }}
                >
                  <Cloud size={50} className="text-blue-500 opacity-70" />
                </div>
              );
            });
            return icons;
          })()}
        </div>
      </div>
      <div className="rounded relative" style={{ height: '32px' }}>
        {/* Precipitation bars */}
        <div className="h-full flex items-start justify-start absolute inset-0">
          {data.map((item, index) => {
            const totalWidth = data.length > 0 ? (100 / data.length) : 0;
            const isPast = formatBerlinDay(item.timestamp) === currentDay && new Date(item.timestamp) < new Date(closestTimestamp);
            const showPastBar = isPast && ((item.precipitation ?? 0) > 0);
            const showFutureBar = !isPast && ((item.precipitationProbability ?? 0) >= 5);
            const isSnow = ((item.condition || '').toLowerCase().includes('snow') || (item.condition || '').toLowerCase().includes('sleet'));
            const MAX_MM = 5; // full height at 5 mm/h
            const heightPx = showPastBar
              ? Math.max(2, Math.min(30, (((item.precipitation || 0) / MAX_MM) * 30)))
              : Math.max(2, ((item.precipitationProbability / 100) * 30));
            const titleText = isSnow
              ? (showPastBar
                  ? `${formatBerlinTime(item.timestamp, 'HH:mm')}: ${(((item.precipitation || 0).toLocaleString('de-DE')))} mm snow`
                  : `${formatBerlinTime(item.timestamp, 'HH:mm')}: ${item.precipitationProbability}% chance of snow`)
              : (showPastBar
                  ? `${formatBerlinTime(item.timestamp, 'HH:mm')}: ${(((item.precipitation || 0).toLocaleString('de-DE')))} mm`
                  : `${formatBerlinTime(item.timestamp, 'HH:mm')}: ${item.precipitationProbability}% chance of rain`);

            // Determine snowflake count (1-3) based on intensity or probability
            let snowflakeCount = 0;
            if (isSnow && (showPastBar || showFutureBar)) {
              if (showPastBar) {
                const mm = item.precipitation || 0;
                snowflakeCount = mm > 3 ? 3 : mm > 1 ? 2 : 1;
              } else {
                const p = item.precipitationProbability || 0;
                snowflakeCount = p > 66 ? 3 : p > 33 ? 2 : 1;
              }
            }
            return (
              <div
                key={`precip-${index}`}
                className="flex flex-col items-center justify-start"
                style={{ 
                  width: `${totalWidth}%`,
                  height: '30px'
                }}
              >
                {(showPastBar || showFutureBar) && (
                  isSnow ? (
                    <div
                      className="flex flex-col items-center justify-start gap-0.5"
                      style={{ height: '30px' }}
                      title={titleText}
                    >
                      {Array.from({ length: snowflakeCount }).map((_, i) => (
                        <Snowflake key={`flake-${i}`} size={12} className="text-blue-500 opacity-70" />
                      ))}
                    </div>
                  ) : (
                    <div
                      className="bg-blue-500 opacity-70 rounded-b-sm"
                      style={{ 
                        height: `${heightPx}px`,
                        width: '6px',
                        minHeight: '2px'
                      }}
                      title={titleText}
                    />
                  )
                )}
              </div>
            );
          })}
        </div>
        
      </div>
    </div>
  );
};

export default PrecipitationChart;