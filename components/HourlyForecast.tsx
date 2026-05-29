'use client';

import { DayForecast } from '@/types/weather';
import { WeatherIcon } from './WeatherIcon';

interface HourlyForecastProps {
  hours: { time: string; temp: number; icon: string }[];
}

export function HourlyForecast({ hours }: HourlyForecastProps) {
  return (
    <div className="py-8">
      <h3 className="text-white/50 text-sm font-light tracking-wider px-6 mb-4">
        HOURLY
      </h3>
      
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-6 pb-4">
          {hours.map((hour, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-20 py-4 rounded-2xl bg-white/5 backdrop-blur-sm text-center hover:bg-white/10 transition-all"
            >
              <div className="text-white/60 text-xs font-light">{hour.time}</div>
              <div className="my-2">
                <WeatherIcon iconCode={hour.icon} size={28} className="text-white/80 mx-auto" />
              </div>
              <div className="text-white font-medium">{hour.temp}°</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}