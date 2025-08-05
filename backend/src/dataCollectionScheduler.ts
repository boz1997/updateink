import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { checkDateData } from './utils/database';
import { adminNotification } from './utils/adminNotification';

// Environment config
dotenv.config();

interface CityData {
  city: string;
  date: string;
  weather: any;
  todaysBrief: any[];
  news: any[];
  events: any[];
  sports: any;
  cached_at: string;
}

export class DataCollectionScheduler {
  private supabase: any;
  private isRunning: boolean = false;

  constructor() {
    this.supabase = null;
  }

  // Supabase client'ı lazy load
  private getSupabaseClient() {
    if (!this.supabase) {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        throw new Error('Supabase environment variables are not configured');
      }
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
    }
    return this.supabase;
  }

  // Scheduler'ı başlat
  public start() {
    console.log('📊 Data Collection Scheduler starting...');
    
    // Her gün 12:05'te veri toplama (Türkiye saati)
    cron.schedule('5 9 * * *', () => {
      console.log('📊 Daily data collection job triggered at 12:05 PM (TR) / 09:05 AM (UTC)');
      this.collectDailyData();
    }, {
      timezone: 'UTC'
    });

    console.log('✅ Data Collection Scheduler started successfully');
  }

  // Ana veri toplama fonksiyonu
  public async collectDailyData() {
    if (this.isRunning) {
      console.log('⏳ Data collection already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting daily data collection...');

    const startTime = Date.now();
    let uniqueCities: string[] = [];

    try {
      // 1. Tüm unique şehirleri al
      uniqueCities = await this.getUniqueCities();
      console.log(`🏙️ Found ${uniqueCities.length} unique cities to process`);

      // Admin notification - started
      await adminNotification.sendNotification({
        type: 'data_collection',
        status: 'started',
        details: {
          totalCities: uniqueCities.length
        }
      });

      // 2. Şehirleri paralel işle (optimizasyon)
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      console.log(`🚀 Processing ${uniqueCities.length} cities in parallel...`);
      
      // Şehirleri paralel işle
      const cityPromises = uniqueCities.map(async (city) => {
        try {
          console.log(`📍 Processing data for ${city}...`);
          await this.collectAndCacheDataForCity(city);
          results.successful++;
          console.log(`✅ Data collected successfully for ${city}`);
          return { city, success: true };
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${city}: ${error.message}`);
          console.error(`❌ Failed to collect data for ${city}:`, error.message);
          return { city, success: false, error: error.message };
        }
      });

      // Tüm şehirleri paralel bekle
      await Promise.all(cityPromises);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log('📊 Data collection completed:');
      console.log(`   ✅ Successful: ${results.successful}`);
      console.log(`   ❌ Failed: ${results.failed}`);
      console.log(`   ⏱️ Duration: ${duration}s`);
      if (results.errors.length > 0) {
        console.log(`   🚨 Errors:`, results.errors);
      }

      // Admin notification - completed
      await adminNotification.sendNotification({
        type: 'data_collection',
        status: 'completed',
        details: {
          totalCities: uniqueCities.length,
          successful: results.successful,
          failed: results.failed,
          errors: results.errors,
          duration: `${duration}s`
        }
      });

    } catch (error) {
      console.error('❌ Data collection job failed:', error);
      
      // Admin notification - failed
      await adminNotification.sendNotification({
        type: 'data_collection',
        status: 'completed',
        details: {
          totalCities: uniqueCities.length,
          successful: 0,
          failed: uniqueCities.length,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
        }
      });
    } finally {
      this.isRunning = false;
    }
  }

  // Unique şehirleri al
  private async getUniqueCities(): Promise<string[]> {
    const supabase = this.getSupabaseClient();
    
    const { data: users, error } = await supabase
      .from('users')
      .select('city')
      .not('city', 'is', null);

    if (error) {
      throw new Error(`Failed to get cities: ${error.message}`);
    }

    // Unique şehirler
    const uniqueCities = [...new Set(users.map((user: any) => user.city))];
    return uniqueCities.filter((city: any) => city && typeof city === 'string' && city.trim().length > 0) as string[];
  }

  // Tek şehir için veri topla ve cache'le
  public async collectAndCacheDataForCity(city: string) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Tarih kontrolü - bugün için veri var mı?
    const weatherCheck = await checkDateData(city, today, 'weather');
    const newsCheck = await checkDateData(city, today, 'news');
    const eventsCheck = await checkDateData(city, today, 'events');
    const sportsCheck = await checkDateData(city, today, 'sports');

    // Eğer bugün için tüm veriler varsa, yeni veri çekme
    if (weatherCheck?.exists && newsCheck?.exists && eventsCheck?.exists && sportsCheck?.exists) {
      console.log(`✅ Data already exists for ${city} on ${today}, skipping data collection`);
      return;
    }

    console.log(`📊 Collecting fresh data for ${city} on ${today}...`);

    try {
      // Paralel veri toplama - Azure URL kullan
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://regor-backend-app-fgcxhnf8fcetgddn.westeurope-01.azurewebsites.net'
        : 'http://localhost:4000';
        
      const [weatherResponse, briefResponse, newsResponse, eventsResponse, sportsResponse] = await Promise.all([
        fetch(`${baseUrl}/weather-email?city=${encodeURIComponent(city)}`).then(r => r.json()),
        fetch(`${baseUrl}/todays-brief?city=${encodeURIComponent(city)}&date=${today}`).then(r => r.json()),
        fetch(`${baseUrl}/news?city=${encodeURIComponent(city)}`).then(r => r.json()),
        fetch(`${baseUrl}/events?city=${encodeURIComponent(city)}`).then(r => r.json()),
        fetch(`${baseUrl}/sports?city=${encodeURIComponent(city)}`).then(r => r.json())
      ]);

      // Veri yapısını oluştur
      const cityData: CityData = {
        city,
        date: new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        }),
        weather: weatherResponse.weather || weatherResponse,
        todaysBrief: briefResponse.brief || [],
        news: newsResponse.news || [],
        events: eventsResponse.events || [],
        sports: (() => {
          const sportsNews = sportsResponse?.sports || [];
          const upcomingMatches = sportsResponse?.upcomingMatches || {};
          
          console.log(`🏈 Raw sports news: ${sportsNews.length}`);
          console.log(`🏈 Raw upcoming matches: ${Object.keys(upcomingMatches).length} categories`);
          
          // Sports news'lerden summary oluştur (testEmail.ts'deki gibi)
          const sportsSummary = sportsNews.length > 0 
            ? sportsNews.slice(0, 2).map((item: any) => {
                return item.aiSummary || item.summary || item.aiTitle || item.title || '';
              }).join(' ') 
            : `Stay updated with the latest sports action in ${city}. From professional games to local tournaments, here's what's happening in your sports scene.`;
          
          // Upcoming matches'i düzenle (testEmail.ts'deki gibi)
          const allMatches: any[] = [];
          
          Object.keys(upcomingMatches).forEach(sport => {
            const matches = upcomingMatches[sport] || [];
            console.log(`🏈 ${sport}: ${matches.length} matches`);
            
            matches.forEach((match: any) => {
              allMatches.push({
                sport: sport.charAt(0).toUpperCase() + sport.slice(1),
                title: match.title || match.teams || `${sport} match`,
                date: match.date || match.time || 'Date TBA',
                venue: match.venue || 'Venue TBA',
                teams: match.teams || match.title || 'Teams TBA'
              });
            });
          });
          
          console.log(`🏈 Total matches found: ${allMatches.length}`);
          
          return {
            summary: sportsSummary,
            matches: allMatches.slice(0, 8), // Maksimum 8 maç
            readMoreLink: sportsNews.length > 0 ? (sportsNews[0].link || sportsNews[0].originalLink || '#') : '#'
          };
        })(),
        cached_at: new Date().toISOString()
      };

      // Cache'e kaydet
      await this.saveCityDataToCache(cityData);

    } catch (error: any) {
      throw new Error(`Data collection failed for ${city}: ${error.message}`);
    }
  }

  // Veriyi city_data tablosuna kaydet
  private async saveCityDataToCache(cityData: CityData) {
    const supabase = this.getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    // Her veri tipini ayrı kayıt olarak kaydet
    const dataTypes = [
      { type: 'weather', data: cityData.weather },
      { type: 'news', data: cityData.news },
      { type: 'events', data: cityData.events },
      { type: 'sports', data: cityData.sports },
      { type: 'todaysBrief', data: cityData.todaysBrief }
    ];

    // Önce bugünkü verileri sil (eğer varsa)
    await supabase
      .from('city_data')
      .delete()
      .eq('city', cityData.city)
      .eq('date', today);

    // Her veri tipini ayrı kaydet
    for (const dataType of dataTypes) {
      const { error } = await supabase
        .from('city_data')
        .insert({
          city: cityData.city,
          date: today,
          type: dataType.type,
          data: dataType.data
        });

      if (error) {
        console.error(`❌ Failed to save ${dataType.type} for ${cityData.city}:`, error.message);
      } else {
        console.log(`✅ Saved ${dataType.type} data for ${cityData.city}`);
      }
    }

    // Today's brief'i ayrı kaydet
    if (cityData.todaysBrief && cityData.todaysBrief.length > 0) {
      const { error } = await supabase
        .from('city_data')
        .insert({
          city: cityData.city,
          date: today,
          type: 'brief',
          data: { brief: cityData.todaysBrief }
        });

      if (error) {
        console.error(`❌ Failed to save brief for ${cityData.city}:`, error.message);
      } else {
        console.log(`✅ Saved brief data for ${cityData.city}`);
      }
    }
  }

  // Helper: Sleep function
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Manuel veri toplama (test için)
  public async runDataCollectionJob() {
    console.log('🧪 Manually triggering data collection job...');
    await this.collectDailyData();
  }

  // Status check
  public isCollectionRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const dataCollectionScheduler = new DataCollectionScheduler();