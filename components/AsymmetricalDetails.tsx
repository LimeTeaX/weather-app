'use client';

import { CurrentConditions } from '@/types/weather';
import { DetailIcon } from './WeatherIcon';

interface AsymmetricalDetailsProps {
  data: CurrentConditions;
}

export function AsymmetricalDetails({ data }: AsymmetricalDetailsProps) {
  // Staggered, asymmetrical card sizes
  return (
    <div className="py-8 px-6">
      <h3 className="text-white/50 text-sm font-light tracking-wider mb-4">
        DETAILS
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 auto-rows-min">
        {/* Large card - humidity */}
        <div className="col-span-2 md:col-span-1 row-span-2 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5">
          <DetailIcon type="humidity" size={24} className="text-white/40 mb-3" />
          <div className="text-white/60 text-xs mb-1">Humidity</div>
          <div className="text-white text-2xl font-light">{data.humidity}%</div>
        </div>
        
        {/* Small card - wind */}
        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5">
          <DetailIcon type="wind" size={20} className="text-white/40 mb-2" />
          <div className="text-white/50 text-xs">Wind</div>
          <div className="text-white text-lg font-light">{data.windspeed} km/h</div>
        </div>
        
        {/* Small card - UV Index (simulated) */}
        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5">
          <div className="text-white/40 text-xs mb-2">UV Index</div>
          <div className="text-white text-lg font-light">5</div>
          <div className="text-white/40 text-xs">Moderate</div>
        </div>
        
        {/* Medium card - pressure */}
        <div className="col-span-1 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5">
          <div className="text-white/50 text-xs">Pressure</div>
          <div className="text-white text-lg font-light">1013 hPa</div>
        </div>
        
        {/* Sunrise - special treatment */}
        <div className="col-span-1 p-5 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
          <DetailIcon type="sunrise" size={20} className="text-white/40 mb-2" />
          <div className="text-white/50 text-xs">Sunrise</div>
          <div className="text-white text-xl font-light">{data.sunrise}</div>
        </div>
        
        {/* Sunset */}
        <div className="col-span-1 p-5 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
          <DetailIcon type="sunset" size={20} className="text-white/40 mb-2" />
          <div className="text-white/50 text-xs">Sunset</div>
          <div className="text-white text-xl font-light">{data.sunset}</div>
        </div>
        
        {/* Visibility */}
        <div className="col-span-2 p-4 rounded-2xl bg-white/5 backdrop-blur-sm">
          <div className="text-white/50 text-xs">Visibility</div>
          <div className="text-white text-lg font-light">10 km</div>
        </div>
      </div>
    </div>
  );
}