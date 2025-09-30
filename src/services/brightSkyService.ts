import axios from "axios";
import { format, addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const BRIGHTSKY_API_URL = "https://api.brightsky.dev";
const BERLIN_COORDINATES = { lat: 52.52, lon: 13.405 };
const TIMEZONE = "Europe/Berlin";

export interface CurrentWeatherResponse {
  weather: {
    timestamp: string;
    source_id: number;
    precipitation_10: number;
    precipitation_30: number;
    precipitation_60: number;
    pressure_msl: number;
    sunshine_30: number;
    sunshine_60: number;
    temperature: number;
    wind_direction_10: number;
    wind_speed_10: number;
    wind_speed_30: number;
    wind_speed_60: number;
    cloud_cover: number;
    dew_point: number;
    relative_humidity: number;
    visibility: number;
    wind_gust_direction_10: number;
    wind_gust_speed_10: number;
    condition: string;
    icon: string;
  };
}

export interface WeatherData {
  weather: Array<{
    timestamp: string;
    source_id: number;
    precipitation: number;
    pressure_msl: number;
    sunshine: number;
    temperature: number;
    wind_direction: number;
    wind_speed: number;
    cloud_cover: number;
    dew_point: number;
    relative_humidity: number;
    visibility: number;
    wind_gust_direction: number;
    wind_gust_speed: number;
    condition: string;
    precipitation_probability: number;
    precipitation_10: number;
    precipitation_30: number;
    precipitation_60: number;
    icon: string;
  }>;
}

export interface CurrentWeatherData {
  temperature: number;
  condition: string;
  icon: string;
  precipitation: number;
  precipitationProbability: number;
  precipitation30min: number;
  precipitation60min: number;
  cloudCover: number;
  timestamp: string;
}

export interface ForecastData {
  timestamp: string;
  temperature: number;
  condition: string;
  precipitationProbability: number;
}

export const getCurrentWeather = async (): Promise<CurrentWeatherData> => {
  try {
    const date = new Date();

    const response = await axios.get<CurrentWeatherResponse>(
      `${BRIGHTSKY_API_URL}/current_weather`,
      {
        params: {
          lat: BERLIN_COORDINATES.lat,
          lon: BERLIN_COORDINATES.lon,
          date: format(date, "yyyy-MM-dd"),
          tz: TIMEZONE,
        },
      }
    );

    if (!response.data || !response.data.weather) {
      console.error(
        "Invalid response structure from BrightSky API:",
        response.data
      );
      return createFallbackCurrentWeather();
    }

    const weatherData = response.data.weather;

    return {
      temperature: weatherData.temperature,
      condition: weatherData.condition || "clear-day",
      icon: weatherData.icon || "clear-day",
      precipitation: weatherData.precipitation_10 || 0,
      precipitationProbability: weatherData.precipitation_60 || 0,
      precipitation30min: weatherData.precipitation_30 || 0,
      precipitation60min: weatherData.precipitation_60 || 0,
      cloudCover: weatherData.cloud_cover || 0,
      timestamp: weatherData.timestamp,
    };
  } catch (error) {
    console.error("Error fetching current weather:", error);
    return createFallbackCurrentWeather();
  }
};

const createFallbackCurrentWeather = (): CurrentWeatherData => {
  return {
    temperature: 0,
    condition: "some-error",
    icon: "some-error",
    precipitation: 0,
    precipitationProbability: 0,
    precipitation30min: 0,
    precipitation60min: 0,
    cloudCover: 0,
    timestamp: new Date().toISOString(),
  };
};

export const getWeatherForecast = async (): Promise<ForecastData[]> => {
  try {
    const today = new Date();
    const startDate = format(today, "yyyy-MM-dd");
    const endDate = format(addDays(today, 3), "yyyy-MM-dd");

    const response = await axios.get<WeatherData>(
      `${BRIGHTSKY_API_URL}/weather`,
      {
        params: {
          lat: BERLIN_COORDINATES.lat,
          lon: BERLIN_COORDINATES.lon,
          date: startDate,
          last_date: endDate,
          tz: TIMEZONE,
        },
      }
    );

    if (
      !response.data ||
      !response.data.weather ||
      !response.data.weather.length
    ) {
      console.error(
        "Invalid response structure from BrightSky API:",
        response.data
      );
      return generateFallbackForecast();
    }

    return response.data.weather.map((item) => ({
      timestamp: item.timestamp,
      temperature: item.temperature,
      condition: item.condition || "clear-day",
      precipitationProbability: item.precipitation_probability || 0,
    }));
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    return generateFallbackForecast();
  }
};


const generateFallbackForecast = (): ForecastData[] => {
  const fallbackData: ForecastData[] = [];
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() + i * 3600 * 1000).toISOString();
    fallbackData.push({
      timestamp,
      temperature: 0,
      condition: "some-error",
      precipitationProbability: 0,
    });
  }

  return fallbackData;
};

/**
 * Format a date string to display in Berlin timezone
 */
export const formatBerlinTime = (
  dateStr: string,
  formatStr: string = "HH:mm"
): string => {
  return formatInTimeZone(new Date(dateStr), TIMEZONE, formatStr);
};

/**
 * Format a date string to display the day in Berlin timezone
 */
export const formatBerlinDay = (dateStr: string): string => {
  return formatInTimeZone(new Date(dateStr), TIMEZONE, "EEE");
};