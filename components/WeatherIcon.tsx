import { 
  Sun, Moon, CloudRain, CloudSnow, Cloud, CloudFog, 
  Wind, Thermometer, Droplets, Sunrise, Sunset 
} from 'lucide-react';
import { JSX } from 'react/jsx-dev-runtime';

interface WeatherIconProps {
  iconCode: string;
  className?: string;
  size?: number;
}

export function WeatherIcon({ iconCode, className = '', size = 48 }: WeatherIconProps) {
  const code = iconCode.toLowerCase();
  
  const iconMap: Record<string, JSX.Element> = {
    'clear-day': <Sun size={size} className={className} />,
    'clear-night': <Moon size={size} className={className} />,
    'rain': <CloudRain size={size} className={className} />,
    'snow': <CloudSnow size={size} className={className} />,
    'cloudy': <Cloud size={size} className={className} />,
    'fog': <CloudFog size={size} className={className} />,
    'wind': <Wind size={size} className={className} />,
  };
  
  return iconMap[code] || <Sun size={size} className={className} />;
}

interface DetailIconProps {
  type: 'temp' | 'humidity' | 'wind' | 'sunrise' | 'sunset';
  className?: string;
  size?: number;
}

export function DetailIcon({ type, className = '', size = 20 }: DetailIconProps) {
  const icons = {
    temp: <Thermometer size={size} className={className} />,
    humidity: <Droplets size={size} className={className} />,
    wind: <Wind size={size} className={className} />,
    sunrise: <Sunrise size={size} className={className} />,
    sunset: <Sunset size={size} className={className} />,
  };
  return icons[type];
}