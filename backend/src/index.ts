import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { subscribeHandler } from './subscribe';
import { getUsersHandler, getCityDataHandler, deleteAllDataHandler, deleteAllUsersHandler, deleteCityDataHandler, deleteUserHandler } from './data';
import { getNewsHandler, getTodaysBriefHandler } from './news';
import { getEventsHandler } from './events';
import { getSportsHandler } from './sports';
import { getWeatherHandler, getWeatherForEmailHandler } from './weather';
// Test imports removed for production
import { dataCollectionScheduler } from './dataCollectionScheduler';
import { beehiivScheduler } from './beehiivScheduler';
import { clearCache } from './utils/database';
import { createBeehiivPost } from './utils/beehiiv';
import { getCachedCityDataForToday, getCachedCityDataForDate } from './utils/cityData';
import { buildBeehiivHtmlFromCityData, toEmailSafeHtml } from './utils/beehiivTemplate';
import { renderMjml, mapToVM, toEmailSafeBody } from './utils/mjmlRenderer';
import { getSupabaseClient } from './utils/database';

// Environment variables'ları yükle
dotenv.config();

// API anahtarlarını kontrol et
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SERPAPI_KEY',
  'OPENAI_API_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn('⚠️ Missing environment variables:', missingVars);
}

const app = express();
const PORT = process.env.PORT || 4000;

// CORS yapılandırması - Environment variable ile
console.log('🔧 Environment ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [
      'http://localhost:3000', 
      'http://127.0.0.1:3000',
      'https://updateink-4xtji78z3-berk-ozs-projects.vercel.app',
      'https://updateink-hmh7qw4uq-berk-ozs-projects.vercel.app',
      'https://updateink-nd9e6Lj0e-berk-ozs-projects.vercel.app',
      'https://updateink-bis9jph3c-berk-ozs-projects.vercel.app',
      'https://updateink.vercel.app'
    ];

console.log('🔧 CORS Allowed Origins:', allowedOrigins);
console.log('🔧 Environment variables loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
});

app.use(cors({
  origin: (origin, callback) => {
    console.log('🔧 CORS Request from origin:', origin);
    console.log('🔧 Allowed origins:', allowedOrigins);
    
    if (!origin || allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origin allowed');
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON body parser
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log('📥 Request:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Beehiiv test post creation endpoint
app.post('/beehiiv/test-post', async (req, res) => {
  try {
    const { title, html, segmentId, emailSubject } = req.body || {};
    if (!title || !html || !segmentId) {
      return res.status(400).json({
        success: false,
        error: 'title, html and segmentId are required'
      });
    }

    const result = await createBeehiivPost({
      title,
      html,
      segmentIds: [segmentId],
      status: 'confirmed',
      hideFromFeed: true,
      emailSubject: emailSubject || title
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Beehiiv post created successfully!',
      postId: result.postId,
      response: result.response
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Schedule Beehiiv post from cached content with a delay
// Example:
// GET /beehiiv/schedule-from-cache?city=Fishers&subject=Fishers%20Update&date=tomorrow&delayMinutes=120
app.get('/beehiiv/schedule-from-cache', async (req, res) => {
  try {
    const city = (req.query.city as string) || '';
    const subject = (req.query.subject as string) || '';
    const dateParam = (req.query.date as string) || 'today';
    const delayMinutes = parseInt((req.query.delayMinutes as string) || '120', 10);

    if (!city || !subject) {
      return res.status(400).json({ success: false, error: 'city and subject are required' });
    }

    // Resolve date
    let dateYMD = dateParam;
    if (dateParam.toLowerCase() === 'today') {
      dateYMD = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    } else if (dateParam.toLowerCase() === 'tomorrow') {
      const now = new Date();
      const t = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      dateYMD = new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    }

    // Fetch cached data for that date
    const cached = await getCachedCityDataForDate(city, dateYMD);
    if (!cached) {
      return res.status(404).json({ success: false, error: `No cache for ${city} on ${dateYMD}` });
    }

    // Render MJML → body content
    const compiledHtml = await renderMjml(cached);
    const bodyContent = toEmailSafeBody(compiledHtml);

    // Schedule time (UTC ISO)
    const scheduledAtIso = new Date(Date.now() + Math.max(1, delayMinutes) * 60 * 1000).toISOString();

    const citySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const result = await createBeehiivPost({
      title: subject,
      html: bodyContent,
      citySlug,
      status: 'confirmed',
      scheduledAt: scheduledAtIso,
      hideFromFeed: true,
      emailSubject: subject
    });

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      message: 'Beehiiv post scheduled successfully',
      postId: result.postId,
      scheduledAt: scheduledAtIso,
      city,
      date: dateYMD
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET endpoint for testing Beehiiv post creation via browser
app.get('/beehiiv/test-post', async (req, res) => {
  try {
    const { title, html, segmentId, emailSubject } = req.query;
    
    if (!title || !html || !segmentId) {
      return res.status(400).json({
        success: false,
        error: 'title, html and segmentId query parameters are required',
        example: 'http://localhost:4000/beehiiv/test-post?title=Test&html=<h1>Hello</h1>&segmentId=xxx&emailSubject=Test'
      });
    }

    const result = await createBeehiivPost({
      title: title as string,
      html: html as string,
      segmentIds: [segmentId as string],
      status: 'confirmed',
      hideFromFeed: true,
      emailSubject: emailSubject as string || title as string
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Beehiiv post created successfully!',
      postId: result.postId,
      response: result.response
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create Beehiiv post from cached daily data without touching existing email flow
// Example:
// GET /beehiiv/create-from-cache?city=Miami&segmentId=seg_xxx&subject=Daily%20Miami
app.get('/beehiiv/create-from-cache', async (req, res) => {
  try {
    const { city, segmentId, subject } = req.query;
    if (!city || !segmentId || !subject) {
      return res.status(400).json({
        success: false,
        error: 'city, segmentId, and subject query parameters are required',
        example: 'http://localhost:4000/beehiiv/create-from-cache?city=Miami&segmentId=seg_your-segment-id&subject=Daily%20Update'
      });
    }

    // 1) Fetch cached content same as emailSendingScheduler
    const cachedData = await getCachedCityDataForToday(city as string);
    if (!cachedData) {
      return res.status(404).json({ success: false, error: `No cached data found for ${city} today.` });
    }

    // 2) Build HTML content using the existing professional template
    const htmlContent = buildBeehiivHtmlFromCityData(cachedData, emailScheduler.generateEmailHTML);
    
    // 3) Convert to email-safe format (CSS inline + body content only)
    const emailSafe = toEmailSafeHtml(htmlContent);

    // 4) Create Beehiiv post
    const result = await createBeehiivPost({
      title: subject as string,
      html: emailSafe,  // <-- Email-safe HTML
      segmentIds: [segmentId as string],
      status: 'confirmed',
      hideFromFeed: true,
      emailSubject: subject as string
    });

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      message: 'Beehiiv post created successfully!',
      postId: result.postId,
      response: result.response,
      note: 'HTML converted to email-safe format with inline CSS'
    });

  } catch (error: any) {
    console.error('Error creating Beehiiv post from cache:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active cities for dropdown
app.get('/cities', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data: cities, error } = await supabase
      .from('city_pub')
      .select('city_slug, city_name, state_code, state_name')
      .eq('is_active', true)
      .order('state_name', { ascending: true })
      .order('city_name', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Group by state for frontend dropdown
    const groupedByState = cities?.reduce((acc: any, city) => {
      const stateKey = `${city.state_name} (${city.state_code})`;
      if (!acc[stateKey]) {
        acc[stateKey] = [];
      }
      acc[stateKey].push({
        value: city.city_slug,
        label: city.city_name
      });
      return acc;
    }, {}) || {};

    res.json({ success: true, cities: groupedByState });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Send to single city (new simplified endpoint)
app.get('/beehiiv/send-city', async (req, res) => {
  try {
    const { city, subject } = req.query as any;
    if (!city || !subject) {
      return res.status(400).json({ success: false, error: 'city and subject are required' });
    }

    const citySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const cached = await getCachedCityDataForToday(city);
    if (!cached) return res.status(404).json({ success: false, error: `No cache for today for ${city}` });

    const compiledHtml = await renderMjml(cached);
    const bodyContent = toEmailSafeBody(compiledHtml);

    const result = await createBeehiivPost({
      title: subject,
      html: bodyContent,
      citySlug: citySlug, // Will lookup publication_id from DB
      status: 'confirmed',
      hideFromFeed: true,
      emailSubject: subject
      // No segmentIds = send to all subscribers of that publication
    });

    if (!result.success) return res.status(500).json({ success: false, error: result.error });

    res.json({ 
      success: true, 
      postId: result.postId, 
      response: result.response,
      city: city,
      citySlug: citySlug
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// MJML önizleme: derlenmiş HTML döner
app.get('/preview-beehiiv', async (req, res) => {
  try {
    const city = (req.query.city as string) || 'Boston';
    const dateParam = (req.query.date as string) || '';
    let cached;
    if (dateParam) {
      let dateYMD = dateParam;
      if (dateParam.toLowerCase() === 'today') {
        dateYMD = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
      } else if (dateParam.toLowerCase() === 'tomorrow') {
        const now = new Date();
        const t = new Date(now.getTime() + 24*60*60*1000);
        dateYMD = new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      }
      cached = await getCachedCityDataForDate(city, dateYMD);
    } else {
      cached = await getCachedCityDataForToday(city);
    }
    if (!cached) return res.status(404).send('No cache for today');

    const html = await renderMjml(cached);
    res.set('Content-Type', 'text/html; charset=utf-8').send(html);
  } catch (e: any) {
    res.status(500).send(e.message);
  }
});

// MJML ile Beehiiv gönderim: body_content olarak inline CSS + sadece <body>
app.get('/beehiiv/send-mjml', async (req, res) => {
  try {
    const { city, segmentId, subject } = req.query as any;
    if (!city || !segmentId || !subject) {
      return res.status(400).json({ success: false, error: 'city, segmentId, subject gereklidir' });
    }

    const cached = await getCachedCityDataForToday(city);
    if (!cached) return res.status(404).json({ success: false, error: `No cache for today for ${city}` });

    const compiledHtml = await renderMjml(cached);
    const bodyContent = toEmailSafeBody(compiledHtml);

    const result = await createBeehiivPost({
      title: subject,
      html: bodyContent,
      segmentIds: [segmentId],
      status: 'confirmed',
      hideFromFeed: true,
      emailSubject: subject
    });

    if (!result.success) return res.status(500).json({ success: false, error: result.error });

    res.json({ success: true, postId: result.postId, response: result.response });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// OPTIONS request handler for CORS preflight
app.options('*', (req, res) => {
  console.log('🔧 OPTIONS preflight request received');
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// API Routes - En basit hali
app.post('/subscribe', subscribeHandler);
app.get('/users', getUsersHandler);
app.delete('/delete-all-users', deleteAllUsersHandler);
app.get('/data', getCityDataHandler);
app.delete('/delete-all-data', deleteAllDataHandler);
app.get('/news', getNewsHandler);
app.get('/todays-brief', getTodaysBriefHandler);
app.get('/events', getEventsHandler);
app.get('/sports', getSportsHandler);
app.get('/weather', getWeatherHandler);
app.get('/weather-email', getWeatherForEmailHandler);
app.delete('/delete-user', deleteUserHandler);
app.delete('/delete-city-data', deleteCityDataHandler);
// Production: Test endpoints removed

// Manuel email test endpoints
app.get('/manual-daily-email', async (req, res) => {
  try {
    console.log('🧪 Manual daily email triggered via API');
    await emailScheduler.runDailyEmailJob();
    res.json({ success: true, message: 'Daily email job completed' });
  } catch (error: any) {
    console.error('❌ Manual daily email failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/test-scheduler-email', async (req, res) => {
  try {
    const { email, city } = req.query;
    if (!email || !city) {
      return res.status(400).json({ error: 'Email and city parameters required' });
    }
    
    const result = await emailScheduler.sendTestEmail(email as string, city as string);
    
    if (result.success && result.htmlContent) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(result.htmlContent);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEW SYSTEM ENDPOINTS

// Manuel data collection job
app.get('/run-data-collection', async (req, res) => {
  try {
    console.log('🧪 Manual data collection triggered via API');
    
    if (dataCollectionScheduler.isCollectionRunning()) {
      return res.json({ 
        success: false, 
        message: 'Data collection already running' 
      });
    }
    
    // Background'da çalıştır
    dataCollectionScheduler.runDataCollectionJob().catch(error => {
      console.error('❌ Background data collection failed:', error);
    });
    
    res.json({ 
      success: true, 
      message: 'Data collection job started in background' 
    });
  } catch (error: any) {
    console.error('❌ Manual data collection failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tek şehir için data collection job
app.get('/collect-city-data', async (req, res) => {
  try {
    const city = req.query.city as string;
    const overrideDate = req.query.date as string | undefined; // YYYY-MM-DD
    
    if (!city) {
      return res.status(400).json({ 
        success: false, 
        error: 'City parameter is required. Example: /collect-city-data?city=Miami' 
      });
    }
    
    // Hedef tarihi belirle: date query varsa onu kullan, yoksa yarın (yerel saat)
    let targetDateYMD: string;
    if (overrideDate && /^\d{4}-\d{2}-\d{2}$/.test(overrideDate)) {
      targetDateYMD = overrideDate;
    } else {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      targetDateYMD = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0];
    }
    
    console.log(`🧪 Manual data collection for ${city} (target ${targetDateYMD}) triggered via API`);
    
    // Tek şehir için veri topla
    await dataCollectionScheduler.collectAndCacheDataForCity(city, targetDateYMD);
    
    res.json({ 
      success: true, 
      message: `Data collection completed for ${city} on ${targetDateYMD}`,
      city: city,
      date: targetDateYMD
    });
  } catch (error: any) {
    console.error(`❌ Manual data collection for ${req.query.city} failed:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      city: req.query.city 
    });
  }
});

// Cache temizleme endpoint'i
app.get('/clear-cache', async (req, res) => {
  try {
    const city = req.query.city as string;
    const type = req.query.type as string;
    
    const success = await clearCache(city, type);
    
    if (success) {
      res.json({ 
        success: true, 
        message: `Cache cleared for ${city || 'all cities'} ${type || 'all types'}` 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to clear cache' 
      });
    }
  } catch (error: any) {
    console.error('❌ Cache clear error:', error);
    res.status(500).json({ 
      error: 'Cache clear error', 
      details: error.message 
    });
  }
});

// System status
app.get('/scheduler-status', (req, res) => {
  res.json({
    dataCollection: {
      running: dataCollectionScheduler.isCollectionRunning()
    },
    timestamp: new Date().toISOString()
  });
});

// Production: API test endpoints removed
/*
app.get('/test-apis', async (req, res) => {
  try {
    console.log('🧪 Testing all APIs...');
    const results = {
      serpApi: { status: 'pending' as string, error: null as string | null },
      openWeather: { status: 'pending' as string, error: null as string | null },
      eventbrite: { status: 'pending' as string, error: null as string | null },
      gmail: { status: 'pending' as string, error: null as string | null }
    };

    // Test SerpAPI
    try {
      const serpResponse = await fetch(`https://serpapi.com/search?engine=google_news&q=test&api_key=${process.env.SERPAPI_KEY}`);
      results.serpApi.status = serpResponse.ok ? 'success' : 'failed';
      if (!serpResponse.ok) {
        const errorText = await serpResponse.text();
        results.serpApi.error = `HTTP ${serpResponse.status}: ${errorText}`;
      }
    } catch (error: any) {
      results.serpApi.status = 'failed';
      results.serpApi.error = error.message;
    }

    // Test OpenWeather
    try {
      const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=New York&appid=${process.env.WEATHER_API_KEY}&units=imperial`);
      results.openWeather.status = weatherResponse.ok ? 'success' : 'failed';
      if (!weatherResponse.ok) {
        const errorText = await weatherResponse.text();
        results.openWeather.error = `HTTP ${weatherResponse.status}: ${errorText}`;
      }
    } catch (error: any) {
      results.openWeather.status = 'failed';
      results.openWeather.error = error.message;
    }

    // Test Gmail
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
      
      // Verify connection
      await transporter.verify();
      results.gmail.status = 'success';
    } catch (error: any) {
      results.gmail.status = 'failed';
      results.gmail.error = error.message;
    }

    console.log('🧪 API Test Results:', results);
    res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ API Test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
*/

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Server'ı başlat
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/`);
  
  // Schedule özeti göster
  const { getScheduleSummary } = require('./config/scheduleConfig');
  console.log(getScheduleSummary());
  
  // Scheduler'ları başlat
  console.log('📊 Starting data collection scheduler...');
  dataCollectionScheduler.start();
  
  console.log('📧 Starting Beehiiv scheduler...');
  beehiivScheduler.start();
}); 

// 404 handler (en sonda kalmalı)
app.use('/*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// MJML önizleme: derlenmiş HTML döner
app.get('/preview-beehiiv', async (req, res) => {
  try {
    const city = (req.query.city as string) || 'Boston';
    const cached = await getCachedCityDataForToday(city);
    if (!cached) return res.status(404).send('No cache for today');

    const html = await renderMjml(cached);
    res.set('Content-Type', 'text/html; charset=utf-8').send(html);
  } catch (e: any) {
    res.status(500).send(e.message);
  }
});

// MJML ile Beehiiv gönderim: body_content olarak inline CSS + sadece <body>
app.get('/beehiiv/send-mjml', async (req, res) => {
  try {
    const { city, segmentId, subject } = req.query as any;
    if (!city || !segmentId || !subject) {
      return res.status(400).json({ success: false, error: 'city, segmentId, subject gereklidir' });
    }

    const cached = await getCachedCityDataForToday(city);
    if (!cached) return res.status(404).json({ success: false, error: `No cache for today for ${city}` });

    const compiledHtml = await renderMjml(cached);
    const bodyContent = toEmailSafeBody(compiledHtml);

    const result = await createBeehiivPost({
      title: subject,
      html: bodyContent,
      segmentIds: [segmentId],
      status: 'confirmed',
      hideFromFeed: true,
      emailSubject: subject
    });

    if (!result.success) return res.status(500).json({ success: false, error: result.error });

    res.json({ success: true, postId: result.postId, response: result.response });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
}); 
