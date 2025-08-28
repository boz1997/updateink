import { getSupabaseClient } from './database';

export interface CachedCityData {
  city: string;
  date: string;
  weather: any;
  todaysBrief: any[];
  news: any[];
  events: any[];
  sports: any;
  cached_at: string;
}

/**
 * Fetches aggregated cached data for the given city for today from Supabase
 */
export async function getCachedCityDataForToday(city: string): Promise<CachedCityData | null> {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split('T')[0];

  // Initialize structure
  const result: CachedCityData = {
    city,
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }),
    weather: null,
    todaysBrief: [],
    news: [],
    events: [],
    sports: null,
    cached_at: new Date().toISOString()
  };

  try {
    const { data: rows, error } = await supabase
      .from('city_data')
      .select('type, data')
      .eq('city', city)
      .eq('date', today);

    if (error || !rows || rows.length === 0) {
      return null;
    }

    for (const row of rows as Array<{ type: string; data: any }>) {
      switch (row.type) {
        case 'weather':
          result.weather = row.data;
          break;
        case 'news':
          result.news = row.data || [];
          break;
        case 'events':
          result.events = row.data || [];
          break;
        case 'sports':
          result.sports = row.data;
          break;
        case 'brief':
          result.todaysBrief = row.data?.brief || [];
          break;
      }
    }

    return result;
  } catch (e) {
    return null;
  }
}


/**
 * Belirtilen tarih (YYYY-MM-DD) için şehir cache'ini getirir
 */
export async function getCachedCityDataForDate(city: string, dateYMD: string): Promise<CachedCityData | null> {
  const supabase = getSupabaseClient();

  const result: CachedCityData = {
    city,
    date: new Date(dateYMD + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }),
    weather: null,
    todaysBrief: [],
    news: [],
    events: [],
    sports: null,
    cached_at: new Date().toISOString()
  };

  try {
    const { data: rows, error } = await supabase
      .from('city_data')
      .select('type, data')
      .eq('city', city)
      .eq('date', dateYMD);

    if (error || !rows || rows.length === 0) {
      return null;
    }

    for (const row of rows as Array<{ type: string; data: any }>) {
      switch (row.type) {
        case 'weather':
          result.weather = row.data;
          break;
        case 'news':
          result.news = row.data || [];
          break;
        case 'events':
          result.events = row.data || [];
          break;
        case 'sports':
          result.sports = row.data;
          break;
        case 'brief':
          result.todaysBrief = row.data?.brief || [];
          break;
        case 'todaysBrief':
          result.todaysBrief = row.data || [];
          break;
      }
    }

    return result;
  } catch (e) {
    return null;
  }
}

