import axios, { AxiosResponse } from 'axios';

/**
 * API yapılandırması
 */
const API_CONFIG = {
  SERPAPI_BASE_URL: 'https://serpapi.com/search',
  OPENWEATHER_BASE_URL: 'https://api.openweathermap.org/data/2.5',
  EVENTBRITE_BASE_URL: 'https://www.eventbriteapi.com/v3',
  TIMEOUT: 10000, // 10 saniye timeout
  MAX_RETRIES: 2
};

/**
 * API anahtarlarını kontrol eder
 * @param apiKey - API anahtarı
 * @param apiName - API adı (hata mesajı için)
 */
export const validateApiKey = (apiKey: string | undefined, apiName: string): string => {
  if (!apiKey) {
    throw new Error(`${apiName} API key is not configured`);
  }
  return apiKey;
};

/**
 * Güvenli API çağrısı yapar
 * @param url - API URL'i
 * @param params - Query parametreleri
 * @param retries - Kalan deneme sayısı
 */
export const safeApiCall = async <T>(
  url: string, 
  params: Record<string, any> = {}, 
  retries: number = API_CONFIG.MAX_RETRIES
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axios.get(url, {
      params,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'User-Agent': 'Regor-App/1.0'
      }
    });
    
    return response.data;
  } catch (error: any) {
    if (retries > 0 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
      console.log(`API call failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekle
      return safeApiCall(url, params, retries - 1);
    }
    
    throw new Error(`API call failed: ${error.message}`);
  }
};

/**
 * SerpAPI'den veri çeker
 * @param engine - Arama motoru (google_news, google_events, vb.)
 * @param query - Arama sorgusu
 * @param additionalParams - Ek parametreler
 */
export const fetchFromSerpApi = async (
  engine: string,
  query: string,
  additionalParams: Record<string, any> = {}
) => {
  const apiKey = validateApiKey(process.env.SERPAPI_KEY, 'SerpAPI');
  
  // Sadece haber sorguları için negatif kelime filtrelemesi uygula
  let finalQuery = query;
  if (engine === 'google_news') {
    const negativeKeywords = [
      'death', 'dead', 'died', 'killed', 'murder', 'homicide', 'suicide',
      'accident', 'crash', 'fatal', 'injury', 'wounded', 'shot', 'stabbed',
      'disease', 'outbreak', 'epidemic', 'pandemic', 'virus', 'infection',
      'crime', 'robbery', 'theft', 'assault', 'rape', 'abuse', 'violence',
      'terrorism', 'bomb', 'explosion', 'fire', 'disaster', 'emergency',
      'crisis', 'tragedy', 'funeral', 'obituary', 'memorial', 'victim',
      'suspect', 'arrest', 'jail', 'prison', 'conviction', 'sentence',
      'protest', 'riot', 'demonstration', 'conflict', 'war', 'battle',
      'casualty', 'casualties', 'missing', 'disappeared', 'kidnapped',
      'legionnaires', 'legionella', 'contamination', 'poisoning'
    ];
    
    // Exclude parametresi oluştur (SerpAPI'de -keyword formatı)
    const excludeQuery = negativeKeywords.map(keyword => `-${keyword}`).join(' ');
    finalQuery = `${query} ${excludeQuery}`;
  }
  
  const params = {
    engine,
    q: finalQuery,
    api_key: apiKey,
    hl: 'en',
    gl: 'us',
    ...additionalParams
  };
  
  return safeApiCall(API_CONFIG.SERPAPI_BASE_URL, params);
};

/**
 * OpenWeatherMap API'den hava durumu verisi çeker
 * @param city - Şehir adı
 * @param units - Birim (metric, imperial)
 */
export const fetchWeatherData = async (city: string, units: 'metric' | 'imperial' = 'imperial') => {
  const apiKey = validateApiKey(process.env.OPENWEATHERMAP_KEY, 'OpenWeatherMap');
  
  const currentParams = {
    q: city,
    appid: apiKey,
    units,
    lang: 'en'
  };
  
  const forecastParams = {
    q: city,
    appid: apiKey,
    units,
    lang: 'en'
  };
  
  // Paralel olarak current ve forecast verilerini çek
  const [currentResponse, forecastResponse] = await Promise.all([
    safeApiCall(`${API_CONFIG.OPENWEATHER_BASE_URL}/weather`, currentParams),
    safeApiCall(`${API_CONFIG.OPENWEATHER_BASE_URL}/forecast`, forecastParams)
  ]);
  
  return {
    current: currentResponse,
    forecast: forecastResponse
  };
};

/**
 * Eventbrite API'den etkinlik verisi çeker
 * @param city - Şehir adı
 */
export const fetchEventbriteEvents = async (city: string) => {
  const apiKey = validateApiKey(process.env.EVENTBRITE_API_KEY, 'Eventbrite');
  
  const params = {
    'location.address': city,
    'start_date.range_start': new Date().toISOString(),
    'expand': 'venue',
    'status': 'live'
  };
  
  const response = await axios.get(`${API_CONFIG.EVENTBRITE_BASE_URL}/events/search/`, {
    params,
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    timeout: API_CONFIG.TIMEOUT
  });
  
  return response.data;
};

/**
 * Rate limiting için basit throttle fonksiyonu
 * @param delay - Milisaniye cinsinden bekleme süresi
 */
/**
 * Rate limiting için bekleme fonksiyonu
 * @param delay - Bekleme süresi (ms)
 */
export const throttle = (delay: number) => new Promise(resolve => setTimeout(resolve, delay));

/**
 * SerpAPI için özel rate limiting
 * Ücretsiz plan: 100 istek/gün
 * Her istek arasında minimum 1 saniye bekle
 */
export const serpApiThrottle = () => throttle(1500); // 1.5 saniye bekle 