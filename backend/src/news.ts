import { Request, Response } from 'express';
import { checkDateData, saveToCache } from './utils/database';
import { fetchFromSerpApi, serpApiThrottle } from './utils/api';
import { processNewsWithAI } from './utils/ai';

/**
 * Haber verilerini getiren handler
 * Cache kontrolü yapar, gerekirse API'den veri çeker ve AI ile işler
 */
export const getNewsHandler = async (req: Request, res: Response) => {
  const city = req.query.city as string;
  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📰 Checking news cache for ${city} on ${today}`);

    // 1. Cache'den veri kontrol et
    const cachedResult = await checkDateData(city, today, 'news');
    
    if (cachedResult && cachedResult.exists) {
      console.log(`✅ Cache hit for ${city} news`);
      return res.json({ news: cachedResult.data, fromCache: true });
    }

    // 2. Cache'de yoksa API'den çek
    console.log(`🔄 Cache miss for ${city} news, fetching from API`);
    
    // Rate limiting uygula
    await serpApiThrottle();
    
    const response = await fetchFromSerpApi('google_news', city, { num: 30 }) as any;
    const allNews = response.news_results || [];
    const rawNews = allNews.slice(0, 30); // Maksimum 30 haber
    console.log(`📊 Fetched ${allNews.length} news, using first 30`);

    // 3. OpenAI ile haberleri işle
    console.log(`🤖 Processing ${rawNews.length} news items with AI`);
    const processedNews = await processNewsWithAI(rawNews, city, 20);
    console.log(`✅ After AI filtering: ${processedNews.length} relevant news items`);

    // 4. Cache'e kaydet
    await saveToCache(city, today, 'news', processedNews);

    res.json({ news: processedNews, fromCache: false });

  } catch (error: any) {
    console.error('❌ News fetch error:', error);
    res.status(500).json({ 
      error: 'News fetch error', 
      details: error.message 
    });
  }
};

/**
 * Email template için Today's Brief - sadece 5 haber başlığı
 */
export const getTodaysBriefHandler = async (req: Request, res: Response) => {
  const city = req.query.city as string;
  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📋 Getting today's brief for ${city} on ${today}`);

    // 1. Cache'den veri kontrol et
    const cachedResult = await checkDateData(city, today, 'news');
    
    let newsData;
    if (cachedResult && cachedResult.exists) {
      console.log(`✅ Cache hit for ${city} news (brief)`);
      newsData = cachedResult.data;
    } else {
      // 2. Cache'de yoksa API'den çek
      console.log(`🔄 Cache miss for ${city} news (brief), fetching from API`);
      
      // Rate limiting uygula
      await serpApiThrottle();
      
      const response = await fetchFromSerpApi('google_news', city, { num: 30 }) as any;
      const allNews = response.news_results || [];
      const rawNews = allNews.slice(0, 30);
      
      // AI ile işle
      newsData = await processNewsWithAI(rawNews, city, 20);
      
      // Cache'e kaydet
      await saveToCache(city, today, 'news', newsData);
    }

    // 3. Sadece ilk 5 haberin başlığını al
    const briefItems = (newsData || [])
      .slice(0, 5)
      .map((item: any) => ({
        title: item.title || item.headline || 'No title'
      }));

    console.log(`📋 Returning ${briefItems.length} brief items for ${city}`);
    res.json({ 
      brief: briefItems, 
      fromCache: cachedResult && cachedResult.exists 
    });

  } catch (error: any) {
    console.error('❌ Today\'s brief fetch error:', error);
    res.status(500).json({ 
      error: 'Today\'s brief fetch error', 
      details: error.message 
    });
  }
}; 