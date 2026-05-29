import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get('location');
  
  console.log('=== OPENWEATHER DEBUG ===');
  console.log('API Key exists:', !!API_KEY);
  console.log('API Key (first 5 chars):', API_KEY?.substring(0, 5));
  console.log('Location:', location);
  
  // Validasi API Key
  if (!API_KEY) {
    console.error(' API Key missing from environment variables');
    return NextResponse.json({ 
      error: 'API key not configured. Please add OPENWEATHER_API_KEY to .env.local' 
    }, { status: 500 });
  }
  
  // Validasi location
  if (!location || location.trim() === '') {
    console.error(' Location is empty');
    return NextResponse.json({ error: 'Location required' }, { status: 400 });
  }
  
  try {
    // Handle coordinate format (lat,lon)
    let queryParam = '';
    const trimmedLocation = location.trim();
    
    if (trimmedLocation.includes(',')) {
      const parts = trimmedLocation.split(',');
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lon)) {
          queryParam = `lat=${lat}&lon=${lon}`;
          console.log('Using coordinates:', lat, lon);
        }
      }
    }
    
    // If not coordinates, use city name
    if (!queryParam) {
      queryParam = `q=${encodeURIComponent(trimmedLocation)}`;
      console.log('Using city name:', trimmedLocation);
    }
    
    // Fetch current weather
    const currentUrl = `${BASE_URL}/weather?${queryParam}&units=metric&appid=${API_KEY}`;
    console.log('Fetching URL (key hidden):', currentUrl.replace(API_KEY, 'HIDDEN'));
    
    const currentRes = await fetch(currentUrl);
    console.log('Response status:', currentRes.status);
    
    if (!currentRes.ok) {
      const errorText = await currentRes.text();
      console.error('API Error Response:', errorText);
      
      // Parse error untuk user-friendly message
      let userMessage = 'Location not found';
      if (currentRes.status === 401) userMessage = 'Invalid API key. Please check your OpenWeatherMap API key';
      if (currentRes.status === 429) userMessage = 'API rate limit exceeded. Please try again later';
      if (currentRes.status === 404) userMessage = `"${trimmedLocation}" not found. Try "Tokyo" or "London"`;
      
      return NextResponse.json({ error: userMessage }, { status: currentRes.status });
    }
    
    const currentData = await currentRes.json();
    console.log(' Current weather fetched:', currentData.name);
    
    // Fetch 5-day forecast (optional, bisa gagal tapi tetap return current)
    let forecastData = null;
    try {
      const forecastUrl = `${BASE_URL}/forecast?${queryParam}&units=metric&appid=${API_KEY}`;
      const forecastRes = await fetch(forecastUrl);
      if (forecastRes.ok) {
        forecastData = await forecastRes.json();
        console.log(' Forecast fetched');
      }
    } catch (forecastError) {
      console.warn('Forecast fetch failed, continuing with current only');
    }
    
    // Transform data
    const transformedData = transformWeatherData(currentData, forecastData);
    
    return NextResponse.json(transformedData);
    
  } catch (error) {
    console.error(' Fetch error:', error);
    return NextResponse.json({ error: 'Network error. Please check your connection' }, { status: 500 });
  }
}

function transformWeatherData(current: any, forecast: any): any {
  const transformIcon = (iconCode: string): string => {
    const iconMap: Record<string, string> = {
      '01d': 'clear-day', '01n': 'clear-night',
      '02d': 'cloudy', '02n': 'cloudy',
      '03d': 'cloudy', '03n': 'cloudy',
      '04d': 'cloudy', '04n': 'cloudy',
      '09d': 'rain', '09n': 'rain',
      '10d': 'rain', '10n': 'rain',
      '11d': 'rain', '11n': 'rain',
      '13d': 'snow', '13n': 'snow',
      '50d': 'fog', '50n': 'fog',
    };
    return iconMap[iconCode] || 'clear-day';
  };
  
  // Build forecast days if forecast data available
  let days: any[] = [];
  
  if (forecast && forecast.list) {
    const dailyMap = new Map();
    
    forecast.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          temps: [],
          conditions: [],
          icons: [],
          humidity: [],
          wind: [],
        });
      }
      const day = dailyMap.get(date);
      day.temps.push(item.main.temp);
      day.conditions.push(item.weather[0].description);
      day.icons.push(item.weather[0].icon);
      day.humidity.push(item.main.humidity);
      day.wind.push(item.wind.speed);
    });
    
    days = Array.from(dailyMap.entries()).map(([date, data]) => ({
      datetime: date,
      tempmax: Math.max(...data.temps),
      tempmin: Math.min(...data.temps),
      temp: data.temps[Math.floor(data.temps.length / 2)],
      conditions: data.conditions[0],
      icon: transformIcon(data.icons[0]),
      humidity: Math.round(data.humidity.reduce((a: number, b: number) => a + b, 0) / data.humidity.length),
      windspeed: Math.round(data.wind.reduce((a: number, b: number) => a + b, 0) / data.wind.length),
    })).slice(0, 7);
  }
  
  const sunriseDate = new Date(current.sys.sunrise * 1000);
  const sunsetDate = new Date(current.sys.sunset * 1000);
  
  return {
    address: `${current.name}, ${current.sys.country}`,
    currentConditions: {
      temp: Math.round(current.main.temp),
      feelslike: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      windspeed: Math.round(current.wind.speed),
      conditions: current.weather[0].description,
      icon: transformIcon(current.weather[0].icon),
      datetime: new Date(current.dt * 1000).toISOString(),
      sunrise: sunriseDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      sunset: sunsetDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
    days: days,
  };
}