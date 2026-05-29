import { DayForecast } from '@/types/weather';
import { WeatherIcon } from './WeatherIcon';

interface ForecastCardProps {
  day: DayForecast;
}

export function ForecastCard({ day }: ForecastCardProps) {
  const date = new Date(day.datetime);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const isToday = date.toDateString() === new Date().toDateString();
  
  return (
    <div className={`flex-shrink-0 w-28 p-3 rounded-xl text-center transition-all hover:scale-105 ${
      isToday 
        ? 'bg-white/30 backdrop-blur-sm ring-1 ring-white/50' 
        : 'bg-white/10 backdrop-blur-sm hover:bg-white/20'
    }`}>
      <p className="text-white font-semibold">{isToday ? 'Today' : dayName}</p>
      <p className="text-white/40 text-xs">{day.datetime}</p>
      <div className="my-2">
        <WeatherIcon iconCode={day.icon} size={32} className="text-white mx-auto" />
      </div>
      <p className="text-white font-bold text-lg">{Math.round(day.temp)}°C</p>
      <div className="flex justify-center gap-2 text-xs mt-1">
        <span className="text-white/60">{Math.round(day.tempmax)}°</span>
        <span className="text-white/40">{Math.round(day.tempmin)}°</span>
      </div>
      <p className="text-white/50 text-xs truncate mt-1">{day.conditions}</p>
    </div>
  );
}