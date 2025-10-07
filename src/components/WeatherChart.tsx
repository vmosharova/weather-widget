
import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ForecastData, CurrentWeatherData, formatBerlinTime, formatBerlinDay } from '@/services/brightSkyService';
import { getWeatherIcon, getWeatherDescription } from '@/utils/weatherIcons';
import PrecipitationChart from './PrecipitationChart';

interface WeatherChartProps {
  data: ForecastData[];
  currentWeather: CurrentWeatherData | null;
  isLoading: boolean;
}

// Add the missing EnhancedForecastData interface
interface EnhancedForecastData extends ForecastData {
  formattedTime: string;
  formattedDay: string;
  daySection: string;
  isHighOrLow: boolean;
  isHigh: boolean;
  isLow: boolean;
}

const WeatherChart: React.FC<WeatherChartProps> = ({ data, currentWeather, isLoading }) => {
  const WeatherIcon = getWeatherIcon(currentWeather?.icon || 'clear-day');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const chartData = useMemo(() => {
    if (!data || !data.length) return [];
    
    // Group data by day
    const dayGroups: Record<string, ForecastData[]> = {};
    
    data.forEach(item => {
      const day = formatBerlinDay(item.timestamp);
      if (!dayGroups[day]) {
        dayGroups[day] = [];
      }
      dayGroups[day].push(item);
    });
    
    // Find high and low temps for each day
    const enhancedData: EnhancedForecastData[] = data.map(item => {
      const day = formatBerlinDay(item.timestamp);
      const dayData = dayGroups[day];
      
      // Find high and low for the day
      const temps = dayData.map(d => d.temperature);
      const highTemp = Math.max(...temps);
      const lowTemp = Math.min(...temps);
      
      // Mark if this is a high or low point
      const isHigh = item.temperature === highTemp;
      const isLow = item.temperature === lowTemp;
      
      let daySection = '';
      const hour = parseInt(formatBerlinTime(item.timestamp, 'H'));
      if (hour >= 5 && hour < 12) daySection = 'morning';
      else if (hour >= 12 && hour < 18) daySection = 'afternoon';
      else if (hour >= 18 && hour < 22) daySection = 'evening';
      else daySection = 'night';
      
      return {
        ...item,
        formattedTime: formatBerlinTime(item.timestamp, 'HH:mm'),
        formattedDay: formatBerlinDay(item.timestamp),
        daySection,
        isHighOrLow: isHigh || isLow,
        isHigh,
        isLow
      };
    });
    
    // Filter out duplicate high/low points - only keep first occurrence per day
    const seen = new Set<string>();
    const filtered = enhancedData.map((point, index) => {
      let newIsHigh = point.isHigh;
      let newIsLow = point.isLow;
      
      if (point.isHigh) {
        const highKey = `${point.formattedDay}-high`;
        if (seen.has(highKey)) {
          newIsHigh = false;
        } else {
          seen.add(highKey);
        }
      }
      
      if (point.isLow) {
        const lowKey = `${point.formattedDay}-low`;
        if (seen.has(lowKey)) {
          newIsLow = false;
        } else {
          seen.add(lowKey);
        }
      }
      
      return { 
        ...point, 
        isHigh: newIsHigh,
        isLow: newIsLow,
        isHighOrLow: newIsHigh || newIsLow
      };
    });
    
    return filtered;
  }, [data]);
  
  const hourlyTicks = useMemo(() => {
    if (!chartData.length) return [];
    
    const ticks: string[] = [];
    const targetHours = ['00', '06', '12', '18'];
    
    chartData.forEach(item => {
      const hour = formatBerlinTime(item.timestamp, 'HH');
      if (targetHours.includes(hour)) {
        ticks.push(item.timestamp);
      }
    });
    
    return ticks;
  }, [chartData]);
  
  const hasRain = useMemo(() => {
    return chartData.some((item) => (item?.precipitationProbability ?? 0) >= 10);
  }, [chartData]);
  
  useEffect(() => {
    setLastUpdated(new Date());
  }, [data, isLoading]);
  
  if (isLoading) {
    return (
      <div className="animate-pulse h-full bg-slate-700/50 rounded-lg"></div>
    );
  }
  
  if (!chartData.length) {
    return <div className="p-4 text-gray-300">No forecast data available</div>;
  }

  // Find the timestamp for "Now" line that's within the chart data range for today
  const today = new Date();
  const now = today.toISOString();
  
  // Get the current day in Berlin timezone to check if the "Now" line should be displayed
  const currentDay = formatBerlinDay(now);
  
  // Find the closest forecast point to the current time to ensure the line appears properly
  let closestTimestamp = now;
  if (chartData.length > 0) {
    const todayData = chartData.filter(item => item.formattedDay === currentDay);
    if (todayData.length > 0) {
      // Find the closest timestamp to current time
      const currentTime = today.getTime();
      let minDiff = Infinity;
      
      todayData.forEach(item => {
        const itemTime = new Date(item.timestamp).getTime();
        const diff = Math.abs(itemTime - currentTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestTimestamp = item.timestamp;
        }
      });
    }
  }

  return (
    <div className="pr-3 bg-slate-800/90 rounded-lg shadow-md border border-slate-700 backdrop-blur-lg h-full flex flex-col overflow-hidden">

      {/* Current Weather Section */}
      {!isLoading && currentWeather && (
        <>
        <div className="mb-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center">
            <WeatherIcon size={32} className="text-blue-400 mr-2" />
            <div className="text-3xl font-bold text-white">{Math.round(currentWeather.temperature || 0)}°</div>
            <div className="ml-2">
              <div className="text-sm text-gray-200">
                {getWeatherDescription(currentWeather.icon)}
              </div>
            </div>
          </div>
          <div>
            {lastUpdated && (
              <p className="text-xs text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </>
      )}

      {/* Weekdays */}
      <div className="relative" style={{ marginLeft: '60px', marginRight: '20px', height: '20px' }}>
        <div className="absolute inset-0">
          {(() => {
            const middayTicks = hourlyTicks.filter(tick => formatBerlinTime(tick, 'HH') === '12');
            const totalPoints = chartData.length > 1 ? chartData.length - 1 : 0;
            return middayTicks.map((tick, index) => {
              const idx = chartData.findIndex(d => d.timestamp === tick);
              if (idx < 0 || totalPoints === 0) return null;
              const leftPosition = (idx / totalPoints) * 100;
              return (
                <div
                  key={`day-label-top-${index}`}
                  className="absolute text-xs text-slate-300 font-medium"
                  style={{ left: `${leftPosition}%`, transform: 'translateX(-50%)' }}
                >
                  {formatBerlinDay(tick)}
                </div>
              );
            });
          })()}
        </div>
      </div>      
      
      {hasRain && (
        <>
          <div className="flex-shrink-0 mt-1">
            <PrecipitationChart 
              data={chartData} 
              isLoading={isLoading} 
              closestTimestamp={closestTimestamp} 
              currentDay={currentDay} 
            />
          </div>
        </>
      )}
      
      <div className="flex-1 min-h-0 mt-[-60px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 30, right: 20, left: 0, bottom: 10 }}
          >
            <defs>
              {/* Temperature gradient from top to bottom - absolute temperature based */}
              <linearGradient id="temperatureGradient" x1="0" y1="0" x2="0" y2="1">
                {(() => {
                  const temps = chartData.map(d => d.temperature);
                  const minTemp = Math.min(...temps);
                  const maxTemp = Math.max(...temps);
                  const tempRange = maxTemp - minTemp;
                  
                  const getColorForTemp = (temp: number) => {
                    if (temp < -10) return '#0F0A1A'; // very dark purple
                    if (temp < -5) return '#1A1F2C';  // dark purple
                    if (temp < -2) return '#6366f1';  // indigo
                    if (temp < 0) return '#9b87f5';   // purple
                    if (temp < 2) return '#3b82f6';   // bright blue
                    if (temp < 5) return '#0EA5E9';   // sky blue
                    if (temp < 8) return '#06b6d4';   // cyan
                    if (temp < 10) return '#22D3EE';  // turquoise
                    if (temp < 12) return '#10b981';  // emerald
                    if (temp < 15) return '#4ade80';  // green
                    if (temp < 17) return '#84cc16';  // lime
                    if (temp < 20) return '#FEF08A';  // yellow
                    if (temp < 22) return '#fbbf24';  // amber
                    if (temp < 25) return '#FB923C';  // orange
                    if (temp < 27) return '#f97316';  // orange-red
                    if (temp < 30) return '#ef4444';  // red
                    if (temp < 32) return '#dc2626';  // bright red
                    if (temp < 35) return '#991b1b';  // dark red
                    return '#7f1d1d';                 // very dark red
                  };
                  
                  const stops = [];
                  const topColor = getColorForTemp(maxTemp);
                  const bottomColor = getColorForTemp(minTemp);
                  
                  stops.push(<stop key="0" offset="0%" stopColor={topColor} stopOpacity={0.8} />);
                  stops.push(<stop key="100" offset="100%" stopColor={bottomColor} stopOpacity={0.5} />);
                  
                  return stops;
                })()}
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} stroke="#475569" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(tick) => formatBerlinTime(tick, 'HH')}
              ticks={hourlyTicks}
              tick={{ fontSize: 12, fill: "#94A3B8", dy: 4 }}
              axisLine={{ stroke: '#475569' }}
              tickLine={false}
            />
            <YAxis
              domain={['dataMin - 2', 'dataMax + 2']}
              tick={{ fontSize: 12, fill: "#94A3B8", dy: -8 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(temp) => `${Math.round(temp)} °`}
            />
            
            {/* Area chart with temperature gradient */}
            <Area
              type="monotone"
              dataKey="temperature"
              stroke="#ffffff"
              fill="url(#temperatureGradient)"
              name="Temperature"
              connectNulls
              dot={false}
              activeDot={{ 
                stroke: '#fff', 
                strokeWidth: 2, 
                r: 4, 
                fill: "#0EA5E9"
              }}
            />
            
            {/* Temperature labels for high and low points */}
            {chartData.map((entry, index) => {
              if (entry.isHigh || entry.isLow) {
                return (
                  <Area
                    key={`label-${index}`}
                    type="monotone"
                    dataKey="temperature"
                    stroke="none"
                    fill="none"
                    dot={(props: { cx?: number; cy?: number; payload?: EnhancedForecastData }) => {
                      const { cx = 0, cy = 0, payload } = props;
                      if (payload && payload.timestamp === entry.timestamp) {
                        const labelY = cy + 20;
                        return (
                          <g key={`temp-label-${index}`}>
                            <text
                              x={cx}
                              y={labelY}
                              textAnchor="middle"
                              fill="#fff"
                              fontSize={12}
                              fontWeight="bold"
                              dominantBaseline="hanging"
                            >
                              {Math.round(entry.temperature)} °
                            </text>
                          </g>
                        );
                      }
                      return null;
                    }}
                    activeDot={false}
                  />
                );
              }
              return null;
            })}
            

            {/* Day start markers - tiny vertical lines at 00:00 */}
            {hourlyTicks
              .filter(tick => formatBerlinTime(tick, 'HH') === '00')
              .map((tick, index) => (
                <ReferenceLine
                  key={`day-start-${index}`}
                  x={tick}
                  stroke="#475569"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
              ))}

            {/* "Now" line - only displayed for today */}
            {chartData.some(entry => entry.formattedDay === currentDay) && (
              <ReferenceLine
                x={closestTimestamp}
                stroke="#60A5FA" 
                strokeWidth={2}
                isFront={true}
                label={{
                  position: 'insideTop',
                  fill: '#FFFFFF',
                  fontSize: 12,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
    </div>
  );
};

export default WeatherChart;
