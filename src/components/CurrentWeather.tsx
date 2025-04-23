
import React from 'react';
import { CurrentWeatherData } from '@/services/brightSkyService';
import { getWeatherIcon, getWeatherDescription } from '@/utils/weatherIcons';
import { formatBerlinTime } from '@/services/brightSkyService';
import { RefreshCw } from 'lucide-react';

interface CurrentWeatherProps {
  data: CurrentWeatherData;
  isLoading: boolean;
  onRefresh: () => void;
}

const CurrentWeather: React.FC<CurrentWeatherProps> = ({ data, isLoading, onRefresh }) => {
  const WeatherIcon = getWeatherIcon(data?.icon);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-800/50 animate-pulse h-72">
        <div className="w-24 h-24 rounded-full bg-slate-700 mb-4"></div>
        <div className="h-8 bg-slate-700 rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-slate-800/90 backdrop-blur-lg shadow-md p-6 flex flex-col items-center relative overflow-hidden border border-slate-700">
      <div className="absolute top-2 right-2 text-xs text-gray-400">
        {data?.timestamp ? (
          <>Weather observation recorded at: {formatBerlinTime(data.timestamp, 'HH:mm')}</>
        ) : 'Loading...'}
      </div>
      
      <div className="flex items-center justify-center">
        <WeatherIcon size={64} className="text-blue-400" />
        <div className="ml-4 text-6xl font-bold text-white">{Math.round(data?.temperature || 0)}°</div>
      </div>
      
      <div className="mt-4 text-xl text-gray-200">
        {getWeatherDescription(data?.icon)}
      </div>
      
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-6 w-full">
        <div className="flex flex-col">
          <span className="text-sm text-gray-400">Precipitation</span>
          <span className="text-lg font-medium text-white">
            {data?.precipitation !== undefined ? `${data.precipitation.toFixed(1)}mm` : 'N/A'}
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm text-gray-400">Precipitation Chance</span>
          <div className="text-lg font-medium text-white flex flex-col">
            <div className="flex justify-between">
              <span className="text-md">30m:</span>
              <span>{data?.precipitation30min !== undefined ? `${data.precipitation30min.toFixed(1)}mm` : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-md">60m:</span>
              <span>{data?.precipitation60min !== undefined ? `${data.precipitation60min.toFixed(1)}mm` : 'N/A'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm text-gray-400">Cloud Cover</span>
          <span className="text-lg font-medium text-white">
            {data?.cloudCover !== undefined ? `${Math.round(data.cloudCover)}%` : 'N/A'}
          </span>
        </div>
        
        <div className="flex flex-col">
          <button 
            onClick={onRefresh}
            className="text-blue-400 hover:text-blue-300 text-sm mt-auto flex items-center gap-1"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurrentWeather;
