import cron from 'node-cron';
import dotenv from 'dotenv';
import { SCHEDULE_CONFIG } from './config/scheduleConfig';
import { getCachedCityDataForToday } from './utils/cityData';
import { renderMjml, toEmailSafeBody } from './utils/mjmlRenderer';
import { createBeehiivPost } from './utils/beehiiv';
import { getSupabaseClient } from './utils/database';

dotenv.config();

export class BeehiivScheduler {
  private isRunning: boolean = false;

  // Scheduler'ı başlat
  public start() {
    console.log('📧 Beehiiv Scheduler starting...');
    
    const config = SCHEDULE_CONFIG.BEEHIIV_SENDING;
    cron.schedule(config.time, () => {
      console.log(`📧 ${config.description}`);
      this.sendDailyBeehiivEmails();
    }, {
      timezone: config.timezone
    });

    console.log(`✅ Beehiiv Scheduler: ${config.time} (${config.timezone})`);
  }

  // Ana Beehiiv gönderme fonksiyonu
  public async sendDailyBeehiivEmails() {
    if (this.isRunning) {
      console.log('⏳ Beehiiv sending already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('📧 Starting daily Beehiiv newsletter sending...');

    try {
      const supabase = getSupabaseClient();
      
      // Aktif şehirleri al
      const { data: activeCities, error } = await supabase
        .from('city_pub')
        .select('city_slug, city_name, beehiiv_publication_id')
        .eq('is_active', true);

      if (error || !activeCities || activeCities.length === 0) {
        console.log('❌ No active cities found');
        return;
      }

      console.log(`📊 Found ${activeCities.length} active cities`);

      // Her şehir için newsletter gönder
      for (const cityInfo of activeCities) {
        try {
          console.log(`📧 Processing ${cityInfo.city_name}...`);
          
          // Şehir verilerini al
          const cachedData = await getCachedCityDataForToday(cityInfo.city_name);
          if (!cachedData) {
            console.log(`⚠️ No cached data found for ${cityInfo.city_name}`);
            continue;
          }

          // MJML render et
          const htmlContent = await renderMjml(cachedData);
          const emailBody = toEmailSafeBody(htmlContent);

          // Subject oluştur - +1 gün (görsel için, gönderim aynı gün)
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowFormatted = tomorrow.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long', 
            day: 'numeric'
          });
          const subject = `${cityInfo.city_name} Update — ${tomorrowFormatted}`;

          // Beehiiv'e gönder (15:00 TR'de gönderilmek üzere planla - GÖNDERİM AKIŞI DEĞİŞMEDİ)
          // 00:10'da post oluştur, 15:00'da gönder = yaklaşık 14 saat 50 dakika sonra
          const scheduledAtIso = new Date(Date.now() + (14 * 60 + 50) * 60 * 1000).toISOString();
          const result = await createBeehiivPost({
            title: subject,
            html: emailBody,
            citySlug: cityInfo.city_slug,
            status: 'confirmed',
            scheduledAt: scheduledAtIso,
            hideFromFeed: true,
            emailSubject: subject
          });

          if (result.success) {
            console.log(`✅ ${cityInfo.city_name} newsletter scheduled successfully for ${scheduledAtIso}`);
          } else {
            console.log(`❌ Failed to schedule ${cityInfo.city_name} newsletter:`, result.error);
          }

          // Rate limiting için 2 saniye bekle
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`❌ Error processing ${cityInfo.city_name}:`, error);
        }
      }

      console.log('✅ Daily Beehiiv scheduling completed');

    } catch (error) {
      console.error('❌ Error in daily Beehiiv scheduling:', error);
    } finally {
      this.isRunning = false;
    }
  }
}

// Export instance
export const beehiivScheduler = new BeehiivScheduler();
