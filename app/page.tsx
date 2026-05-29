// app/page.tsx - Final fixed version

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, MapPin, Wind, Droplets, Eye, Gauge, Sun, Thermometer,
  ChevronRight, ChevronLeft, Cloud, Moon, Activity, Sunrise, Sunset,
  Calendar, ArrowUp, ArrowDown
} from 'lucide-react';
import { fetchWeather } from '@/lib/weather';
import { WeatherData } from '@/types/weather';
import WeatherCanvas from '@/components/WeatherCanvas';
import { InteractiveWeatherMapWrapper } from '@/components/InteractiveWeatherMapWrapper';

const getWeatherCondition = (conditions: string): string => {
  const cond = conditions.toLowerCase();
  if (cond.includes('rain') || cond.includes('drizzle')) return 'rain';
  if (cond.includes('snow')) return 'snow';
  if (cond.includes('cloud')) return 'clouds';
  return 'clear';
};

const getPrecipitationIntensity = (humidity: number, conditions: string): number => {
  const cond = conditions.toLowerCase();
  if (cond.includes('rain')) return 70;
  if (cond.includes('drizzle')) return 40;
  if (humidity > 80) return 50;
  if (humidity > 60) return 25;
  return 10;
};

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHourIndex, setSelectedHourIndex] = useState(0);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [needsScroll, setNeedsScroll] = useState(false);
  const [cardWidth, setCardWidth] = useState(94);
  const [isClient, setIsClient] = useState(false);
  const [hourlyData, setHourlyData] = useState<any[]>([]);

  // Map synchronized state
  const [mapLat, setMapLat] = useState(3.5952);
  const [mapLon, setMapLon] = useState(98.6722);
  const [mapLocationName, setMapLocationName] = useState('Medan');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const weeklyScrollRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const cardsWrapperRef = useRef<HTMLDivElement>(null);
  const cardsRowRef = useRef<HTMLDivElement>(null);

  // Mark as client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);

  const saveLocation = useCallback((location: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastWeatherLocation', location);
    }
  }, []);

  const getLastLocation = useCallback((): string => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lastWeatherLocation');
      if (saved) return saved;
    }
    return 'Medan, ID';
  }, []);

  const loadWeather = useCallback(async (location: string, updateMap: boolean = true) => {
    setLoading(true);
    setError(null);
    const data = await fetchWeather(location);

    if (data && data.currentConditions && data.days) {
      setWeather(data);
      saveLocation(location);

      if (updateMap && location.includes(',')) {
        const coords = location.split(',');
        if (coords.length === 2) {
          const lat = parseFloat(coords[0]);
          const lon = parseFloat(coords[1]);
          if (!isNaN(lat) && !isNaN(lon)) {
            setMapLat(lat);
            setMapLon(lon);
            setMapLocationName(data.address.split(',')[0]);
          }
        }
      } else if (updateMap) {
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
          );
          const geoData = await geoRes.json();
          if (geoData && geoData[0]) {
            setMapLat(parseFloat(geoData[0].lat));
            setMapLon(parseFloat(geoData[0].lon));
            setMapLocationName(data.address.split(',')[0]);
          }
        } catch (err) {
          console.error('Geocoding failed:', err);
        }
      }
    } else {
      setError(`"${location}" not found. Try "Medan, ID" or "Jakarta, ID"`);
    }

    setLoading(false);
  }, [saveLocation]);

  const handleMapLocationChange = useCallback(async (lat: number, lon: number, name: string) => {
    setMapLat(lat);
    setMapLon(lon);
    setMapLocationName(name);

    setLoading(true);
    const data = await fetchWeather(`${lat},${lon}`);
    if (data && data.currentConditions && data.days) {
      setWeather(data);
      saveLocation(`${lat},${lon}`);
    } else {
      setError('Could not get weather for selected location');
    }
    setLoading(false);
  }, [saveLocation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      loadWeather(searchQuery.trim(), true);
      setSearchQuery('');
    }
  };

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationString = `${latitude},${longitude}`;
        const data = await fetchWeather(locationString);
        if (data && data.currentConditions && data.days) {
          setWeather(data);
          saveLocation(locationString);
          setMapLat(latitude);
          setMapLon(longitude);
          setMapLocationName(data.address.split(',')[0]);
        } else {
          setError('Could not get weather for your location');
        }
        setLoading(false);
      },
      () => {
        setError('Unable to get your location');
        setLoading(false);
      }
    );
  }, [saveLocation]);

  useEffect(() => {
    const lastLocation = getLastLocation();
    loadWeather(lastLocation, true);
  }, [loadWeather, getLastLocation]);

  const convertTemp = (tempC: number): number => {
    if (temperatureUnit === 'F') return Math.round(tempC * 9 / 5 + 32);
    return tempC;
  };

  const condition = weather
    ? getWeatherCondition(weather.currentConditions.conditions)
    : 'clear';

  const precipitation = weather
    ? getPrecipitationIntensity(weather.currentConditions.humidity, weather.currentConditions.conditions)
    : 10;

  // Generate 24-hour data ONLY on client (no hydration mismatch)
  useEffect(() => {
    if (!isClient || !weather) return;

    const generate24HourData = () => {
      const hours = [];
      const now = new Date();
      const currentHour = now.getHours();
      const baseTemp = weather?.currentConditions.temp || 28;

      for (let i = 0; i < 24; i++) {
        const hourTime = (currentHour + i) % 24;
        const isNextDay = currentHour + i >= 24;
        let timeLabel = '';
        if (hourTime === 0) timeLabel = '12 AM';
        else if (hourTime < 12) timeLabel = `${hourTime} AM`;
        else if (hourTime === 12) timeLabel = '12 PM';
        else timeLabel = `${hourTime - 12} PM`;

        let tempVariation = 0;
        if (hourTime >= 6 && hourTime <= 13) tempVariation = (hourTime - 6) * 1.2;
        else if (hourTime > 13 && hourTime <= 18) tempVariation = 9 - (hourTime - 13) * 0.8;
        else if (hourTime > 18 && hourTime <= 23) tempVariation = 5 - (hourTime - 18) * 0.7;
        else tempVariation = -2 - (6 - hourTime) * 0.5;

        let iconType = '';
        if (hourTime >= 20 || hourTime <= 5) iconType = 'moon';
        else iconType = 'sun';

        const rainProb = Math.min(80, Math.max(5, Math.floor((hourTime + (weather?.currentConditions.humidity || 60)) / 2) % 45));

        hours.push({
          time: timeLabel,
          temp: Math.round(baseTemp + tempVariation),
          rain: rainProb,
          iconType: iconType,
          isNextDay: isNextDay,
          hourValue: hourTime,
        });
      }
      return hours;
    };

    setHourlyData(generate24HourData());
  }, [isClient, weather]);

  const CARD_GAP = 12;
  const MIN_CARD_WIDTH = 88;
  const MAX_CARD_WIDTH = 110;

  // Calculate responsive layout
  useEffect(() => {
    if (!isClient || hourlyData.length === 0) return;

    const updateLayout = () => {
      if (!cardsWrapperRef.current) return;

      const containerWidth = cardsWrapperRef.current.clientWidth;
      const totalCards = hourlyData.length;
      const totalGapWidth = (totalCards - 1) * CARD_GAP;
      const availableForCards = containerWidth - totalGapWidth;
      const idealCardWidth = availableForCards / totalCards;

      if (idealCardWidth >= MIN_CARD_WIDTH && idealCardWidth <= MAX_CARD_WIDTH) {
        setNeedsScroll(false);
        setCardWidth(idealCardWidth);
      } else if (idealCardWidth > MAX_CARD_WIDTH) {
        setNeedsScroll(false);
        setCardWidth(MAX_CARD_WIDTH);
      } else {
        setNeedsScroll(true);
        setCardWidth(MIN_CARD_WIDTH);
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [hourlyData.length, isClient]);

  const totalContentWidth = needsScroll
    ? hourlyData.length * (cardWidth + CARD_GAP)
    : '100%';

  const CHART_HEIGHT = 220;
  const CHART_TOP_PADDING = 20;
  const CHART_BOTTOM_PADDING = 15;
  const CHART_DRAW_HEIGHT = CHART_HEIGHT - CHART_TOP_PADDING - CHART_BOTTOM_PADDING;

  const temps = hourlyData.map(h => h.temp);
  const minTemp = temps.length > 0 ? Math.min(...temps) : 0;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 30;
  const tempRange = maxTemp - minTemp;

  const getChartPoints = () => {
    if (hourlyData.length === 0) return [];
    const step = cardWidth + CARD_GAP;
    return hourlyData.map((hour, idx) => {
      const x = idx * step + (cardWidth / 2);
      const normalizedY = tempRange === 0 ? 0.5 : 1 - (hour.temp - minTemp) / tempRange;
      const y = CHART_TOP_PADDING + normalizedY * CHART_DRAW_HEIGHT;
      return { x, y, idx, temp: hour.temp, hour: hour.time, rain: hour.rain };
    });
  };

  const getSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) * 0.5;
      const cp1y = p0.y;
      const cp2x = p1.x - (p1.x - p0.x) * 0.5;
      const cp2y = p1.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const chartPoints = getChartPoints();
  const smoothChartPath = getSmoothPath(chartPoints);

  // Weekly forecast
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyForecast = weather?.days.slice(1, 8).map((day, idx) => ({
    day: shortDays[new Date(day.datetime).getDay()] || 'Mon',
    temp: convertTemp(day.temp),
    tempMax: convertTemp(day.tempmax),
    tempMin: convertTemp(day.tempmin),
    icon: day.icon,
    isToday: idx === 0,
  })) || [];

  const currentTemp = weather ? convertTemp(weather.currentConditions.temp) : 28;
  const feelsLike = weather ? convertTemp(weather.currentConditions.feelslike) : 26;

  const scrollDirection = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current && needsScroll) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handlePointHover = (idx: number) => {
    setHoveredPointIndex(idx);
    setSelectedHourIndex(idx);

    if (scrollContainerRef.current && needsScroll) {
      const step = cardWidth + CARD_GAP;
      const scrollTo = idx * step - scrollContainerRef.current.clientWidth / 2 + cardWidth / 2;
      scrollContainerRef.current.scrollTo({ left: Math.max(0, scrollTo), behavior: 'smooth' });
    }
  };

  const getWeatherIcon = (iconType: string, size = 24) => {
    if (iconType === 'sun') return <Sun size={size} className="text-yellow-300/90" />;
    return <Moon size={size} className="text-white/70" />;
  };

  const getWeatherIconSmall = (iconType: string) => {
    if (iconType === 'sun') return <Sun size={14} className="text-yellow-300/80" />;
    return <Moon size={12} className="text-white/60" />;
  };

  // Loading state untuk client-only content
  if (!isClient) {
    return (
      <div className="relative z-10 min-h-screen p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/50">Loading forecast data...</p>
        </div>
      </div>
    );
  }

  if (loading && !weather) {
    return (
      <div className="relative z-10 min-h-screen p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/50">Fetching weather data...</p>
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="relative z-10 min-h-screen p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => loadWeather('Medan, ID', true)}
            className="px-4 py-2 bg-white/20 rounded-xl text-white hover:bg-white/30 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!weather || hourlyData.length === 0) {
    return (
      <div className="relative z-10 min-h-screen p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/50">Loading forecast data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <WeatherCanvas condition={condition} intensity={precipitation} lat={mapLat} lon={mapLon} />

      <div className="relative z-10 min-h-screen p-4 md:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">

          {/* HEADER */}
          <header className="glass-card rounded-2xl px-5 py-3 mb-6 backdrop-blur-xl bg-white/10 border border-white/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-light text-white tracking-tight">Weather forecast</h1>
                <div className="flex gap-1 bg-white/10 rounded-full p-0.5">
                  <button onClick={() => setTemperatureUnit('C')} className={`px-3 py-1 rounded-full text-sm transition-all ${temperatureUnit === 'C' ? 'bg-white/30 text-white' : 'text-white/50'}`}>°C</button>
                  <button onClick={() => setTemperatureUnit('F')} className={`px-3 py-1 rounded-full text-sm transition-all ${temperatureUnit === 'F' ? 'bg-white/30 text-white' : 'text-white/50'}`}>°F</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-white/60" />
                <span className="text-white/80 text-sm">{weather?.address || mapLocationName}</span>
                <div className="w-px h-4 bg-white/20 mx-2" />
                <Calendar size={14} className="text-white/60" />
                <span className="text-white/70 text-sm">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              <form onSubmit={handleSearch} className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city..."
                  className="pl-10 pr-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/40 w-full lg:w-56"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-white/20 rounded-lg text-white/60 text-xs">
                  Go
                </button>
              </form>
            </div>
          </header>

          {/* WEEKLY TABS */}
          <div className="mb-6 overflow-x-auto scrollbar-hide" ref={weeklyScrollRef}>
            <div className="flex gap-2 min-w-max pb-1">
              {weeklyForecast.map((day, idx) => (
                <div key={idx} className={`flex-shrink-0 px-5 py-2.5 rounded-full transition-all flex items-center gap-2 ${day.isToday ? 'bg-orange-500/80 text-white shadow-lg' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>
                  {getWeatherIconSmall(day.icon.includes('night') ? 'moon' : 'sun')}
                  <span className="text-sm font-medium">{day.day}</span>
                  <span className="text-sm">{Math.round(day.temp)}°</span>
                  <div className="flex items-center gap-0.5 text-[10px] text-white/50 ml-1">
                    <ArrowUp size={10} />{Math.round(day.tempMax)}° <ArrowDown size={10} className="ml-1" />{Math.round(day.tempMin)}°
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT COLUMN */}
            <div className="lg:col-span-5">
              <div className="glass-card rounded-3xl overflow-hidden backdrop-blur-xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 h-full flex flex-col">
                <div className="p-5 pb-0 flex justify-between items-center">
                  <div className="flex items-center gap-3 text-white/40 text-xs">
                    <div className="flex items-center gap-1"><Sunrise size={12} /><span>{weather?.currentConditions.sunrise || '6:42 AM'}</span></div>
                    <div className="flex items-center gap-1"><Sunset size={12} /><span>{weather?.currentConditions.sunset || '5:18 PM'}</span></div>
                  </div>
                  <div className="text-white/40 text-xs">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="flex-1 flex flex-col justify-center px-6 py-8">
                  <div className="text-center">
                    <div className="text-8xl md:text-9xl font-light text-white tracking-tighter leading-none">{currentTemp}<span className="text-4xl align-top">°{temperatureUnit}</span></div>
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <div className="text-white/80 text-xl font-light">{weather?.currentConditions.conditions || 'Partly Cloudy'}</div>
                      {getWeatherIcon(weather?.currentConditions.icon?.includes('night') ? 'moon' : 'sun', 28)}
                    </div>
                    <div className="text-white/40 text-sm mt-2">Feels like {feelsLike}°{temperatureUnit}</div>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3 border-t border-white/10">
                  <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between"><div className="flex items-center gap-2 text-white/50 text-xs"><Wind size={14} /><span>Wind</span></div><div className="text-white font-medium text-sm">{weather?.currentConditions.windspeed || 12} km/h</div></div>
                  <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between"><div className="flex items-center gap-2 text-white/50 text-xs"><Droplets size={14} /><span>Humidity</span></div><div className="text-white font-medium text-sm">{weather?.currentConditions.humidity || 65}%</div></div>
                  <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between"><div className="flex items-center gap-2 text-white/50 text-xs"><Eye size={14} /><span>Visibility</span></div><div className="text-white font-medium text-sm">10 km</div></div>
                  <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between"><div className="flex items-center gap-2 text-white/50 text-xs"><Gauge size={14} /><span>Pressure</span></div><div className="text-white font-medium text-sm">1013 hPa</div></div>
                  <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between"><div className="flex items-center gap-2 text-white/50 text-xs"><Sun size={14} /><span>UV Index</span></div><div className="text-white font-medium text-sm">5 Moderate</div></div>
                  <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between"><div className="flex items-center gap-2 text-white/50 text-xs"><Thermometer size={14} /><span>Dew Point</span></div><div className="text-white font-medium text-sm">12°</div></div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-7">
              <div className="glass-card rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 h-full flex flex-col overflow-y-hidden">

                <div className="flex-shrink-0 p-5 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Activity size={18} className="text-white/60" /><h2 className="text-white/80 text-base font-medium">24-Hour Forecast</h2></div>
                  {needsScroll && (
                    <div className="flex gap-1.5">
                      <button onClick={() => scrollDirection('left')} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20"><ChevronLeft size={16} className="text-white/60" /></button>
                      <button onClick={() => scrollDirection('right')} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20"><ChevronRight size={16} className="text-white/60" /></button>
                    </div>
                  )}
                </div>

                {/* CHART */}
                <div className="flex-shrink-0 px-5 pb-1">
                  <div className="relative" style={{ height: CHART_HEIGHT }}>
                    <div
                      ref={chartContainerRef}
                      className={`absolute inset-0 ${needsScroll ? 'overflow-x-auto scrollbar-custom' : 'overflow-x-hidden'}`}
                      onScroll={(e) => {
                        if (scrollContainerRef.current && needsScroll) {
                          scrollContainerRef.current.scrollLeft = e.currentTarget.scrollLeft;
                        }
                      }}
                    >
                      <div style={{ width: needsScroll ? totalContentWidth : '100%', height: CHART_HEIGHT }}>
                        <svg className="w-full h-full" preserveAspectRatio="none">
                          <rect width="100%" height={CHART_HEIGHT} fill="rgba(255,255,255,0.02)" rx="8" />

                          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                            const y = CHART_TOP_PADDING + ratio * CHART_DRAW_HEIGHT;
                            return (
                              <line key={i} x1="0" y1={y} x2="100%" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                            );
                          })}

                          <path
                            d={smoothChartPath}
                            fill="none"
                            stroke="rgba(251, 146, 60, 0.9)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          <path
                            d={smoothChartPath}
                            fill="none"
                            stroke="rgba(251, 146, 60, 0.2)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          <polygon
                            points={`${chartPoints.map(p => `${p.x},${p.y}`).join(' ')} ${chartPoints[chartPoints.length - 1]?.x || 0},${CHART_HEIGHT} ${chartPoints[0]?.x || 0},${CHART_HEIGHT}`}
                            fill="url(#tempGradient)"
                            opacity="0.15"
                          />

                          {chartPoints.map((point, idx) => (
                            <circle
                              key={idx}
                              cx={point.x}
                              cy={point.y}
                              r="14"
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => handlePointHover(idx)}
                              onMouseLeave={() => setHoveredPointIndex(null)}
                            />
                          ))}

                          {hoveredPointIndex !== null && chartPoints[hoveredPointIndex] && (
                            <circle
                              cx={chartPoints[hoveredPointIndex].x}
                              cy={chartPoints[hoveredPointIndex].y}
                              r="3.5"
                              fill="rgba(251, 146, 60, 1)"
                              stroke="rgba(255,255,255,0.8)"
                              strokeWidth="1.5"
                            />
                          )}

                          <circle
                            cx={chartPoints[selectedHourIndex]?.x || 0}
                            cy={chartPoints[selectedHourIndex]?.y || 0}
                            r="4"
                            fill="rgba(251, 146, 60, 1)"
                            stroke="rgba(255,255,255,0.9)"
                            strokeWidth="2"
                          />

                          {chartPoints[selectedHourIndex] && (
                            <circle
                              cx={chartPoints[selectedHourIndex].x}
                              cy={chartPoints[selectedHourIndex].y}
                              r="8"
                              fill="none"
                              stroke="rgba(251, 146, 60, 0.4)"
                              strokeWidth="1.5"
                            >
                              <animate attributeName="r" from="8" to="14" dur="1.5s" repeatCount="indefinite" />
                              <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                          )}

                          <defs>
                            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(251, 146, 60, 0.4)" />
                              <stop offset="100%" stopColor="rgba(251, 146, 60, 0)" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>

                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900/40 to-transparent pointer-events-none rounded-l-2xl" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900/40 to-transparent pointer-events-none rounded-r-2xl" />
                  </div>
                </div>

                {/* CARDS */}
                <div className="flex-1 flex flex-col justify-end overflow-y-hidden">
                  <div
                    ref={cardsWrapperRef}
                    className="px-5 pb-4 pt-1"
                  >
                    <div
                      ref={scrollContainerRef}
                      className={`flex gap-3 ${needsScroll ? 'overflow-x-auto scrollbar-custom' : 'overflow-x-hidden'}`}
                      style={{ scrollBehavior: 'smooth' }}
                      onScroll={(e) => {
                        if (chartContainerRef.current && needsScroll) {
                          chartContainerRef.current.scrollLeft = e.currentTarget.scrollLeft;
                        }
                      }}
                    >
                      <div
                        ref={cardsRowRef}
                        className={`flex gap-3 ${!needsScroll ? 'w-full' : ''}`}
                        style={{ minWidth: needsScroll ? totalContentWidth : '100%' }}
                      >
                        {hourlyData.map((hour, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setSelectedHourIndex(idx);
                              setHoveredPointIndex(null);
                            }}
                            className={`flex-shrink-0 rounded-xl text-center transition-all snap-start cursor-pointer ${selectedHourIndex === idx
                                ? 'bg-orange-500/50 ring-1 ring-orange-400/60 shadow-lg scale-105'
                                : 'bg-white/10 hover:bg-white/20'
                              }`}
                            style={{
                              width: !needsScroll ? `${100 / hourlyData.length}%` : cardWidth,
                              padding: '12px 8px'
                            }}
                          >
                            <div className="text-white/50 text-[11px] font-medium">{hour.time}{hour.isNextDay && <span className="text-[8px] ml-0.5 text-white/40">+1</span>}</div>
                            <div className="my-2 flex justify-center">{getWeatherIcon(hour.iconType, 28)}</div>
                            <div className="text-white/50 text-[10px] flex items-center justify-center gap-1">
                              <Droplets size={8} />
                              <span suppressHydrationWarning>{hour.rain}%</span>
                            </div>
                            <div className="text-white font-semibold text-base mt-1">{Math.round(convertTemp(hour.temp))}°</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="flex-shrink-0 px-5 pb-5 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-white/50 text-xs">
                      <span className="flex items-center gap-1"><Thermometer size={12} /> Range: {Math.round(minTemp)}° - {Math.round(maxTemp)}°{temperatureUnit}</span>
                      <span className="flex items-center gap-1">
                        {getWeatherIcon(hourlyData[selectedHourIndex]?.iconType || 'sun', 12)}
                        {hourlyData[selectedHourIndex]?.time} • {hourlyData[selectedHourIndex]?.rain}% rain
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* INTERACTIVE WEATHER MAP */}
          <InteractiveWeatherMapWrapper
            lat={mapLat}
            lon={mapLon}
            locationName={mapLocationName}
            onLocationChange={handleMapLocationChange}
            precipitation={precipitation}
            windSpeed={weather?.currentConditions.windspeed || 12}
            windDirection={weather?.currentConditions.winddir || 90}
            temperature={weather?.currentConditions.temp || 28}
          />

          <div className="h-6" />
        </div>
      </div>

      <style jsx global>{`
        .glass-card { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-custom::-webkit-scrollbar { height: 4px; }
        .scrollbar-custom::-webkit-scrollbar-track { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .scrollbar-custom::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border-radius: 10px; }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
        .scrollbar-custom { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.25) rgba(255,255,255,0.08); }
        
        body {
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        body::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}