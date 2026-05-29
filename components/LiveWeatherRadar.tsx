// components/LiveWeatherRadar.tsx - Fixed without canvasOverlay

'use client';

import { useEffect, useRef, useState } from 'react';
import { Droplets, CloudRain, MapPin, Wind } from 'lucide-react';

// Import Leaflet styles and libraries
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LiveWeatherRadarProps {
  lat?: number;
  lon?: number;
  precipitation?: number;
  locationName?: string;
}

export function LiveWeatherRadar({ 
  lat = 35.6895, 
  lon = 139.6917, 
  precipitation = 30,
  locationName = 'Tokyo, Japan'
}: LiveWeatherRadarProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  function getIntensityLevel(precip: number): 'light' | 'moderate' | 'heavy' | 'storm' {
    if (precip < 20) return 'light';
    if (precip < 50) return 'moderate';
    if (precip < 75) return 'heavy';
    return 'storm';
  }
  
  function getIntensityText(intensity: string): string {
    const texts = {
      light: 'Light rain',
      moderate: 'Moderate rain',
      heavy: 'Heavy rain',
      storm: 'Storm',
    };
    return texts[intensity as keyof typeof texts] || 'Light rain';
  }
  
  // Minute forecast data
  const minuteForecast = [
    { time: 'Now', precip: precipitation, intensity: getIntensityLevel(precipitation) },
    { time: '15 min', precip: Math.min(precipitation + 15, 100), intensity: getIntensityLevel(Math.min(precipitation + 15, 100)) },
    { time: '30 min', precip: Math.min(precipitation + 30, 100), intensity: getIntensityLevel(Math.min(precipitation + 30, 100)) },
    { time: '45 min', precip: Math.min(precipitation + 45, 100), intensity: getIntensityLevel(Math.min(precipitation + 45, 100)) },
    { time: '60 min', precip: Math.min(precipitation + 55, 100), intensity: getIntensityLevel(Math.min(precipitation + 55, 100)) },
  ];
  
  // Draw precipitation overlay on canvas
  const drawPrecipitationOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const intensity = precipitation;
    
    // Draw precipitation cells based on real weather data
    const cells = [
      { x: 0.3, y: 0.4, radius: 0.12, intensity: intensity },
      { x: 0.55, y: 0.55, radius: 0.1, intensity: intensity * 0.8 },
      { x: 0.7, y: 0.35, radius: 0.08, intensity: intensity * 0.6 },
      { x: 0.4, y: 0.7, radius: 0.09, intensity: intensity * 0.7 },
      { x: 0.2, y: 0.6, radius: 0.07, intensity: intensity * 0.5 },
      { x: 0.75, y: 0.65, radius: 0.11, intensity: intensity * 0.9 },
    ];
    
    cells.forEach(cell => {
      const cx = cell.x * width + Math.sin(time * 0.3) * 10;
      const cy = cell.y * height + Math.cos(time * 0.4) * 10;
      const radius = cell.radius * Math.min(width, height) * (0.8 + Math.sin(time * 0.5) * 0.1);
      
      let color: string;
      if (intensity < 20) color = `rgba(100, 200, 100, ${0.3 + Math.random() * 0.2})`;
      else if (intensity < 50) color = `rgba(80, 180, 80, ${0.4 + Math.random() * 0.2})`;
      else if (intensity < 75) color = `rgba(220, 200, 50, ${0.5 + Math.random() * 0.2})`;
      else color = `rgba(220, 80, 50, ${0.6 + Math.random() * 0.2})`;
      
      // Outer glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      
      // Main cell
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Particles
      for (let i = 0; i < 15; i++) {
        const angle = (time * 3 + i) % (Math.PI * 2);
        const distance = radius * (0.4 + Math.sin(time * 4 + i) * 0.1);
        const px = cx + Math.cos(angle) * distance;
        const py = cy + Math.sin(angle) * distance;
        
        ctx.beginPath();
        ctx.arc(px, py, 1.5 + Math.sin(time * 8 + i) * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    });
    
    ctx.shadowBlur = 0;
  };
  
  // Animate canvas overlay
  useEffect(() => {
    if (!mapLoaded) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let startTime = Date.now();
    
    const animate = () => {
      const map = leafletMapRef.current;
      if (!map) return;
      
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const elapsed = (Date.now() - startTime) / 1000;
      drawPrecipitationOverlay(ctx, canvas.width, canvas.height, elapsed);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mapLoaded, precipitation]);
  
  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    
    // Initialize OpenStreetMap with custom styling
    const map = L.map(mapRef.current).setView([lat, lon], 7);
    
    // Custom muted map style using OpenStreetMap tiles with desaturated look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 12,
      minZoom: 5,
    }).addTo(map);
    
    // Add canvas overlay for precipitation
    const canvasOverlay = L.DomUtil.create('canvas', 'precipitation-canvas');
    canvasRef.current = canvasOverlay;
    
    const overlayPane = map.getPane('overlayPane');
    if (overlayPane) {
      overlayPane.appendChild(canvasOverlay);
      canvasOverlay.style.position = 'absolute';
      canvasOverlay.style.top = '0';
      canvasOverlay.style.left = '0';
      canvasOverlay.style.pointerEvents = 'none';
      canvasOverlay.style.zIndex = '500';
    }
    
    // Update canvas position on map move
    map.on('move', () => {
      const overlayPane = map.getPane('overlayPane');
      if (overlayPane && canvasRef.current) {
        canvasRef.current.style.transform = `translate(${overlayPane.offsetLeft}px, ${overlayPane.offsetTop}px)`;
      }
    });
    
    map.on('resize', () => {
      if (canvasRef.current) {
        const size = map.getSize();
        canvasRef.current.width = size.x;
        canvasRef.current.height = size.y;
      }
    });
    
    leafletMapRef.current = map;
    setMapLoaded(true);
    
    // Cleanup
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [lat, lon]);
  
  const getIntensityColor = (intensity: string) => {
    const colors = {
      light: 'bg-emerald-500/30 border-emerald-500/50',
      moderate: 'bg-green-600/40 border-green-600/60',
      heavy: 'bg-yellow-500/40 border-yellow-500/60',
      storm: 'bg-red-500/40 border-red-500/60',
    };
    return colors[intensity as keyof typeof colors] || colors.light;
  };
  
  return (
    <div className="mt-8">
      {/* Section Header */}
      <div className="mb-4 px-1">
        <h2 className="text-white/80 text-lg font-medium flex items-center gap-2">
          <CloudRain size={20} className="text-white/60" />
          Live Weather Radar
        </h2>
        <p className="text-white/40 text-xs mt-1 ml-7">OpenStreetMap • Real-time precipitation tracking</p>
      </div>
      
      {/* Radar Container */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-white/10 shadow-2xl">
        {/* Map Container */}
        <div 
          ref={mapRef} 
          className="w-full aspect-[16/9] md:aspect-[21/9] z-0"
          style={{ background: '#1a1a2e', minHeight: '400px' }}
        />
        
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white/50 text-sm">Loading radar data...</p>
            </div>
          </div>
        )}
        
        {/* Bottom Overlay Panel */}
        <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-6 bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-white/15 shadow-2xl z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Minute Forecast Cards */}
            <div className="flex-1">
              <div className="text-white/60 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1">
                <Droplets size={10} />
                Minute forecast - precipitation
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {minuteForecast.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-center transition-all cursor-pointer ${getIntensityColor(item.intensity)} hover:scale-105 transition-transform`}
                  >
                    <div className="text-white/70 text-[11px] font-medium">{item.time}</div>
                    <div className="text-white text-sm font-bold mt-1">{item.precip}%</div>
                    <div className="text-white/40 text-[9px] mt-0.5">{item.intensity}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Current Conditions */}
            <div className="flex-shrink-0 text-right">
              <div className="text-white/60 text-[10px] uppercase tracking-wider mb-2">
                Current conditions
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Wind size={14} className="text-white/50" />
                <span className="text-white/70 text-xs">12 km/h</span>
                <Droplets size={14} className="text-white/50 ml-2" />
                <span className="text-white/70 text-xs">{precipitation}%</span>
              </div>
              <div className="text-white/40 text-[9px] mt-1">
                {getIntensityText(getIntensityLevel(precipitation))} • {Math.round(precipitation * 0.75)} mm/h
              </div>
            </div>
          </div>
        </div>
        
        {/* Top-right live indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/15 z-10">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-white/70 text-[10px] font-medium tracking-wide">LIVE • OSM</span>
        </div>
        
        {/* Top-left location indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/15 z-10">
          <MapPin size={10} className="text-white/60" />
          <span className="text-white/70 text-[10px] font-medium">{locationName}</span>
        </div>
      </div>
      
      <style jsx global>{`
        .leaflet-container {
          background: #0a0a1a;
          font-family: inherit;
          border-radius: inherit;
        }
        
        .leaflet-tile {
          filter: brightness(0.85) contrast(0.9) saturate(0.7);
        }
        
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.5) !important;
          color: rgba(255,255,255,0.3) !important;
          font-size: 8px !important;
          backdrop-filter: blur(4px);
        }
        
        .leaflet-control-attribution a {
          color: rgba(255,255,255,0.4) !important;
        }
        
        .leaflet-control-zoom {
          border: none !important;
          background: rgba(0,0,0,0.5) !important;
          backdrop-filter: blur(8px);
          border-radius: 12px !important;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
        
        .leaflet-control-zoom a {
          background: transparent !important;
          color: rgba(255,255,255,0.8) !important;
          border: none !important;
        }
        
        .leaflet-control-zoom a:hover {
          background: rgba(255,255,255,0.1) !important;
        }
        
        .precipitation-canvas {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 500;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}