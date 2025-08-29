
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  LucideIcon,
  TriangleAlert
} from 'lucide-react';


export const getWeatherIcon = (condition: string | undefined): LucideIcon => {
  if (!condition) return Sun;
  
  const conditionMap: Record<string, LucideIcon> = {
    'clear-day': Sun,
    'clear-night': Sun,
    'partly-cloudy-day': CloudSun,
    'partly-cloudy-night': CloudSun,
    'cloudy': Cloud,
    'fog': CloudFog,
    'rain': CloudRain,
    'sleet': CloudRain,
    'snow': CloudSnow,
    'wind': Cloud,
    'thunderstorm': CloudLightning,
    'drizzle': CloudDrizzle,
    'some-error': TriangleAlert
  };
  
  return conditionMap[condition] || Sun;
};

export const getWeatherDescription = (condition: string | undefined): string => {
  if (!condition) return 'Unknown';
  
  const descriptions: Record<string, string> = {
    'clear-day': 'Clear',
    'clear-night': 'Clear',
    'partly-cloudy-day': 'Partly Cloudy',
    'partly-cloudy-night': 'Partly Cloudy',
    'cloudy': 'Cloudy',
    'fog': 'Foggy',
    'rain': 'Rain',
    'sleet': 'Sleet',
    'snow': 'Snow',
    'wind': 'Windy',
    'thunderstorm': 'Thunderstorm',
    'drizzle': 'Drizzle',
    'some-error': 'Something went wrong! Look into the console'
  };
  
  return descriptions[condition] || condition.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
};
