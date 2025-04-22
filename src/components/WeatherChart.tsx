
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

  // Get current timestamp for "Now" line
  const now = new Date().toISOString();

  return (
    <div className="mt-6 p-4 bg-slate-800/90 rounded-lg shadow-md border border-slate-700 backdrop-blur-lg">
      <h3 className="text-lg font-medium mb-4 text-white">3-Day Temperature Forecast</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 30, right: 20, left: 0, bottom: 30 }}
          >
            <defs>
              {/* Gradient definitions for temperature ranges */}
              {[
                { id: 'tempGradientBelow-5', color: '#1A1F2C' },
                { id: 'tempGradientBelow0', color: '#9b87f5' },
                { id: 'tempGradientBelow5', color: '#0EA5E9' },
                { id: 'tempGradientBelow10', color: '#22D3EE' },
                { id: 'tempGradientBelow15', color: '#4ade80' },
                { id: 'tempGradientBelow20', color: '#FEF08A' },
                { id: 'tempGradientBelow25', color: '#FB923C' },
                { id: 'tempGradientBelow30', color: '#ef4444' },
                { id: 'tempGradientAbove30', color: '#991b1b' },
              ].map(({ id, color }) => (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                </linearGradient>
              ))}
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
            
            {/* Fix the Area component - we can't use a function for fill, so use a basic color and handle the 
                colored dots separately */}
            <Area
              type="monotone"
              dataKey="temperature"
              stroke="#ffffff"
              strokeWidth={2}
              fill="none"
              name="Temperature"
              connectNulls
              dot={false}
              activeDot={{ 
                stroke: '#fff', 
                strokeWidth: 2, 
                r: 4, 
                fill: "#0EA5E9" // Use a static color instead of a function
              }}
            />
            
            {/* Custom dots and labels for high and low points */}
            {chartData.map((entry, index) => {
              if (entry.isHigh || entry.isLow) {
                return (
                  <Area
                    key={`dot-${index}`}
                    type="monotone"
                    dataKey="temperature"
                    stroke="none"
                    fill="none"
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (payload.timestamp === entry.timestamp) {
                        const color = getTemperatureColor(entry.temperature);
                        const labelY = entry.isLow ? cy + 25 : cy - 25;
                        return (
                          <g key={`custom-dot-${index}`}>
                            <circle cx={cx} cy={cy} r={4} fill={color} />
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

            {/* "Now" line */}
            <ReferenceLine
              x={now}
              stroke="#94A3B8"
              strokeWidth={2}
              label={{
                value: 'Now',
                position: 'top',
                fill: '#94A3B8',
                fontSize: 12
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeatherChart;
