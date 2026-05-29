// components/InteractiveWeatherMapWrapper.tsx
'use client';

import dynamic from 'next/dynamic';
import { Loader2, MapPin } from 'lucide-react';

const InteractiveWeatherMapComponent = dynamic(
  () => import('@/components/InteractiveWeatherMap').then(mod => mod.InteractiveWeatherMap),
  {
    ssr: false,
    loading: () => (
      <div className="mt-8">
        <div className="mb-4 px-1">
          <h2 className="text-white/80 text-lg font-medium flex items-center gap-2">
            <MapPin size={20} className="text-white/60" />
            Interactive Weather Map
          </h2>
          <p className="text-white/40 text-xs mt-1 ml-7">Loading map...</p>
        </div>
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-800/30 h-[450px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
          <span className="ml-3 text-white/50">Loading map...</span>
        </div>
      </div>
    ),
  }
);

interface InteractiveWeatherMapWrapperProps {
  lat: number;
  lon: number;
  locationName: string;
  onLocationChange: (lat: number, lon: number, name: string) => void;
  precipitation?: number;
  windSpeed?: number;
  windDirection?: number;
  temperature?: number;
}

export function InteractiveWeatherMapWrapper(props: InteractiveWeatherMapWrapperProps) {
  return <InteractiveWeatherMapComponent {...props} />;
}