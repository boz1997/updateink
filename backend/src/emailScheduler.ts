import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import nodemailer from 'nodemailer';

// Email scheduler for daily updates


interface User {
  id: string;
  email: string;
  city: string;
}

interface EmailContent {
  city: string;
  date: string;
  weather: any;
  todaysBrief: any[];
  news: any[];
  events: any[];
  sports: any;
}

export class EmailScheduler {
  private supabase: any;
  private isRunning: boolean = false;
  private mailTransporter: nodemailer.Transporter | null = null;

  constructor() {
    // Supabase client'ı lazy initialize ediyoruz
    this.supabase = null;
  }

  // Supabase client'ı ilk kullanımda oluştur
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

  // Mail transporter'ı ilk kullanımda oluştur
  private getMailTransporter() {
    if (!this.mailTransporter) {
      this.mailTransporter = nodemailer.createTransport({
        service: 'gmail', // Gmail kullanıyoruz - farklı provider istersen değiştirilebilir
        auth: {
          user: process.env.GMAIL_USER || 'your-email@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
        }
      });
    }
    return this.mailTransporter;
  }

  // Start the email scheduler
  public start() {
    console.log('📧 Email scheduler starting...');
    
    // Schedule daily email at 04:00 PM (TEST)
    cron.schedule('0 16 * * *', () => {
      console.log('🕟 TEST: Daily email job triggered at 04:00 PM');
      this.sendDailyEmails();
    }, {
      timezone: 'Europe/Istanbul'
    });

    // Schedule test email every hour (for testing)
    cron.schedule('0 * * * *', () => {
      console.log('🧪 Test email job triggered (hourly)');
      // this.sendTestEmails(); // Uncomment for testing
    }, {
      timezone: 'Europe/Istanbul'
    });

    console.log('✅ Email scheduler started successfully');
  }

  // Send daily emails to all subscribers
  private async sendDailyEmails() {
    if (this.isRunning) {
      console.log('⚠️ Email job already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('📧 Starting daily email distribution...');

    try {
      // Get all users
      const users = await this.getAllUsers();
      console.log(`📊 Found ${users.length} users to send emails to`);

      // Group users by city for efficiency
      const usersByCity = this.groupUsersByCity(users);
      console.log(`🏙️ Users grouped by ${Object.keys(usersByCity).length} cities`);

      // Send emails for each city
      for (const [city, cityUsers] of Object.entries(usersByCity)) {
        try {
          console.log(`📨 Processing ${city} (${cityUsers.length} users)`);
          
          // Generate email content for this city
          const emailContent = await this.generateEmailContent(city);
          
          // Send to all users in this city
          await this.sendEmailsToUsers(cityUsers, emailContent);
          
          console.log(`✅ Successfully sent emails for ${city}`);
        } catch (error) {
          console.error(`❌ Error processing ${city}:`, error);
        }
      }

      console.log('🎉 Daily email distribution completed');
    } catch (error) {
      console.error('❌ Daily email job failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Get all users from database
  private async getAllUsers(): Promise<User[]> {
    const { data: users, error } = await this.getSupabaseClient()
      .from('users')
      .select('id, email, city')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return users || [];
  }

  // Group users by city
  private groupUsersByCity(users: User[]): Record<string, User[]> {
    const grouped: Record<string, User[]> = {};
    
    users.forEach(user => {
      if (!grouped[user.city]) {
        grouped[user.city] = [];
      }
      grouped[user.city].push(user);
    });

    return grouped;
  }

  // Generate email content for a city (same as testEmail.ts)
  private async generateEmailContent(city: string): Promise<EmailContent> {
    console.log(`🔍 Fetching data for ${city}...`);

    try {
      // Fetch all data for the city - same as testEmail.ts
      const [weatherResponse, briefResponse, newsResponse, eventsResponse, sportsResponse] = await Promise.all([
        fetch(`${process.env.API_BASE_URL || 'http://localhost:4000'}/weather-email?city=${encodeURIComponent(city)}`).then(r => r.json()).catch(() => null),
        fetch(`${process.env.API_BASE_URL || 'http://localhost:4000'}/todays-brief?city=${encodeURIComponent(city)}`).then(r => r.json()).catch(() => null),
        fetch(`${process.env.API_BASE_URL || 'http://localhost:4000'}/news?city=${encodeURIComponent(city)}`).then(r => r.json()).catch(() => null),
        fetch(`${process.env.API_BASE_URL || 'http://localhost:4000'}/events?city=${encodeURIComponent(city)}`).then(r => r.json()).catch(() => null),
        fetch(`${process.env.API_BASE_URL || 'http://localhost:4000'}/sports?city=${encodeURIComponent(city)}`).then(r => r.json()).catch(() => null)
      ]);

      console.log(`📰 Raw news fetched:`, newsResponse?.news?.length || 0);

      // Create email data exactly like testEmail.ts
      const emailData = {
        city: city,
        date: new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        }),
        weather: weatherResponse?.weather || {
          condition: 'Weather unavailable',
          high: '--',
          low: '--',
          wind: 'Wind data unavailable'
        },
        todaysBrief: briefResponse?.brief || [],
        news: (() => {
          const allNews = newsResponse?.news || [];
          console.log(`📊 Starting with ${allNews.length} AI-filtered news items`);
          
          return allNews
            .filter((item: any) => {
              if (!item.link || item.link === '#') {
                console.log(`🚫 No valid link: ${item.title}`);
                return false;
              }
              if (item.isAppropriate === false) {
                console.log(`🚫 AI marked inappropriate: ${item.title}`);
                return false;
              }
              console.log(`✅ PASSED: ${item.title}`);
              return true;
            })
            .slice(0, 6); // Limit to 6 news items
        })(),
        events: (() => {
          const allEvents = eventsResponse?.events || [];
          console.log(`🎉 Raw events fetched:`, allEvents.length);
          
          return allEvents
            .filter((event: any) => event.title && event.date)
            .slice(0, 4); // Limit to 4 events
        })(),
                 sports: (() => {
           // /sports endpoint'inden gelen veriyi doğru şekilde işle - BİREBİR /sports sayfası gibi
           const sportsNews = sportsResponse?.sports || [];
           const upcomingMatches = sportsResponse?.upcomingMatches || {};
           console.log(`🏈 Raw sports fetched:`, sportsNews.length);
           console.log(`🏈 Upcoming matches fetched:`, upcomingMatches);
           
           // Process sports data like testEmail.ts
           const sportsSummary = sportsNews.length > 0 
             ? `Stay updated with the latest sports action in ${city}. From professional games to local tournaments, here's what's happening in your sports scene.`
             : `Sports updates for ${city} will be available soon.`;

           // Upcoming matches'i düzenle - /sports sayfasındaki gibi
           const allMatches: any[] = [];
           
           // Tüm spor kategorilerinden maçları topla
           Object.keys(upcomingMatches).forEach(sport => {
             const matches = upcomingMatches[sport] || [];
             console.log(`🏈 ${sport}: ${matches.length} matches`);
             
             matches.forEach((match: any) => {
               console.log(`🏈 Match: ${match.title || match.teams} - ${match.date || match.time}`);
               
               allMatches.push({
                 sport: sport.charAt(0).toUpperCase() + sport.slice(1), // Capitalize first letter
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
         })()
      };

      return emailData;
    } catch (error) {
      console.error(`❌ Error generating content for ${city}:`, error);
      throw error;
    }
  }



      // Send emails to users
  private async sendEmailsToUsers(users: User[], content: EmailContent) {
    console.log(`📧 Preparing to send emails to ${users.length} users for ${content.city}`);

    // REAL EMAIL SENDING IS NOW ACTIVE! 🚀
    for (const user of users) {
      try {
        await this.sendEmailViaNodemailer(user.email, content);
        console.log(`✅ Email sent to ${user.email}`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to send email to ${user.email}:`, error);
      }
    }

    console.log(`📧 Email sending completed for ${content.city}`);
  }

  // Send email via Nodemailer (REAL EMAIL SENDING)
  private async sendEmailViaNodemailer(email: string, content: EmailContent) {
    try {
      const transporter = this.getMailTransporter();
      
      const mailOptions = {
        from: process.env.GMAIL_USER || 'regor.newsletter@gmail.com',
        to: email,
        subject: `🌟 ${content.city} Günlük Güncellemesi - ${content.date}`,
        html: this.generateEmailHTML(content),
        text: this.generateEmailText(content)
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${email}:`, result.messageId);
      return result;
    } catch (error) {
      console.error(`❌ Failed to send email to ${email}:`, error);
      throw error;
    }
  }

  // Validate email content before sending
  private validateEmailContent(content: EmailContent): { isValid: boolean, missing: string[] } {
    const missing: string[] = [];
    
    // Weather check - farklı weather formatları kontrol et
    if (!content.weather || 
        (!content.weather.current?.temp && !content.weather.high && !content.weather.condition)) {
      missing.push('Weather data');
    }
    
    // News check - boş olması normal, atla
    // if (!content.news || content.news.length === 0) {
    //   missing.push('News data');
    // }
    
    // Today's brief check
    if (!content.todaysBrief || content.todaysBrief.length === 0) {
      missing.push('Today\'s brief');
    }
    
    // Events check
    if (!content.events || content.events.length === 0) {
      missing.push('Events data');
    }
    
    // En az 2 veri kaynağı olmalı (weather + todaysBrief + events)
    const hasMinimumData = missing.length <= 1;
    
    console.log(`📊 Data validation for ${content.city}:`);
    console.log(`   Weather: ${content.weather ? '✅' : '❌'}`);
    console.log(`   Today's Brief: ${content.todaysBrief?.length || 0} items`);
    console.log(`   Events: ${content.events?.length || 0} items`);
    console.log(`   Missing: ${missing.join(', ') || 'None'}`);
    
    return {
      isValid: hasMinimumData,
      missing: missing
    };
  }

  // Generate email HTML using the same template as testEmail.ts
  public generateEmailHTML(content: EmailContent): string {
    // testEmail.ts'den tam template
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${content.city} Update</title>
    <style>
        /* EMAIL RESET */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        /* HEADER SECTION WITH BACKGROUND */
        .header-section {
            position: relative;
            height: 200px;
            /* Email client uyumluluğu için background-image yerine img kullan */
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            padding: 20px 30px;
            color: white;
            overflow: hidden;
        }
        
        .header-bg-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: -1;
        }
        
        .header-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.4);
            z-index: -1;
        }
        
        .header-logo {
            position: absolute;
            top: 20px;
            left: 20px;
            background: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-weight: bold;
            color: #333;
            font-size: 14px;
        }
        
        .social-icons {
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
        }
        
        .social-icon {
            width: 30px;
            height: 30px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-decoration: none;
            font-size: 14px;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: normal;
            margin-bottom: 5px;
        }
        
        .city-name {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .tagline {
            font-size: 16px;
            opacity: 0.9;
        }
        
        /* SPONSORS SECTION */
        .sponsors-section {
            background: #e8f4fd;
            padding: 20px;
            text-align: center;
        }
        
        .sponsors-title {
            color: #4a90e2;
            font-size: 18px;
            margin-bottom: 20px;
            font-weight: normal;
        }
        
        .sponsors-grid {
            /* Email client uyumluluğu için table layout */
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
        }
        
        .sponsor-item {
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
            margin-bottom: 15px;
        }
        
        .sponsor-item {
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .sponsor-logo {
            width: 50px;
            height: 50px;
            background: #f0f0f0;
            border-radius: 8px;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #666;
        }
        
        .sponsor-name {
            font-size: 11px;
            color: #666;
            line-height: 1.3;
        }
        
        /* WEATHER SECTION */
        .weather-section {
            background: white;
            padding: 25px 20px;
            border-bottom: 1px solid #eee;
        }
        
        .weather-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .weather-title {
            font-size: 20px;
            color: #333;
            font-weight: bold;
        }
        
        .weather-date {
            font-size: 14px;
            color: #666;
            font-weight: normal;
        }
        
        .weather-content {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .weather-icon {
            font-size: 48px;
        }
        
        .weather-main {
            flex: 1;
        }
        
        .weather-condition {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
        }
        
        .weather-details {
            font-size: 16px;
            color: #666;
            line-height: 1.4;
        }

        /* TODAY'S BRIEF SECTION */
        .brief-section {
            background: #f8f9fa;
            padding: 25px 20px;
            border-bottom: 1px solid #eee;
        }
        
        .brief-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .brief-title {
            font-size: 20px;
            color: #333;
            font-weight: bold;
        }
        
        .brief-decoration {
            flex: 1;
            height: 3px;
            background: linear-gradient(90deg, #4a90e2, transparent);
            margin-left: 15px;
        }
        
        .brief-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .brief-item {
            display: flex;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
            font-size: 16px;
            color: #333;
            line-height: 1.4;
        }
        
        .brief-item:last-child {
            border-bottom: none;
        }
        
        .brief-arrow {
            color: #ffa500;
            font-size: 14px;
            margin-right: 12px;
            font-weight: bold;
        }

        /* ADVERTISEMENT SECTION */
        .ad-section {
            background: #e8f4fd;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 1px solid #eee;
        }
        
        .ad-content {
            background: white;
            border-radius: 12px;
            padding: 30px 20px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            max-width: 400px;
            margin: 0 auto;
            position: relative;
        }
        
        .ad-quote-left, .ad-quote-right {
            position: absolute;
            font-size: 48px;
            color: #4a90e2;
            opacity: 0.3;
        }
        
        .ad-quote-left {
            top: 10px;
            left: 15px;
        }
        
        .ad-quote-right {
            bottom: 10px;
            right: 15px;
        }
        
        .ad-title {
            font-size: 18px;
            color: #333;
            margin-bottom: 15px;
            font-weight: normal;
        }
        
        .ad-subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 15px;
        }
        
        .ad-description {
            font-size: 13px;
            color: #666;
            line-height: 1.5;
            margin-bottom: 20px;
        }
        
        .ad-button {
            background: #4a90e2;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            font-weight: bold;
            display: inline-block;
        }
        
        /* NEWS SECTION */
        .news-section {
            background: white;
            padding: 25px 20px;
        }
        
        .news-header {
            display: flex;
            align-items: center;
            margin-bottom: 25px;
        }
        
        .news-title {
            font-size: 20px;
            color: #333;
            font-weight: bold;
        }
        
        .news-decoration {
            flex: 1;
            height: 3px;
            background: linear-gradient(90deg, #4a90e2, transparent);
            margin-left: 15px;
        }
        
        .news-grid {
            display: grid;
            gap: 20px;
        }
        
        .news-item {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #4a90e2;
        }
        
        .news-item-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
            line-height: 1.3;
        }
        
        .news-item-summary {
            font-size: 14px;
            color: #666;
            line-height: 1.5;
            margin-bottom: 15px;
        }
        
        .news-read-more {
            color: #ff8c00;
            text-decoration: none;
            font-size: 14px;
            font-weight: bold;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        .news-read-more:hover {
            text-decoration: underline;
        }
        
        .news-arrow {
            font-size: 12px;
        }

        /* Events Styles */
        .events-grid {
            display: grid;
            gap: 20px;
        }
        
        .event-item {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-left: 4px solid #2e78c7;
        }
        
        .event-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
        }
        
        .event-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            line-height: 1.3;
            flex: 1;
            margin-right: 15px;
        }
        
        .event-category {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
        }
        
        .event-details {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .event-time, .event-venue {
            font-size: 14px;
            color: #666;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        /* Event Category Colors */
        .category-music { background: #e74c3c; }
        .category-art { background: #9b59b6; }
        .category-theatre { background: #f39c12; }
        .category-sports { background: #27ae60; }
        .category-festivals { background: #e67e22; }
        .category-markets { background: #34495e; }
        .category-food { background: #d35400; }
        .category-other { background: #2e78c7; }

        /* Sports Styles */
        .sports-summary {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            border-left: 4px solid #27ae60;
        }
        
        .sports-summary p {
            margin: 0 0 15px 0;
            color: #333;
            line-height: 1.6;
        }
        
        .sports-read-more {
            color: #27ae60;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
        }
        
        .sports-read-more:hover {
            text-decoration: underline;
        }
        
        .sports-arrow {
            margin-left: 5px;
            font-weight: bold;
        }
        
        .sports-schedules {
            margin-top: 20px;
        }
        
        .schedule-header {
            margin-bottom: 20px;
        }
        
        .schedule-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            text-align: center;
        }
        
        .matches-grid {
            display: grid;
            gap: 15px;
        }
        
        .matches-grid.two-columns {
            grid-template-columns: 1fr 1fr;
        }
        
        .matches-grid.single-column {
            grid-template-columns: 1fr;
        }
        
        .match-item {
            background: white;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            border-left: 3px solid #27ae60;
        }
        
        .match-sport {
            font-size: 11px;
            font-weight: 700;
            color: #27ae60;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        
        .match-title {
            font-size: 15px;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
            line-height: 1.3;
        }
        
        .match-details {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .match-date, .match-venue {
            font-size: 13px;
            color: #666;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .no-matches {
            text-align: center;
            padding: 30px;
            color: #666;
            font-style: italic;
        }
        
        /* RESPONSIVE */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            
            .header-section {
                height: 180px;
                padding: 15px 20px;
            }
            
            .greeting {
                font-size: 20px;
            }
            
            .city-name {
                font-size: 28px;
            }
            
            .sponsors-grid {
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
            }
            
            .sponsor-item {
                padding: 10px;
            }
            
            .sponsor-logo {
                width: 40px;
                height: 40px;
            }
            
            .weather-content {
                flex-direction: column;
                text-align: center;
                gap: 15px;
            }
            
            .weather-header {
                flex-direction: column;
                gap: 5px;
                text-align: center;
            }
            
            .matches-grid.two-columns {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        
        <!-- HEADER WITH BACKGROUND -->
        <div class="header-section">
            <!-- Email client uyumluluğu için img tag kullan -->
            <img src="http://localhost:4000/back.jpg" alt="Header Background" class="header-bg-image">
            <div class="header-overlay"></div>
            <div class="header-logo">INK</div>
            <div class="social-icons">
                <a href="#" class="social-icon">f</a>
                <a href="#" class="social-icon">@</a>
                <a href="#" class="social-icon">X</a>
            </div>
            <div class="greeting">Good morning,</div>
            <div class="city-name">${content.city}!</div>
            <div class="tagline">Here is today's <span style="color: #ffd700;">update</span></div>
        </div>
        
        <!-- SPONSORS SECTION -->
        <div class="sponsors-section">
            <div class="sponsors-title">Powered by our trusted local partners</div>
            <div class="sponsors-grid">
                <div class="sponsor-item">
                    <div class="sponsor-logo">🏠</div>
                    <div class="sponsor-name">Blazing Heart HVAC<br>HVAC Partner</div>
                </div>
                <div class="sponsor-item">
                    <div class="sponsor-logo">🔧</div>
                    <div class="sponsor-name">Go With The Flow Plumbing<br>Plumbing Partner</div>
                </div>
                <div class="sponsor-item">
                    <div class="sponsor-logo">👨</div>
                    <div class="sponsor-name">What's your home worth? Ask<br>Sam Snyder<br>Real Estate Partner</div>
                </div>
                <div class="sponsor-item">
                    <div class="sponsor-logo">👨</div>
                    <div class="sponsor-name">What's your home worth? Ask<br>Sam Snyder<br>Real Estate Partner</div>
                </div>
            </div>
        </div>
        
        <!-- TODAY'S WEATHER -->
        <div class="weather-section">
            <div class="weather-header">
                <div class="weather-title">Today's Weather</div>
                <div class="weather-date">${content.date}</div>
            </div>
            <div class="weather-content">
                <div class="weather-icon">${content.weather?.current?.icon || '☀️'}</div>
                <div class="weather-main">
                    <div class="weather-condition">${content.weather?.current?.condition || content.weather?.condition || 'Clear'}</div>
                    <div class="weather-details">
                        ${content.weather?.current?.temp || content.weather?.high || '25'}°F • ${content.weather?.current?.wind || content.weather?.wind || 'Pleasant weather'}
                    </div>
                </div>
            </div>
                 </div>
         


         <!-- TODAY'S BRIEF -->
         <div class="brief-section">
             <div class="brief-header">
                 <div class="brief-title">Today's Brief</div>
                 <div class="brief-decoration"></div>
             </div>
            <ul class="brief-list">
                ${content.todaysBrief && content.todaysBrief.length > 0 
                    ? content.todaysBrief.map((item: any) => `
                        <li class="brief-item">
                            <span class="brief-arrow">▶</span>
                            ${item.title || item.text || item.content || item}
                        </li>
                    `).join('')
                    : `
                        <li class="brief-item">
                            <span class="brief-arrow">▶</span>
                            Check out today's weather and plan your outdoor activities accordingly.
                        </li>
                        <li class="brief-item">
                            <span class="brief-arrow">▶</span>
                            Local events happening in ${content.city} today and this weekend.
                        </li>
                        <li class="brief-item">
                            <span class="brief-arrow">▶</span>
                            Stay updated with the latest news and developments in your area.
                        </li>
                    `
                }
            </ul>
        </div>
        
        <!-- ADVERTISEMENT -->
        <div class="ad-section">
            <div class="ad-content">
                <div class="ad-quote-left">"</div>
                <div class="ad-quote-right">"</div>
                <div class="ad-title">Discover Local Business</div>
                <div class="ad-subtitle">Connect with trusted local partners</div>
                <div class="ad-description">
                    From home services to professional consultations, find the best local businesses in ${content.city}.
                </div>
                <a href="#" class="ad-button">Explore Now</a>
            </div>
        </div>
        
        <!-- NEWS SECTION -->
        <div class="news-section">
            <div class="news-header">
                <div class="news-title">Local News</div>
                <div class="news-decoration"></div>
            </div>
            <div class="news-grid">
                ${content.news && content.news.length > 0 
                    ? content.news.slice(0, 4).map((item: any) => `
                        <div class="news-item">
                            <div class="news-item-title">${item.title || item.headline || 'News Update'}</div>
                            <div class="news-item-summary">${item.summary || item.snippet || 'Latest news from your city.'}</div>
                            <a href="${item.link || item.originalLink || '#'}" class="news-read-more">
                                Read more <span class="news-arrow">→</span>
                            </a>
                        </div>
                    `).join('')
                    : `<div class="news-item">
                        <div class="news-item-title">Stay Connected</div>
                        <div class="news-item-summary">We're working to bring you the latest local news from ${content.city}.</div>
                       </div>`
                }
            </div>
        </div>

        <!-- EVENTS SECTION -->
        ${content.events && content.events.length > 0 ? `
        <div class="news-section" style="background: #f8f9fa;">
            <div class="news-header">
                <div class="news-title">Local Events</div>
                <div class="news-decoration"></div>
            </div>
            <div class="events-grid">
                ${content.events.slice(0, 3).map((event: any) => `
                    <div class="event-item">
                        <div class="event-header">
                            <div class="event-title">${event.title || 'Event'}</div>
                            <div class="event-category category-other">${event.category || 'Event'}</div>
                        </div>
                        <div class="event-details">
                            <div class="event-time">📅 ${event.date || 'Date TBD'}</div>
                            ${event.venue ? `<div class="event-venue">📍 ${event.venue.name || event.venue}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

                                  <!-- SPORTS SECTION -->
         ${content.sports && content.sports.summary ? `
         <div class="news-section">
             <div class="news-header">
                 <div class="news-title">Sports Updates</div>
                 <div class="news-decoration"></div>
             </div>
             
             <!-- Sports Summary -->
             <div class="sports-summary">
                 <p>${content.sports.summary}</p>
                 ${content.sports.readMoreLink && content.sports.readMoreLink !== '#' ? `
                     <a href="${content.sports.readMoreLink}" class="sports-read-more" target="_blank">
                         Read more <span class="sports-arrow">↗</span>
                     </a>
                 ` : ''}
             </div>

                           <!-- Sports Schedules -->
              ${(() => {
                const allMatches = content.sports?.matches || [];
                if (allMatches.length > 0) {
                  const matchesHtml = allMatches.slice(0, 6).map((match: any) => {
                    const teamsHtml = match.teams ? `<div class="match-teams">🏟️ ${match.teams}</div>` : '';
                    const venueHtml = match.venue ? `<div class="match-venue">📍 ${match.venue}</div>` : '';
                    return `
                              <div class="match-item">
                                  <div class="match-sport">${(match.sport || 'OTHER').toUpperCase()}</div>
                                  <div class="match-title">${match.title || match.teams || 'Game'}</div>
                                  <div class="match-details">
                                      ${teamsHtml}
                                      <div class="match-date">📅 ${match.date || match.time || 'TBD'}</div>
                                      ${venueHtml}
                                  </div>
                              </div>
                          `;
                  }).join('');
                  
                  return `
                  <div class="sports-schedules">
                      <div class="schedule-header">
                          <div class="schedule-title">${content.city} Sports Schedule</div>
                      </div>
                      <div class="matches-grid ${allMatches.length === 1 ? 'single-column' : 'two-columns'}">
                          ${matchesHtml}
                      </div>
                  </div>
                `;
                } else {
                  return `
                  <div class="sports-schedules">
                      <div class="schedule-header">
                          <div class="schedule-title">${content.city} Sports Schedule</div>
                      </div>
                      <div class="no-matches">
                          <p>No upcoming matches found for ${content.city}.</p>
                      </div>
                  </div>
                `;
                }
              })()}
         </div>
         ` : ''}
        
    </div>
</body>
</html>
    `;
    
    return htmlContent;
  }

  // Generate email text (placeholder)
  private generateEmailText(content: EmailContent): string {
    return `${content.city} Günlük Güncellemesi\n\nHava durumu, haberler, etkinlikler ve spor güncellemeleri...`;
  }

  // Test function for manual email sending
  public async sendTestEmail(email: string, city: string) {
    console.log(`🧪 Sending test email to ${email} for ${city}`);
    
    try {
      const content = await this.generateEmailContent(city);
      console.log(`✅ Test email content generated for ${city}`);
      
      // VERİ KONTROLÜ - Veri yoksa email gönderme
      const hasData = this.validateEmailContent(content);
      if (!hasData.isValid) {
        console.log(`⚠️ Insufficient data for ${city}:`, hasData.missing);
        console.log(`📧 Email NOT sent due to missing data`);
        
        // Generate HTML content anyway for preview
        const htmlContent = this.generateEmailHTML(content);
        return { 
          success: false, 
          content, 
          htmlContent,
          error: `Insufficient data: ${hasData.missing.join(', ')}`,
          emailSent: false 
        };
      }
      
      // Generate HTML content
      const htmlContent = this.generateEmailHTML(content);
      
      // EMAIL SENDING DISABLED FOR TESTING - Only showing template
      console.log(`📧 Test email template generated for ${email} (${city}) - EMAIL SENDING DISABLED`);
      console.log(`✅ Data validation passed - ready to send when enabled`);
      
      return { success: true, content, htmlContent, emailSent: false, dataValidation: hasData };
    } catch (error) {
      console.error(`❌ Test email failed:`, error);
      return { success: false, error };
    }
  }

  // Manuel olarak daily email job'ını çalıştır (test için)
  public async runDailyEmailJob() {
    console.log('🧪 Manually triggering daily email job...');
    await this.sendDailyEmails();
  }

  // Stop the scheduler
  public stop() {
    console.log('🛑 Stopping email scheduler...');
    // cron.stop(); // This would stop all cron jobs
    console.log('✅ Email scheduler stopped');
  }
}

// Export singleton instance
export const emailScheduler = new EmailScheduler(); 