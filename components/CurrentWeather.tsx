'use client';

import { CurrentConditions } from '@/types/weather';
import { WeatherIcon, DetailIcon } from './WeatherIcon';

interface CurrentWeatherProps {
  data: CurrentConditions;
  location: string;
}

export function CurrentWeather({ data, location }: CurrentWeatherProps) {
  const getTimeOfDay = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 20) return 'Evening';
    return 'Night';
  };

  return (
    <div className="text-center space-y-4">
      <h2 className="text-3xl font-light text-white">{location}</h2>
      <div className="flex justify-center gap-2 text-white/60 text-sm">
        <span>{new Date(data.datetime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        <span>•</span>
        <span>{getTimeOfDay()}</span>
      </div>
      
      <div className="flex justify-center my-6">
        <WeatherIcon iconCode={data.icon} size={80} className="text-white drop-shadow-lg" />
      </div>
      
      <div className="space-y-2">
        <div className="text-7xl font-bold text-white tracking-tighter">
          {Math.round(data.temp)}<span className="text-4xl">°C</span>
        </div>
        <p className="text-xl text-white/90 font-medium">{data.conditions}</p>
        <p className="text-white/60">Feels like {Math.round(data.feelslike)}°C</p>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/20">
        <div className="text-center">
          <DetailIcon type="humidity" className="mx-auto text-white/70 mb-2" />
          <p className="text-white font-semibold">{data.humidity}%</p>
          <p className="text-white/50 text-xs">Humidity</p>
        </div>
        <div className="text-center">
          <DetailIcon type="wind" className="mx-auto text-white/70 mb-2" />
          <p className="text-white font-semibold">{data.windspeed} km/h</p>
          <p className="text-white/50 text-xs">Wind</p>
        </div>
        <div className="text-center">
          <DetailIcon type="temp" className="mx-auto text-white/70 mb-2" />
          <p className="text-white font-semibold">{Math.round(data.temp)}°C</p>
          <p className="text-white/50 text-xs">Current</p>
        </div>
      </div>
    </div>
  );
}