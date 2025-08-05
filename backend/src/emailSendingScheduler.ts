import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { emailScheduler } from './emailScheduler';
import { adminNotification } from './utils/adminNotification';

// Environment config
dotenv.config();

interface User {
  id: string;
  email: string;
  city: string;
}

interface CachedCityData {
  city: string;
  date: string;
  weather: any;
  todaysBrief: any[];
  news: any[];
  events: any[];
  sports: any;
  cached_at: string;
}

export class EmailSendingScheduler {
  private supabase: any;
  private mailTransporter: nodemailer.Transporter | null = null;
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

  // Mail transporter'ı lazy load
  private getMailTransporter() {
    if (!this.mailTransporter) {
      this.mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER || 'your-email@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
        }
      });
    }
    return this.mailTransporter;
  }

  // Scheduler'ı başlat
  public start() {
    console.log('📧 Email Sending Scheduler starting...');
    
    // Her gün 08:07'de email gönder (veri toplama sonrası) (Türkiye saati)
    cron.schedule('7 5 * * *', () => {
      console.log('📧 Daily email sending job triggered at 08:07 AM (TR) / 05:07 AM (UTC)');
      this.sendDailyEmails();
    }, {
      timezone: 'UTC'
    });

    console.log('✅ Email Sending Scheduler started successfully');
  }

  // Ana email gönderme fonksiyonu
  public async sendDailyEmails() {
    if (this.isRunning) {
      console.log('⏳ Email sending already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('📧 Starting daily email distribution...');

    const startTime = Date.now();
    let users: User[] = [];

        try {
      // 1. Tüm kullanıcıları al
      users = await this.getAllUsers();
      console.log(`👥 Found ${users.length} users to send emails`);

      // Admin notification - started
      await adminNotification.sendNotification({
        type: 'email_sending',
        status: 'started',
        details: {
          totalUsers: users.length
        }
      });

      // 2. Şehirlere göre grupla
      const usersByCity = this.groupUsersByCity(users);
      console.log(`🏙️ Processing ${Object.keys(usersByCity).length} cities`);

      // 3. Her şehir için email gönder
      const results = {
        totalUsers: users.length,
        emailsSent: 0,
        emailsFailed: 0,
        citiesProcessed: 0,
        citiesSkipped: 0,
        errors: [] as string[]
      };

      for (const [city, cityUsers] of Object.entries(usersByCity)) {
        try {
          console.log(`📍 Processing ${cityUsers.length} users in ${city}...`);
          
          // Cache'den veri al
          const cachedData = await this.getCachedCityData(city);
          
          if (!cachedData) {
            console.log(`⚠️ No cached data found for ${city}, attempting to collect data first...`);
            
            // Veri toplama deneyin
            try {
              const { dataCollectionScheduler } = await import('./dataCollectionScheduler.js');
              await dataCollectionScheduler.collectAndCacheDataForCity(city);
              
              // Tekrar cache'den veri al
              const retryData = await this.getCachedCityData(city);
              if (!retryData) {
                console.log(`❌ Still no data available for ${city}, skipping ${cityUsers.length} users`);
                results.citiesSkipped++;
                results.emailsFailed += cityUsers.length;
                continue;
              }
              
              // Retry data'yı kullan
              const dataQuality = this.validateCachedData(retryData);
              if (!dataQuality.isValid) {
                console.log(`⚠️ Invalid data for ${city}: ${dataQuality.missing.join(', ')}`);
                results.citiesSkipped++;
                results.emailsFailed += cityUsers.length;
                continue;
              }
              
              // Bu şehirdeki kullanıcılara batch email gönder (optimizasyon)
              await this.sendBatchEmails(cityUsers, retryData, results);
              
              results.citiesProcessed++;
              continue; // Sonraki şehre geç
              
            } catch (error: any) {
              console.log(`❌ Failed to collect data for ${city}: ${error.message}`);
              results.citiesSkipped++;
              results.emailsFailed += cityUsers.length;
              continue;
            }
          }

          // Veri kalitesini kontrol et
          const dataQuality = this.validateCachedData(cachedData);
          if (!dataQuality.isValid) {
            console.log(`⚠️ Invalid data for ${city}: ${dataQuality.missing.join(', ')}`);
            results.citiesSkipped++;
            results.emailsFailed += cityUsers.length;
            continue;
          }

          // Bu şehirdeki kullanıcılara batch email gönder (optimizasyon)
          await this.sendBatchEmails(cityUsers, cachedData, results);

          results.citiesProcessed++;
        } catch (error: any) {
          results.citiesSkipped++;
          results.emailsFailed += cityUsers.length;
          results.errors.push(`${city}: ${error.message}`);
          console.error(`❌ Failed to process city ${city}:`, error.message);
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log('📊 Email sending completed:');
      console.log(`   👥 Total users: ${results.totalUsers}`);
      console.log(`   ✅ Emails sent: ${results.emailsSent}`);
      console.log(`   ❌ Emails failed: ${results.emailsFailed}`);
      console.log(`   🏙️ Cities processed: ${results.citiesProcessed}`);
      console.log(`   ⚠️ Cities skipped: ${results.citiesSkipped}`);
      console.log(`   ⏱️ Duration: ${duration}s`);
      if (results.errors.length > 0) {
        console.log(`   🚨 Sample errors:`, results.errors.slice(0, 5));
      }

      // Admin notification - completed
      await adminNotification.sendNotification({
        type: 'email_sending',
        status: 'completed',
        details: {
          totalUsers: users.length,
          emailsSent: results.emailsSent,
          emailsFailed: results.emailsFailed,
          errors: results.errors.slice(0, 5), // İlk 5 hata
          duration: `${duration}s`
        }
      });

    } catch (error) {
      console.error('❌ Daily email job failed:', error);
      
      // Admin notification - failed
      await adminNotification.sendNotification({
        type: 'email_sending',
        status: 'completed',
        details: {
          totalUsers: users.length,
          emailsSent: 0,
          emailsFailed: users.length,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
        }
      });
    } finally {
      this.isRunning = false;
    }
  }

  // Tüm kullanıcıları al
  private async getAllUsers(): Promise<User[]> {
    const supabase = this.getSupabaseClient();
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, city')
      .not('email', 'is', null)
      .not('city', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }

    return users || [];
  }

  // Kullanıcıları şehirlere göre grupla
  private groupUsersByCity(users: User[]): Record<string, User[]> {
    return users.reduce((acc, user) => {
      if (!acc[user.city]) {
        acc[user.city] = [];
      }
      acc[user.city].push(user);
      return acc;
    }, {} as Record<string, User[]>);
  }

  // city_data tablosundan şehir verisi al
  private async getCachedCityData(city: string): Promise<CachedCityData | null> {
    const supabase = this.getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    try {
      // Tüm veri tiplerini çek
      const { data: cityDataRows, error } = await supabase
        .from('city_data')
        .select('type, data')
        .eq('city', city)
        .eq('date', today);

      if (error || !cityDataRows || cityDataRows.length === 0) {
        console.log(`⚠️ No cached data found for ${city} on ${today}`);
        return null;
      }

      // Veri tiplerini organize et
      const organizedData: any = {
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

      // Her veri tipini yerleştir
      cityDataRows.forEach((row: any) => {
        console.log(`🔍 Processing ${row.type} data for ${city}:`, JSON.stringify(row.data).substring(0, 100) + '...');
        switch (row.type) {
          case 'weather':
            organizedData.weather = row.data;
            break;
          case 'news':
            organizedData.news = row.data || [];
            break;
          case 'events':
            organizedData.events = row.data || [];
            break;
          case 'sports':
            // Sports verisi artık doğru formatta geliyor
            organizedData.sports = row.data;
            break;
          case 'brief':
            organizedData.todaysBrief = row.data?.brief || [];
            break;
        }
      });

      console.log(`✅ Retrieved cached data for ${city}: ${cityDataRows.length} data types`);
      return organizedData as CachedCityData;

    } catch (error: any) {
      console.error(`❌ Error retrieving cached data for ${city}:`, error.message);
      return null;
    }
  }

  // Cache'deki veriyi doğrula
  private validateCachedData(data: CachedCityData): { isValid: boolean, missing: string[] } {
    const missing: string[] = [];
    
    // Weather check
    if (!data.weather || (!data.weather.current?.main?.temp && !data.weather.current?.weather?.[0]?.main)) {
      missing.push('Weather data');
    }
    
    // Today's brief check
    if (!data.todaysBrief || data.todaysBrief.length === 0) {
      missing.push('Today\'s brief');
    }
    
    // Events check
    if (!data.events || data.events.length === 0) {
      missing.push('Events data');
    }

    // Sports check - yeni eklendi
    if (!data.sports || (!data.sports.sports?.length && !data.sports.upcomingMatches)) {
      missing.push('Sports data');
    }
    
    // En az 2 veri kaynağı olmalı (sports dahil)
    const hasMinimumData = missing.length <= 2;
    
    console.log(`📊 Data validation details:`);
    console.log(`   Weather: ${data.weather ? '✅' : '❌'} (${JSON.stringify(data.weather).substring(0, 50)}...)`);
    console.log(`   Today's Brief: ${data.todaysBrief?.length || 0} items (${JSON.stringify(data.todaysBrief).substring(0, 50)}...)`);
    console.log(`   Events: ${data.events?.length || 0} items (${JSON.stringify(data.events).substring(0, 50)}...)`);
    console.log(`   Sports: ${data.sports?.sports?.length || 0} items (${JSON.stringify(data.sports).substring(0, 50)}...)`);
    console.log(`   Missing: ${missing.join(', ') || 'None'}`);
    
    return {
      isValid: hasMinimumData,
      missing: missing
    };
  }

  // Tek kullanıcıya email gönder
  private async sendEmailToUser(user: User, cityData: CachedCityData) {
    const transporter = this.getMailTransporter();
    
    const mailOptions = {
      from: process.env.GMAIL_USER || 'regor.newsletter@gmail.com',
      to: user.email,
      subject: `🌟 ${cityData.city} Günlük Güncellemesi - ${cityData.date}`,
      html: this.generateEmailHTML(cityData),
      text: this.generateEmailText(cityData)
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  }

  // HTML email template oluştur (PROFESSIONAL TEMPLATE)
  private generateEmailHTML(content: CachedCityData): string {
    // Professional template için veri formatını dönüştür
    const emailContent = {
      city: content.city,
      date: content.date,
      weather: content.weather,
      todaysBrief: content.todaysBrief,
      news: content.news,
      events: content.events,
      sports: content.sports
    };
    
    // EmailScheduler'daki professional template'i kullan
    return emailScheduler.generateEmailHTML(emailContent as any);
  }

  // Text email oluştur
  private generateEmailText(content: CachedCityData): string {
    return `
Good morning, ${content.city}!

Here's your daily update for ${content.date}

WEATHER:
${content.weather?.condition || 'Clear'} - ${content.weather?.high || '25'}°F

TODAY'S BRIEF:
${content.todaysBrief?.slice(0, 5).map((item: any) => `• ${item.title || item.text || item}`).join('\n') || 'No updates today'}

Stay connected with your city!
`;
  }

  // Batch email gönderme (optimizasyon)
  private async sendBatchEmails(users: User[], cityData: CachedCityData, results: any) {
    const BATCH_SIZE = 10; // 10'lu gruplar halinde gönder
    
    console.log(`📧 Sending emails to ${users.length} users in batches of ${BATCH_SIZE}...`);
    
    // Kullanıcıları batch'lere böl
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      
      // Batch'i paralel işle
      const batchPromises = batch.map(async (user) => {
        try {
          await this.sendEmailToUser(user, cityData);
          results.emailsSent++;
          console.log(`✅ Email sent to ${user.email}`);
          return { user: user.email, success: true };
        } catch (error: any) {
          results.emailsFailed++;
          results.errors.push(`${user.email}: ${error.message}`);
          console.error(`❌ Failed to send email to ${user.email}:`, error.message);
          return { user: user.email, success: false, error: error.message };
        }
      });
      
      // Batch'i bekle
      await Promise.all(batchPromises);
      
      // Batch'ler arası kısa bekleme (rate limiting)
      if (i + BATCH_SIZE < users.length) {
        await this.sleep(500); // 0.5 saniye bekle
      }
    }
  }

  // Helper: Sleep function
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Manuel email gönderme (test için)
  public async runEmailSendingJob() {
    console.log('🧪 Manually triggering email sending job...');
    await this.sendDailyEmails();
  }

  // Status check
  public isSendingRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const emailSendingScheduler = new EmailSendingScheduler();