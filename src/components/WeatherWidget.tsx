
import React, { useState, useEffect, useCallback } from 'react';
import { getCurrentWeather, getWeatherForecast, CurrentWeatherData, ForecastData } from '@/services/brightSkyService';
import WeatherChart from './WeatherChart';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const REFRESH_INTERVAL = 20 * 60 * 1000; // 20 minutes in milliseconds

const WeatherWidget: React.FC = () => {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Failed to fetch weather data. Please try again later.');
      toast.error('Failed to fetch weather data');
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
    <div className="mx-auto p-3 bg-slate-900/90 rounded-xl shadow-lg text-white border border-slate-800 backdrop-blur-xl">
      <Toaster position="top-right" />
      <header className="mb-3 justify-between items-center">
        <h1 className="text-xl font-bold text-white">Berlin Weather</h1>
        {lastUpdated && (
          <p className="text-xs text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </header>
      
      {error && (
        <div className="p-4 bg-red-900/60 text-red-200 rounded-md mb-4 border border-red-800">
          {error}
        </div>
      )}
      
      <WeatherChart data={forecast} currentWeather={currentWeather} isLoading={loading} />
    </div>
  );
};

export default WeatherWidget;
