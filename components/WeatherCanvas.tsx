'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSunPosition, getTimeOfDay } from '@/utils/sunCalculator';

interface WeatherCanvasProps {
  condition: string;
  intensity: number;
  lat: number;
  lon: number;
}

interface Cloud {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
  layer: 'far' | 'mid' | 'near';
}

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
}

export default function WeatherCanvas({ condition, intensity, lat, lon }: WeatherCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const cloudsRef = useRef<Cloud[]>([]);
  const rainRef = useRef<RainDrop[]>([]);
  
  const initClouds = useCallback(() => {
    const cloudCount = Math.floor(40 * (intensity / 100));
    const clouds: Cloud[] = [];
    
    for (let i = 0; i < cloudCount; i++) {
      const layer = Math.random() > 0.7 ? 'near' : Math.random() > 0.5 ? 'mid' : 'far';
      const speedMultiplier = layer === 'near' ? 0.5 : layer === 'mid' ? 0.3 : 0.1;
      
      clouds.push({
        x: Math.random() * 100,
        y: 20 + Math.random() * 40,
        radius: 20 + Math.random() * 40,
        speed: 0.05 + Math.random() * 0.1 * speedMultiplier,
        opacity: 0.3 + Math.random() * 0.4,
        layer,
      });
    }
    
    cloudsRef.current = clouds;
  }, [intensity]);
  
  const initRain = useCallback(() => {
    const dropCount = Math.floor(intensity * 2);
    const rain: RainDrop[] = [];
    
    for (let i = 0; i < dropCount; i++) {
      rain.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        speed: 5 + Math.random() * 10,
        length: 10 + Math.random() * 20,
      });
    }
    
    rainRef.current = rain;
  }, [intensity]);
  
  // Draw sun OR moon based on time of day
  const drawSunOrMoon = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const { x, y, isDay } = getSunPosition(lat, lon);
    
    const celestialX = (x / 100) * width;
    const celestialY = (y / 100) * height;
    
    if (celestialY > height + 50 || celestialY < -50) return;
    
    if (isDay) {
      // ☀️ SUN
      const glows = [
        { radius: 80, opacity: 0.1, blur: 50 },
        { radius: 60, opacity: 0.2, blur: 40 },
        { radius: 45, opacity: 0.4, blur: 30 },
        { radius: 35, opacity: 0.6, blur: 20 },
        { radius: 25, opacity: 0.8, blur: 10 },
      ];
      
      glows.forEach(glow => {
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, glow.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 50, ${glow.opacity})`;
        ctx.shadowBlur = glow.blur;
        ctx.shadowColor = 'rgba(255, 200, 50, 0.8)';
        ctx.fill();
      });
      
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 220, 80, 1)';
      ctx.fill();
      
      const rayCount = 12;
      const angleStep = (Math.PI * 2) / rayCount;
      const time = Date.now() / 1000;
      
      for (let i = 0; i < rayCount; i++) {
        const angle = i * angleStep + time;
        const rayX = celestialX + Math.cos(angle) * 40;
        const rayY = celestialY + Math.sin(angle) * 40;
        
        ctx.beginPath();
        ctx.moveTo(celestialX, celestialY);
        ctx.lineTo(rayX, rayY);
        ctx.strokeStyle = 'rgba(255, 220, 80, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    } else {
      // 🌙 MOON
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 220, 0.15)';
      ctx.shadowBlur = 40;
      ctx.shadowColor = 'rgba(255, 255, 200, 0.4)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(240, 240, 220, 0.95)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(celestialX - 6, celestialY - 4, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200, 190, 160, 0.4)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(celestialX + 5, celestialY + 3, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200, 190, 160, 0.3)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(celestialX - 3, celestialY + 7, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200, 190, 160, 0.35)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(celestialX + 8, celestialY - 2, 18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(30, 30, 50, 0.3)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 28, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 220, 0.08)';
      ctx.fill();
    }
    
    ctx.shadowBlur = 0;
  }, [lat, lon]);
  
  const drawClouds = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    cloudsRef.current.forEach(cloud => {
      const opacityMultiplier = cloud.layer === 'near' ? 0.8 : cloud.layer === 'mid' ? 0.6 : 0.4;
      const cloudX = (cloud.x / 100) * width;
      const cloudY = (cloud.y / 100) * height;
      
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, cloud.radius, 0, Math.PI * 2);
      ctx.arc(cloudX - cloud.radius * 0.6, cloudY - cloud.radius * 0.3, cloud.radius * 0.7, 0, Math.PI * 2);
      ctx.arc(cloudX + cloud.radius * 0.6, cloudY - cloud.radius * 0.3, cloud.radius * 0.7, 0, Math.PI * 2);
      ctx.arc(cloudX - cloud.radius * 0.3, cloudY + cloud.radius * 0.2, cloud.radius * 0.5, 0, Math.PI * 2);
      ctx.arc(cloudX + cloud.radius * 0.3, cloudY + cloud.radius * 0.2, cloud.radius * 0.5, 0, Math.PI * 2);
      
      ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity * opacityMultiplier})`;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(cloudX - 5, cloudY + 5, cloud.radius * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 0, 0, ${cloud.opacity * 0.1})`;
      ctx.fill();
      
      cloud.x += cloud.speed;
      if (cloud.x > 100 + 20) cloud.x = -20;
    });
  }, []);
  
  const drawRain = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.beginPath();
    rainRef.current.forEach(drop => {
      const dropX = (drop.x / 100) * width;
      const dropY = (drop.y / 100) * height;
      
      ctx.moveTo(dropX, dropY);
      ctx.lineTo(dropX - 3, dropY + drop.length);
      ctx.strokeStyle = `rgba(150, 180, 220, ${0.3 + intensity / 200})`;
      ctx.lineWidth = 2;
      
      drop.y += drop.speed / 10;
      if (drop.y > 100) {
        drop.y = -5;
        drop.x = Math.random() * 100;
      }
    });
    ctx.stroke();
  }, [intensity]);
  
  const drawStars = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, timeOfDay: string) => {
    const isNight = timeOfDay === 'night';
    const starCount = isNight ? 300 : 50;
    
    for (let i = 0; i < starCount; i++) {
      const starX = (i * 131071) % width;
      const starY = (i * 524287) % (height * 0.7);
      const twinkle = isNight ? Math.sin(Date.now() / 1000 + i) * 0.5 + 0.5 : 0.3;
      
      ctx.beginPath();
      ctx.arc(starX, starY, isNight ? 1.5 + twinkle : 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 200, ${isNight ? 0.3 + twinkle * 0.5 : 0.15})`;
      ctx.fill();
    }
    
    if (isNight && Math.random() < 0.002) {
      const shootingStarX = Math.random() * width;
      const shootingStarY = Math.random() * (height * 0.3);
      
      ctx.beginPath();
      ctx.moveTo(shootingStarX, shootingStarY);
      ctx.lineTo(shootingStarX - 40, shootingStarY + 20);
      ctx.strokeStyle = 'rgba(255, 255, 200, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, []);
  
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    const { isDay, progress } = getSunPosition(lat, lon);
    const timeOfDay = getTimeOfDay(progress, isDay);
    
    let gradientColors: string[] = [];
    
    if (!isDay) {
      gradientColors = ['#0a0a2a', '#1a1a4a', '#2a2a5a'];
    } else {
      switch (condition) {
        case 'clear':
          if (timeOfDay === 'dawn') gradientColors = ['#1a0533', '#ff6b35', '#f7931e'];
          else if (timeOfDay === 'dusk') gradientColors = ['#ff6b35', '#8b2252', '#1a0533'];
          else gradientColors = ['#4a90e2', '#87ceeb', '#c8e6f5'];
          break;
        case 'rain':
          gradientColors = ['#2c3e50', '#34495e', '#4a627a'];
          break;
        case 'clouds':
          gradientColors = ['#4a5568', '#718096', '#a0aec0'];
          break;
        default:
          gradientColors = ['#667eea', '#764ba2', '#f093fb'];
      }
    }
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradientColors.forEach((color, i) => {
      gradient.addColorStop(i / (gradientColors.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    drawStars(ctx, width, height, timeOfDay);
    drawSunOrMoon(ctx, width, height);
    drawClouds(ctx, width, height);
    
    if (condition === 'rain') {
      drawRain(ctx, width, height);
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [condition, intensity, lat, lon, drawSunOrMoon, drawClouds, drawRain, drawStars]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    initClouds();
    if (condition === 'rain') initRain();
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [animate, initClouds, initRain, condition]);
  
  useEffect(() => {
    initClouds();
  }, [intensity, initClouds]);
  
  useEffect(() => {
    if (condition === 'rain') {
      initRain();
    }
  }, [condition, initRain]);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ position: 'fixed', display: 'block' }}
    />
  );
}