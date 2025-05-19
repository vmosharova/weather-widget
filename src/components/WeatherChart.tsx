
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ForecastData, formatBerlinTime, formatBerlinDay, isDaytime } from '@/services/brightSkyService';

interface WeatherChartProps {
  data: ForecastData[];
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

// Color ranges for temperature with new colors
const getTemperatureColor = (temp: number): string => {
  if (temp < -5) return '#1A1F2C'; // dark purple
  if (temp < 0) return '#9b87f5';  // purple
  if (temp < 5) return '#0EA5E9';  // blue
  if (temp < 10) return '#22D3EE'; // turquoise
  if (temp < 15) return '#4ade80'; // green
  if (temp < 20) return '#FEF08A'; // yellow
  if (temp < 25) return '#FB923C'; // orange
  if (temp < 30) return '#ef4444'; // red
  return '#991b1b';               // dark red
};

const WeatherChart: React.FC<WeatherChartProps> = ({ data, isLoading }) => {
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
    
    // Filter out duplicate low points that are near each other
    const seen = new Set<string>();
    const filtered = enhancedData.map((point, index) => {
      if (point.isLow) {
        const key = `${point.formattedDay}-low`;
        if (seen.has(key)) {
          // This is a duplicate low point, so don't mark it as special
          return { ...point, isLow: false, isHighOrLow: point.isHigh };
        }
        seen.add(key);
      }
      return point;
    });
    
    return filtered;
  }, [data]);
  
  const dayTicks = useMemo(() => {
    if (!chartData.length) return [];
    
    const ticks: string[] = [];
    let currentDay = '';
    
    chartData.forEach(item => {
      if (item.formattedDay !== currentDay) {
        currentDay = item.formattedDay;
        ticks.push(item.timestamp);
      }
    });
    
    return ticks;
  }, [chartData]);
  
  if (isLoading) {
    return (
      <div className="animate-pulse h-64 bg-slate-700/50 rounded-lg"></div>
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
    <div className="p-3 bg-slate-800/90 rounded-lg shadow-md border border-slate-700 backdrop-blur-lg h-full">
      <h3 className="text-sm font-medium mb-2 text-white">3-Day Temperature Forecast</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 30, right: 20, left: 0, bottom: 30 }}
          >
            <defs>
              {/* Temperature gradient from top to bottom */}
              <linearGradient id="temperatureGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#991b1b" stopOpacity={0.8} />
                <stop offset="15%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="30%" stopColor="#FB923C" stopOpacity={0.7} />
                <stop offset="45%" stopColor="#FEF08A" stopOpacity={0.7} />
                <stop offset="60%" stopColor="#4ade80" stopOpacity={0.7} />
                <stop offset="75%" stopColor="#22D3EE" stopOpacity={0.7} />
                <stop offset="90%" stopColor="#0EA5E9" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#9b87f5" stopOpacity={0.5} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} stroke="#475569" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(tick) => formatBerlinTime(tick, 'HH:mm')}
              ticks={dayTicks}
              tick={{ fontSize: 12, fill: "#94A3B8" }}
              axisLine={{ stroke: '#475569' }}
              tickLine={false}
            />
            <YAxis
              domain={['dataMin - 2', 'dataMax + 2']}
              tick={{ fontSize: 12, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(temp) => `${Math.round(temp)}°`}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}°C`, 'Temperature']}
              labelFormatter={(label) => {
                const time = formatBerlinTime(label, 'HH:mm');
                const day = formatBerlinDay(label);
                return `${day} ${time}`;
              }}
              contentStyle={{ 
                backgroundColor: 'rgba(30,41,59,0.9)', 
                border: '1px solid #475569',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#E2E8F0'
              }}
            />
            
            {/* Area chart with temperature gradient */}
            <Area
              type="monotone"
              dataKey="temperature"
              stroke="#ffffff"
              strokeWidth={2}
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
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (payload.timestamp === entry.timestamp) {
                        const labelY = entry.isLow ? cy + 25 : cy - 25;
                        return (
                          <g key={`temp-label-${index}`}>
                            <text
                              x={cx}
                              y={labelY}
                              textAnchor="middle"
                              fill="#E2E8F0"
                              fontSize={12}
                              fontWeight="bold"
                            >
                              {Math.round(entry.temperature)}°
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
            
            {/* Day markers */}
            {dayTicks.map((tick, index) => (
              <ReferenceLine
                key={`day-${index}`}
                x={tick}
                stroke="#475569"
                strokeDasharray="3 3"
                label={{
                  value: formatBerlinDay(tick),
                  position: 'top',
                  fill: '#94A3B8',
                  fontSize: 12,
                  offset: 20
                }}
              />
            ))}

            {/* "Now" line - only displayed for today */}
            {chartData.some(entry => entry.formattedDay === currentDay) && (
              <ReferenceLine
                x={closestTimestamp}
                stroke="#60A5FA" 
                strokeWidth={3}
                isFront={true}
                label={{
                  position: 'insideTop',
                  fill: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 'bold',
                  backgroundColor: '#60A5FA',
                  padding: 3,
                  borderRadius: 2
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
