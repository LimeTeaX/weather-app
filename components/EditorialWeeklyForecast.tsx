'use client';

import { DayForecast } from '@/types/weather';
import { WeatherIcon } from './WeatherIcon';

interface EditorialWeeklyForecastProps {
  days: DayForecast[];
}

export function EditorialWeeklyForecast({ days }: EditorialWeeklyForecastProps) {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <div className="py-8 px-6">
      <h3 className="text-white/50 text-sm font-light tracking-wider mb-6">
        WEEKLY
      </h3>
      
      <div className="space-y-4">
        {days.slice(1, 8).map((day, idx) => {
          const date = new Date(day.datetime);
          const dayName = weekDays[date.getDay()] || date.toLocaleDateString('en-US', { weekday: 'short' });
          
          return (
            <div key={idx} className="group flex items-center gap-4 py-2 border-b border-white/5 hover:border-white/20 transition-all">
              {/* Day */}
              <div className="w-12 text-white font-medium">{dayName}</div>
              
              {/* Icon */}
              <div className="w-8">
                <WeatherIcon iconCode={day.icon} size={20} className="text-white/60" />
              </div>
              
              {/* Editorial line - expands on hover */}
              <div className="flex-1 h-px bg-white/10 group-hover:bg-white/30 transition-all" />
              
              {/* Temperatures - asymmetric alignment */}
              <div className="flex gap-3 text-right">
                <span className="text-white font-light w-8">{Math.round(day.tempmax)}°</span>
                <span className="text-white/40 w-8">{Math.round(day.tempmin)}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}