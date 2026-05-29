// components/InteractiveWeatherMap.tsx - Final fixed version

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Navigation, Loader2, Search, X, Wind, Droplets } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface InteractiveWeatherMapProps {
  lat: number;
  lon: number;
  locationName: string;
  onLocationChange: (lat: number, lon: number, name: string) => void;
  precipitation?: number;
  windSpeed?: number;
  windDirection?: number;
  temperature?: number;
}

export function InteractiveWeatherMap({ 
  lat, 
  lon, 
  locationName, 
  onLocationChange,
  precipitation = 30,
  windSpeed = 12,
}: InteractiveWeatherMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  
  // Stabilkan callback dengan ref
  const onLocationChangeRef = useRef(onLocationChange);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getRadarColor = () => {
    if (precipitation < 20) return '#4ade80';
    if (precipitation < 50) return '#22c55e';
    if (precipitation < 75) return '#eab308';
    return '#ef4444';
  };

  const toggleRadar = async () => {
    if (!leafletMapRef.current) return;
    
    if (radarLayerRef.current) {
      leafletMapRef.current.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
      setShowRadar(false);
      return;
    }
    
    try {
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await response.json();
      if (data.radar && data.radar.past && data.radar.past.length > 0) {
        const latestFrame = data.radar.past[data.radar.past.length - 1];
        const radarUrl = `https://tilecache.rainviewer.com${latestFrame.path}/512/{z}/{x}/{y}/2/1_1.png`;
        
        const radarLayer = L.tileLayer(radarUrl, {
          opacity: 0.7,
          className: 'radar-layer',
          attribution: '&copy; RainViewer',
        }).addTo(leafletMapRef.current);
        
        radarLayerRef.current = radarLayer;
        setShowRadar(true);
      }
    } catch (error) {
      console.error('Failed to load radar:', error);
    }
  };

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    let cityName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.address) {
          cityName = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state || cityName;
        }
      }
    } catch (error) {
      console.warn('Reverse geocoding failed, using coordinates:', error);
    }
    
    return cityName;
  };

  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    }
    setIsSearching(false);
  };

  const handleSelectLocation = (result: any) => {
    const newLat = parseFloat(result.lat);
    const newLon = parseFloat(result.lon);
    const displayName = result.display_name.split(',')[0];
    
    setSearchQuery('');
    setSearchResults([]);
    onLocationChangeRef.current(newLat, newLon, displayName);
  };

  const handleGetUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const cityName = await reverseGeocode(latitude, longitude);
        onLocationChangeRef.current(latitude, longitude, cityName);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please check permissions.');
      }
    );
  };

  // Initialize map
  useEffect(() => {
    if (!isClient || !mapRef.current || leafletMapRef.current) return;

    const map = L.map(mapRef.current).setView([lat, lon], 12);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 1,
    }).addTo(map);
    
    // Click handler untuk dapatkan nama kota dari koordinat
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      const cityName = await reverseGeocode(lat, lng);
      onLocationChangeRef.current(lat, lng, cityName);
    });
    
    leafletMapRef.current = map;
  }, [isClient, lat, lon]);

  // Update marker when location changes
  useEffect(() => {
    if (!leafletMapRef.current || !isClient) return;
    
    const map = leafletMapRef.current;
    map.setView([lat, lon], 12);
    
    if (markerRef.current) markerRef.current.remove();
    if (circleRef.current) circleRef.current.remove();
    
    const customIcon = L.divIcon({
      html: `<div style="width:40px;height:40px;position:relative;cursor:pointer;">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3" fill="white" stroke="#f97316"/>
        </svg>
        <div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);background:#f97316;color:white;font-size:10px;padding:2px 6px;border-radius:12px;white-space:nowrap;">${locationName.split(',')[0]}</div>
      </div>`,
      className: 'custom-marker',
      iconSize: [40, 50],
      iconAnchor: [20, 45],
    });
    
    markerRef.current = L.marker([lat, lon], { icon: customIcon }).addTo(map);
    
    const radius = 5000;
    circleRef.current = L.circle([lat, lon], {
      radius: radius,
      color: getRadarColor(),
      fillColor: getRadarColor(),
      fillOpacity: 0.15,
      weight: 1,
      opacity: 0.5,
    }).addTo(map);
    
    markerRef.current.bindPopup(`
      <div style="padding:4px;">
        <strong>📍 ${locationName}</strong><br/>
        💧 ${precipitation}% rain<br/>
        🌬️ ${windSpeed} km/h
      </div>
    `);
    
  }, [lat, lon, locationName, precipitation, windSpeed, isClient]);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setStyle({
        color: getRadarColor(),
        fillColor: getRadarColor(),
      });
    }
  }, [precipitation]);

  if (!isClient) {
    return (
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
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-4 px-1">
        <h2 className="text-white/80 text-lg font-medium flex items-center gap-2">
          <MapPin size={20} className="text-white/60" />
          Interactive Weather Map
        </h2>
        <p className="text-white/40 text-xs mt-1 ml-7">Click on map • Search city • Use my location</p>
      </div>

      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        
        {/* Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchLocation(e.target.value);
              }}
              placeholder="Search city (e.g., Medan, Jakarta, Kuala Lumpur)..."
              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-white/50 hover:text-white/80" />
              </button>
            )}
          </div>
          
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-md rounded-xl border border-white/15 overflow-hidden z-20 max-h-60 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectLocation(result)}
                  className="w-full text-left px-4 py-2 text-white/80 text-sm hover:bg-white/10 transition-colors border-b border-white/10 last:border-0"
                >
                  <div className="font-medium">{result.display_name.split(',')[0]}</div>
                  <div className="text-white/40 text-xs truncate">{result.display_name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Radar Toggle Button */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={toggleRadar}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              showRadar 
                ? 'bg-orange-500/80 text-white shadow-lg' 
                : 'bg-black/60 backdrop-blur-md text-white/80 hover:bg-black/80 border border-white/20'
            }`}
          >
            <Droplets size={16} />
            {showRadar ? 'Radar ON' : 'Radar OFF'}
          </button>
        </div>
        
        {/* Wind Info */}
        <div className="absolute bottom-20 right-4 z-20 bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/15">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-cyan-400" />
            <span className="text-white/90 text-sm font-bold">{windSpeed} km/h</span>
          </div>
        </div>
        
        {/* My Location Button */}
        <button
          onClick={handleGetUserLocation}
          className="absolute bottom-4 right-4 z-20 p-3 rounded-full bg-black/60 backdrop-blur-md border border-white/20 hover:bg-black/80 transition-all shadow-lg"
          title="My Location"
        >
          <Navigation className="w-5 h-5 text-white/80" />
        </button>
        
        {/* Location Indicator */}
        <div className="absolute bottom-4 left-4 z-20 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/15">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-white/70 text-[10px] font-medium">📍 {locationName.split(',')[0]}</span>
          </div>
        </div>
        
        {/* Map Container */}
        <div 
          ref={mapRef} 
          className="w-full aspect-[16/9] md:aspect-[21/9] z-0"
          style={{ background: '#1a1a2e', minHeight: '450px' }}
        />
        
        {/* Attribution */}
        <div className="absolute bottom-2 left-2 z-10 text-white/20 text-[8px]">
          CartoDB • OpenStreetMap | Radar: RainViewer
        </div>
      </div>
      
      <style jsx global>{`
        .leaflet-container {
          background: #0a0a1a;
          border-radius: inherit;
        }
        .leaflet-tile {
          filter: brightness(0.7) contrast(0.9) saturate(0.6);
        }
        .leaflet-control-attribution {
          display: none;
        }
        .leaflet-control-zoom {
          border: none !important;
          background: rgba(0,0,0,0.6) !important;
          backdrop-filter: blur(8px);
          border-radius: 12px !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a {
          background: transparent !important;
          color: white !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(255,255,255,0.1) !important;
        }
        .radar-layer {
          opacity: 0.7;
          mix-blend-mode: screen;
        }
        .custom-marker {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
}