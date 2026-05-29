'use client';

interface ImmersiveRadarProps {
  location: string;
}

export function ImmersiveRadar({ location }: ImmersiveRadarProps) {
  return (
    <div className="py-8 px-6">
      <h3 className="text-white/50 text-sm font-light tracking-wider mb-4">
        RADAR
      </h3>
      
      <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
        {/* Immersive radar visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 rounded-full border border-white/20 animate-pulse-slow" />
            <div className="mt-4 text-white/40 text-sm">{location} region</div>
          </div>
        </div>
        
        {/* Soft gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        
        {/* Floating label */}
        <div className="absolute bottom-4 left-4 text-white/30 text-xs">
          Live radar • 30 min loop
        </div>
      </div>
    </div>
  );
}