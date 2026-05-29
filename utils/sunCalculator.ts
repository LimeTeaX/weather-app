// utils/sunCalculator.ts

export function getSunPosition(lat: number, lon: number, date: Date = new Date()) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const dayMinutes = 24 * 60;
  
  // Sederhana: untuk demo, kita buat posisi berdasarkan jam
  // Timur = kiri (0-20%), Selatan = tengah (40-60%), Barat = kanan (80-100%)
  
  let azimuth: number;
  let isDay: boolean;
  
  // Cek apakah malam (18:00 - 06:00)
  const isNightTime = hours >= 18 || hours < 6;
  
  if (isNightTime) {
    // 🌙 MALAM: Bulan dari Timur (kiri) ke Barat (kanan)
    // Jam 18 = Timur (kiri), Jam 24 = Tengah malam (tengah), Jam 6 = Barat (kanan)
    let nightMinutes: number;
    if (hours >= 18) {
      // 18:00 - 23:59
      nightMinutes = (hours - 18) * 60 + minutes;
    } else {
      // 00:00 - 05:59
      nightMinutes = 24 * 60 - (18 * 60) + (hours * 60 + minutes);
    }
    const nightDuration = 12 * 60; // 12 jam malam
    
    // Azimuth: 0 (Timur) → 50 (Tengah malam) → 100 (Barat)
    azimuth = (nightMinutes / nightDuration) * 100;
    isDay = false;
  } else {
    // ☀️ SIANG: Matahari dari Timur ke Barat
    const dayMinutes = (hours - 6) * 60 + minutes;
    const dayDuration = 12 * 60;
    azimuth = (dayMinutes / dayDuration) * 100;
    isDay = true;
  }
  
  // Altitude: tinggi di langit
  // Maksimum di tengah hari (siang) atau tengah malam
  let altitude: number;
  if (isDay) {
    // Siang: tinggi di langit
    const progress = Math.sin(Math.PI * (azimuth / 100));
    altitude = progress * 60; // Max 60 derajat
  } else {
    // Malam: bulan juga tinggi di langit
    const progress = Math.sin(Math.PI * (azimuth / 100));
    altitude = progress * 50 + 10; // Bulan antara 10-60 derajat
  }
  
  // Konversi ke koordinat canvas
  // X: azimuth (0=kiri, 50=tengah, 100=kanan)
  const x = azimuth;
  // Y: altitude (0=atas, 100=bawah) - semakin tinggi altitude, semakin ke atas
  const y = 100 - (altitude / 70) * 80;
  
  return { x, y, azimuth, altitude, progress: totalMinutes / dayMinutes, isDay };
}

export function getTimeOfDay(progress: number, isDay: boolean): string {
  if (!isDay) return 'night';
  
  if (progress < 0.1) return 'dawn';
  if (progress < 0.3) return 'morning';
  if (progress < 0.5) return 'noon';
  if (progress < 0.7) return 'afternoon';
  if (progress < 0.9) return 'dusk';
  return 'night';
}