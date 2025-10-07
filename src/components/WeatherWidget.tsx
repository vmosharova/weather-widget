
import React, { useState, useEffect, useCallback } from 'react';
import { getCurrentWeather, getWeatherForecast, CurrentWeatherData, ForecastData } from '@/services/brightSkyService';
import WeatherChart from './WeatherChart';
import { Toaster } from '@/components/ui/sonner';

const REFRESH_INTERVAL = 20 * 60 * 1000; // 20 minutes in milliseconds

const WeatherWidget: React.FC = () => {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = useCallback(async (refreshOnly = false) => {
    try {
      if (!refreshOnly) {
        setLoading(true);
      }
      setError(null);
      
      const [currentData, forecastData] = await Promise.all([
        getCurrentWeather(),
        getWeatherForecast()
      ]);
      
      setCurrentWeather(currentData);
      setForecast(forecastData);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Failed to fetch weather data. Please try again later.');
    } finally {
      if (!refreshOnly) {
        setLoading(false);
      }
    }
  }, []);
  
  useEffect(() => {
    fetchWeatherData();
    
    const intervalId = setInterval(fetchWeatherData, REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [fetchWeatherData]);
  
  return (
    <div className="h-full w-full bg-slate-900/90 text-white backdrop-blur-xl flex flex-col">
      <Toaster position="top-right" />
      
      {error && (
        <div className="p-4 bg-red-900/60 text-red-200 rounded-md mb-4 border border-red-800 flex-shrink-0">
          {error}
        </div>
      )}
      
      <div className="flex-1 min-h-0">
        <WeatherChart data={forecast} currentWeather={currentWeather} isLoading={loading} />
      </div>
    </div>
  );
};

export default WeatherWidget;
