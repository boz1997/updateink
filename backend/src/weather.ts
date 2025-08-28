import { Request, Response } from 'express';
import { checkDateData, saveToCache } from './utils/database';
import { fetchWeatherData } from './utils/api';
import { Weather } from './types';

/**
 * Hava durumu verilerini getiren handler
 * Cache kontrolü yapar, gerekirse API'den veri çeker
 */
export const getWeatherHandler = async (req: Request, res: Response) => {
  const city = req.query.city as string;
  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    const override = (req.query.date as string) || '';
    const isValidYMD = /^\d{4}-\d{2}-\d{2}$/.test(override);
    const dateYMD = isValidYMD 
      ? override 
      : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    console.log(`🌤️ Checking weather cache for ${city} on ${dateYMD}`);

    // 1. Cache'den veri kontrol et
    const cachedResult = await checkDateData(city, dateYMD, 'weather');
    
    if (cachedResult && cachedResult.exists) {
      console.log(`✅ Cache hit for ${city} weather`);
      return res.json({ weather: cachedResult.data, fromCache: true });
    }

    // 2. Cache'de yoksa veya eskiyse API'den çek
    console.log(`🔄 Cache miss for ${city} weather, fetching from API`);
    
    const weather = await fetchWeatherData(city, 'imperial');

    // 3. Cache'e kaydet
    if (isValidYMD) {
      await saveToCache(city, dateYMD, 'weather', weather);
    }

    res.json({ weather, fromCache: false, persisted: isValidYMD });

  } catch (error: any) {
    console.error('❌ Weather fetch error:', error);
    res.status(500).json({ 
      error: 'Weather fetch error', 
      details: error.message 
    });
  }
};

/**
 * Email template için optimize edilmiş hava durumu verisi
 * Sadece günlük özet bilgileri döndürür
 */
export const getWeatherForEmailHandler = async (req: Request, res: Response) => {
  const city = req.query.city as string;
  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    const override = (req.query.date as string) || '';
    const isValidYMD = /^\d{4}-\d{2}-\d{2}$/.test(override);
    const dateYMD = isValidYMD 
      ? override 
      : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    console.log(`🌤️ Getting email weather for ${city} on ${dateYMD}`);

    // 1. Cache'den veri kontrol et
    const cachedResult = await checkDateData(city, dateYMD, 'weather');
    
    let weatherData;
    if (cachedResult && cachedResult.exists) {
      console.log(`✅ Cache hit for ${city} weather`);
      weatherData = cachedResult.data;
    } else {
      // 2. Cache'de yoksa API'den çek
      console.log(`🔄 Cache miss for ${city} weather, fetching from API`);
      weatherData = await fetchWeatherData(city, 'imperial');
      if (isValidYMD) {
        await saveToCache(city, dateYMD, 'weather', weatherData);
      }
    }

    // 3. Email template için sadece gerekli bilgileri çıkar
    const current = weatherData.current;
    const forecast = weatherData.forecast;

    // Hedef tarih için forecast dilimleri (OpenWeather forecast listesi 3 saatlik dilimler içerir)
    const list: any[] = forecast?.list || [];
    const targetDateStr = dateYMD; // Gelen hedef tarihi doğrudan kullan
    const localOffsetMs = new Date().getTimezoneOffset() * 60000;

    const formatLocalYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const segmentsForTarget = list.filter((item: any) => {
      const dtUtcMs = (item?.dt || 0) * 1000;
      const local = new Date(dtUtcMs - localOffsetMs);
      const ymdLocal = formatLocalYMD(local);
      return ymdLocal === targetDateStr;
    });

    // Eğer hedef gün için dilim bulamazsak, mevcut mantığa (ilk 8 dilim) geri düş
    const slices = segmentsForTarget.length > 0 ? segmentsForTarget : list.slice(0, 8);

    let high = Number.NEGATIVE_INFINITY;
    let low = Number.POSITIVE_INFINITY;
    let representativeWindMps = current?.wind?.speed || 0;
    let representativeWindDeg = current?.wind?.deg || 0;
    let representativeCondition = current?.weather?.[0]?.main || 'Unknown';

    slices.forEach((item: any, idx: number) => {
      const t = item?.main?.temp;
      const tMax = item?.main?.temp_max;
      const tMin = item?.main?.temp_min;
      if (typeof tMax === 'number') high = Math.max(high, tMax);
      if (typeof tMin === 'number') low = Math.min(low, tMin);
      if (typeof t === 'number') {
        if (!isFinite(high)) high = t;
        if (!isFinite(low)) low = t;
      }
      // Gün ortasına yakın bir dilimi temsilci al (ör. 12:00 civarı ~ index 4)
      if (idx === Math.floor(slices.length / 2)) {
        representativeWindMps = item?.wind?.speed ?? representativeWindMps;
        representativeWindDeg = item?.wind?.deg ?? representativeWindDeg;
        representativeCondition = item?.weather?.[0]?.main || representativeCondition;
      }
    });

    const windMph = Math.round((representativeWindMps || 0) * 2.237);

    const emailWeather = {
      condition: representativeCondition,
      high: Math.round(isFinite(high) ? high : current?.main?.temp || 0),
      low: Math.round(isFinite(low) ? low : current?.main?.temp || 0),
      wind: `${representativeWindDeg ? getWindDirection(representativeWindDeg) : 'N'} ${windMph}-${windMph + 5} mph`,
      date: new Date(targetDateStr + 'T00:00:00').toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      })
    };

    res.json({ weather: emailWeather, fromCache: cachedResult && cachedResult.exists });

  } catch (error: any) {
    console.error('❌ Email weather fetch error:', error);
    res.status(500).json({ 
      error: 'Email weather fetch error', 
      details: error.message 
    });
  }
};

/**
 * Rüzgar yönünü derece'den yön'e çevirir
 */
function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
} 