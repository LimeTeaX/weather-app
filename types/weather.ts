// OpenWeatherMap response format
export interface OpenWeatherResponse {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    temp_min: number;
    temp_max: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  sys: {
    sunrise: number;
    sunset: number;
  };
  visibility: number;
  dt: number;
}

export interface OpenWeatherForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
    };
    dt_txt: string;
  }>;
  city: {
    name: string;
    country: string;
  };
}

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

export type ColorTheme = 'clear-day' | 'clear-night' | 'rain' | 'clouds' | 'snow';