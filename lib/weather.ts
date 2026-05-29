// lib/weather.ts - Full fixed version with Nominatim geocoding

export interface WeatherData {
  address: string;
  currentConditions: CurrentConditions;
  days: DayForecast[];
}

export interface CurrentConditions {
  temp: number;
  feelslike: number;
  humidity: number;
  windspeed: number;
  winddir?: number;
  conditions: string;
  icon: string;
  datetime: string;
  sunrise: string;
  sunset: string;
}

export interface DayForecast {
  datetime: string;
  tempmax: number;
  tempmin: number;
  temp: number;
  conditions: string;
  icon: string;
  humidity: number;
  windspeed: number;
}

// WMO Weather interpretation codes (WW)
const getWeatherCondition = (code: number): { condition: string; icon: string } => {
  const conditions: Record<number, { condition: string; icon: string }> = {
    0: { condition: 'Clear sky', icon: 'clear-day' },
    1: { condition: 'Mainly clear', icon: 'clear-day' },
    2: { condition: 'Partly cloudy', icon: 'cloudy' },
    3: { condition: 'Overcast', icon: 'cloudy' },
    45: { condition: 'Foggy', icon: 'fog' },
    48: { condition: 'Foggy', icon: 'fog' },
    51: { condition: 'Light drizzle', icon: 'rain' },
    53: { condition: 'Moderate drizzle', icon: 'rain' },
    55: { condition: 'Dense drizzle', icon: 'rain' },
    61: { condition: 'Light rain', icon: 'rain' },
    63: { condition: 'Moderate rain', icon: 'rain' },
    65: { condition: 'Heavy rain', icon: 'rain' },
    71: { condition: 'Light snow', icon: 'snow' },
    73: { condition: 'Moderate snow', icon: 'snow' },
    75: { condition: 'Heavy snow', icon: 'snow' },
    77: { condition: 'Snow grains', icon: 'snow' },
    80: { condition: 'Rain showers', icon: 'rain' },
    81: { condition: 'Rain showers', icon: 'rain' },
    82: { condition: 'Violent rain showers', icon: 'rain' },
    85: { condition: 'Snow showers', icon: 'snow' },
    86: { condition: 'Snow showers', icon: 'snow' },
    95: { condition: 'Thunderstorm', icon: 'rain' },
    96: { condition: 'Thunderstorm with hail', icon: 'rain' },
    99: { condition: 'Thunderstorm with hail', icon: 'rain' },
  };
  return conditions[code] || { condition: 'Unknown', icon: 'clear-day' };
};

export async function fetchWeather(location: string): Promise<WeatherData | null> {
  try {
    let lat: number;
    let lon: number;
    let locationName: string;
    
    if (location.includes(',')) {
      // Already coordinates
      const parts = location.split(',');
      lat = parseFloat(parts[0]);
      lon = parseFloat(parts[1]);
      locationName = `${lat},${lon}`;
    } else {
      // Use Nominatim (OSM) for geocoding - more accurate for local names
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&addressdetails=1`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      
      if (!geoData || geoData.length === 0) {
        throw new Error(`Location "${location}" not found`);
      }
      
      lat = parseFloat(geoData[0].lat);
      lon = parseFloat(geoData[0].lon);
      locationName = geoData[0].display_name.split(',')[0];
    }
    
    // Fetch weather data from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
      `&timezone=auto` +
      `&forecast_days=7`;
    
    const response = await fetch(weatherUrl);
    const data = await response.json();
    
    if (!data || data.error) {
      throw new Error(data?.reason || 'Failed to fetch weather data');
    }
    
    // Parse current weather
    const currentTemp = data.current.temperature_2m;
    const currentHumidity = data.current.relative_humidity_2m;
    const currentFeelsLike = data.current.apparent_temperature;
    const currentWeatherCode = data.current.weather_code;
    const currentWindSpeed = data.current.wind_speed_10m;
    const currentWindDir = data.current.wind_direction_10m || 0;
    const { condition, icon } = getWeatherCondition(currentWeatherCode);
    
    // Parse daily forecast
    const days: DayForecast[] = [];
    const dailyCount = data.daily.time.length;
    
    for (let i = 0; i < dailyCount && i < 7; i++) {
      const weatherCode = data.daily.weather_code[i];
      const tempMax = data.daily.temperature_2m_max[i];
      const tempMin = data.daily.temperature_2m_min[i];
      const { condition: dayCondition, icon: dayIcon } = getWeatherCondition(weatherCode);
      
      days.push({
        datetime: data.daily.time[i],
        tempmax: Math.round(tempMax),
        tempmin: Math.round(tempMin),
        temp: Math.round((tempMax + tempMin) / 2),
        conditions: dayCondition,
        icon: dayIcon,
        humidity: Math.round(currentHumidity),
        windspeed: Math.round(currentWindSpeed),
      });
    }
    
    // Parse sunrise/sunset
    const sunriseTime = data.daily.sunrise?.[0] || new Date().toISOString();
    const sunsetTime = data.daily.sunset?.[0] || new Date().toISOString();
    const sunrise = new Date(sunriseTime);
    const sunset = new Date(sunsetTime);
    
    return {
      address: locationName,
      currentConditions: {
        temp: Math.round(currentTemp),
        feelslike: Math.round(currentFeelsLike),
        humidity: Math.round(currentHumidity),
        windspeed: Math.round(currentWindSpeed),
        winddir: Math.round(currentWindDir),
        conditions: condition,
        icon: icon,
        datetime: new Date().toISOString(),
        sunrise: sunrise.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        sunset: sunset.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      },
      days: days,
    };
    
  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
}