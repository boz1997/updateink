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
    const today = new Date().toISOString().split('T')[0];
    console.log(`🌤️ Checking weather cache for ${city} on ${today}`);

    // 1. Cache'den veri kontrol et
    const cachedResult = await checkDateData(city, today, 'weather');
    
    if (cachedResult && cachedResult.exists) {
      console.log(`✅ Cache hit for ${city} weather`);
      return res.json({ weather: cachedResult.data, fromCache: true });
    }

    // 2. Cache'de yoksa veya eskiyse API'den çek
    console.log(`🔄 Cache miss for ${city} weather, fetching from API`);
    
    const weather = await fetchWeatherData(city, 'imperial');

    // 3. Cache'e kaydet
    await saveToCache(city, today, 'weather', weather);

    res.json({ weather, fromCache: false });

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
    const today = new Date().toISOString().split('T')[0];
    console.log(`🌤️ Getting email weather for ${city} on ${today}`);

    // 1. Cache'den veri kontrol et
    const cachedResult = await checkDateData(city, today, 'weather');
    
    let weatherData;
    if (cachedResult && cachedResult.exists) {
      console.log(`✅ Cache hit for ${city} weather`);
      weatherData = cachedResult.data;
    } else {
      // 2. Cache'de yoksa API'den çek
      console.log(`🔄 Cache miss for ${city} weather, fetching from API`);
      weatherData = await fetchWeatherData(city, 'imperial');
      await saveToCache(city, today, 'weather', weatherData);
    }

    // 3. Email template için sadece gerekli bilgileri çıkar
    const current = weatherData.current;
    const forecast = weatherData.forecast;
    
    // Bugünün min/max sıcaklığını forecast'tan hesapla (ilk 8 saat)
    const todayForecasts = forecast?.list?.slice(0, 8) || [];
    let high = current?.main?.temp || 0;
    let low = current?.main?.temp || 0;
    
    // Forecast verilerinden min/max bul
    todayForecasts.forEach((item: any) => {
      if (item?.main?.temp_max && item.main.temp_max > high) high = item.main.temp_max;
      if (item?.main?.temp_min && item.main.temp_min < low) low = item.main.temp_min;
      if (item?.main?.temp && item.main.temp > high) high = item.main.temp;
      if (item?.main?.temp && item.main.temp < low) low = item.main.temp;
    });
    
    const emailWeather = {
      condition: current?.weather?.[0]?.main || 'Unknown',
      high: Math.round(high),
      low: Math.round(low),
      wind: `${current?.wind?.deg ? getWindDirection(current.wind.deg) : 'N'} ${Math.round(current?.wind?.speed * 2.237 || 0)}-${Math.round((current?.wind?.speed * 2.237 || 0) + 5)} mph`,
      date: new Date().toLocaleDateString('en-US', { 
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