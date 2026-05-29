'use client';

import { CurrentConditions } from '@/types/weather';

interface CinematicHeroProps {
  data: CurrentConditions;
  location: string;
}

export function CinematicHero({ data, location }: CinematicHeroProps) {
  return (
    <div className="relative px-6 pt-12 pb-8">
      {/* Floating - asymmetric positioning */}
      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Oversized temperature - dramatic typography */}
        <div className="text-center md:text-left md:-ml-8">
          <div className="text-[120px] md:text-[160px] lg:text-[200px] font-light tracking-tighter leading-none text-white drop-shadow-2xl">
            {Math.round(data.temp)}<span className="text-5xl md:text-6xl align-top">°</span>
          </div>
          
          <div className="mt-2 text-white/50 text-base tracking-wide">
            feels like {Math.round(data.feelslike)}°
          </div>
        </div>
        
        {/* Condition and high/low - floating right on desktop */}
        <div className="mt-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div className="text-white/80 text-xl md:text-2xl font-light tracking-wide">
            {data.conditions}
          </div>
          
          <div className="flex gap-6 text-white/60 text-base">
            <div>H {Math.round(data.temp)}°</div>
            <div>L {Math.round(data.temp - 5)}°</div>
          </div>
        </div>
        
        {/* Location - minimal, floating */}
        <div className="mt-12 text-white/40 text-sm tracking-wider uppercase border-t border-white/10 pt-6 inline-block">
          {location}
        </div>
      </div>
      
      {/* Atmospheric background element - soft glow behind temperature */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
    </div>
  );
}