import { getSupabaseClient, checkDateData, saveToCache } from './utils/database';
import { fetchFromSerpApi, fetchWeatherData } from './utils/api';

/**
 * Tüm veri tiplerini çek ve cache'e kaydet
 * @param city - Şehir adı
 * @returns İşlem sonucu
 */
export const fetchAllCityData = async (city: string) => {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const sixHundredHoursAgo = new Date(now.getTime() - 600 * 60 * 60 * 1000);

  console.log(`🔄 Fetching all data for ${city}...`);

  // 1. Mevcut cache'i kontrol et
  const { data: existingData } = await supabase
    .from('city_data')
    .select('*')
    .eq('city', city)
    .eq('date', today);

  const existingTypes = existingData?.map((item: any) => item.type) || [];
  const needsUpdate = existingData?.some((item: any) => {
    const cacheTime = new Date(item.created_at);
    return cacheTime < sixHundredHoursAgo;
  }) || existingData?.length === 0;

  if (!needsUpdate && (existingData?.length || 0) >= 4) {
    console.log(`✅ ${city} için tüm veriler güncel (600 saatten yeni)`);
    return { success: true, message: 'All data is up to date' };
  }

  // 2. Veri çekme fonksiyonları
  const fetchFunctions = [
    { type: 'news', fetch: fetchNews },
    { type: 'events', fetch: fetchEvents },
    { type: 'sports', fetch: fetchSports },
    { type: 'weather', fetch: fetchWeather }
  ];

  const results = [];

  for (const { type, fetch } of fetchFunctions) {
    try {
      // Eğer bu tip zaten varsa ve 600 saatten yeni ise atla
      const existingItem = existingData?.find((item: any) => item.type === type);
      if (existingItem) {
        const cacheTime = new Date(existingItem.created_at);
        if (cacheTime > sixHundredHoursAgo) {
          console.log(`⏭️  ${city} ${type} verisi güncel, atlanıyor`);
          results.push({ type, status: 'skipped', reason: 'up_to_date' });
          continue;
        }
      }

      console.log(`📡 Fetching ${type} for ${city}...`);
      const data = await fetch(city);
      
      if (data) {
        // Cache'e kaydet
        await saveToCache(city, today, type, data);
        console.log(`✅ ${city} ${type} verisi cache'lendi`);
        results.push({ type, status: 'success' });
      } else {
        results.push({ type, status: 'error', error: 'No data received' });
      }
    } catch (error: any) {
      console.error(`❌ ${type} fetch error:`, error.message);
      results.push({ type, status: 'error', error: error.message });
    }
  }

  const successCount = results.filter(r => r.status === 'success').length;
  console.log(`🎯 ${city} için ${successCount}/${fetchFunctions.length} veri tipi başarıyla güncellendi`);

  return {
    success: successCount > 0,
    results,
    message: `${successCount} data types updated for ${city}`
  };
};

/**
 * Haber verilerini çeker
 * @param city - Şehir adı
 */
async function fetchNews(city: string) {
  try {
    const response = await fetchFromSerpApi('google_news', city, { num: 20 }) as any;
    return response.news_results || [];
  } catch (error) {
    console.error('❌ News fetch error:', error);
    return null;
  }
}

/**
 * Etkinlik verilerini çeker
 * @param city - Şehir adı
 */
async function fetchEvents(city: string) {
  try {
    const response = await fetchFromSerpApi('google_events', `${city} events`, { num: 20 }) as any;
    return response.events_results || [];
  } catch (error) {
    console.error('❌ Events fetch error:', error);
    return null;
  }
}

/**
 * Spor verilerini çeker
 * @param city - Şehir adı
 */
async function fetchSports(city: string) {
  try {
    const response = await fetchFromSerpApi('google_news', `${city} sports`, { num: 15 }) as any;
    return response.news_results || [];
  } catch (error) {
    console.error('❌ Sports fetch error:', error);
    return null;
  }
}

/**
 * Hava durumu verilerini çeker
 * @param city - Şehir adı
 */
async function fetchWeather(city: string) {
  try {
    return await fetchWeatherData(city, 'imperial');
  } catch (error) {
    console.error('❌ Weather fetch error:', error);
    return null;
  }
} 