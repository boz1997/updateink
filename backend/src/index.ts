import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { subscribeHandler } from './subscribe';
import { getUsersHandler, getCityDataHandler, deleteAllDataHandler, deleteAllUsersHandler, deleteCityDataHandler, deleteUserHandler } from './data';
import { getNewsHandler, getTodaysBriefHandler } from './news';
import { getEventsHandler } from './events';
import { getSportsHandler } from './sports';
import { getWeatherHandler, getWeatherForEmailHandler } from './weather';
import { testEmailHandler } from './testEmail';
import { emailScheduler } from './emailScheduler';
import { dataCollectionScheduler } from './dataCollectionScheduler';
import { emailSendingScheduler } from './emailSendingScheduler';

import { clearCache } from './utils/database';

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
app.get('/test-email', testEmailHandler);

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
    
    if (!city) {
      return res.status(400).json({ 
        success: false, 
        error: 'City parameter is required. Example: /collect-city-data?city=Miami' 
      });
    }
    
    console.log(`🧪 Manual data collection for ${city} triggered via API`);
    
    // Tek şehir için veri topla
    await dataCollectionScheduler.collectAndCacheDataForCity(city);
    
    res.json({ 
      success: true, 
      message: `Data collection completed for ${city}`,
      city: city
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

// Manuel email sending job  
app.get('/run-email-sending', async (req, res) => {
  try {
    console.log('🧪 Manual email sending triggered via API');
    
    if (emailSendingScheduler.isSendingRunning()) {
      return res.json({ 
        success: false, 
        message: 'Email sending already running' 
      });
    }
    
    // Background'da çalıştır
    emailSendingScheduler.runEmailSendingJob().catch(error => {
      console.error('❌ Background email sending failed:', error);
    });
    
    res.json({ 
      success: true, 
      message: 'Email sending job started in background' 
    });
  } catch (error: any) {
    console.error('❌ Manual email sending failed:', error);
    res.status(500).json({ success: false, error: error.message });
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
    emailSending: {
      running: emailSendingScheduler.isSendingRunning()
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404 handler
app.use('/*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Server'ı başlat
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/`);
  
  // Email scheduler'ları başlat
  console.log('📊 Starting data collection scheduler...');
  dataCollectionScheduler.start();
  
  console.log('📧 Starting email sending scheduler...');
  emailSendingScheduler.start();
  

  
  // Eski email scheduler (test için)
  console.log('🧪 Starting old email scheduler for testing...');
  emailScheduler.start();
}); 
