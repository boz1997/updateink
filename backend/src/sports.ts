import { Request, Response } from 'express';
import { checkDateData, saveToCache } from './utils/database';
import { fetchFromSerpApi, throttle, serpApiThrottle } from './utils/api';
import { processSportsWithAI, processMatchesWithAI } from './utils/ai';
import { Sport, Match, CategorizedMatches } from './types';

/**
 * Maçları kategorilere ayırır
 * @param matches - İşlenecek maç dizisi
 * @returns Kategorize edilmiş maçlar
 */
const categorizeMatches = (matches: Match[]): CategorizedMatches => {
  const categorized: CategorizedMatches = {
    basketball: [],
    football: [],
    soccer: [],
    tennis: [],
    baseball: [],
    hockey: [],
    volleyball: [],
    golf: [],
    rugby: [],
    boxing: [],
    mma: [],
    racing: [],
    other: []
  };

  matches.forEach(match => {
    const sportLower = match.sport.toLowerCase();
    
    if (sportLower.includes('basketball') || sportLower.includes('basketbol') || sportLower.includes('nba')) {
      categorized.basketball.push(match);
    } else if (sportLower.includes('football') || sportLower.includes('futbol') || sportLower.includes('nfl')) {
      categorized.football.push(match);
    } else if (sportLower.includes('soccer') || sportLower.includes('mls')) {
      categorized.soccer.push(match);
    } else if (sportLower.includes('tennis') || sportLower.includes('tenis')) {
      categorized.tennis.push(match);
    } else if (sportLower.includes('baseball') || sportLower.includes('mlb')) {
      categorized.baseball.push(match);
    } else if (sportLower.includes('hockey') || sportLower.includes('hokey') || sportLower.includes('nhl')) {
      categorized.hockey.push(match);
    } else if (sportLower.includes('volleyball') || sportLower.includes('voleybol')) {
      categorized.volleyball.push(match);
    } else if (sportLower.includes('golf')) {
      categorized.golf.push(match);
    } else if (sportLower.includes('rugby')) {
      categorized.rugby.push(match);
    } else if (sportLower.includes('boxing') || sportLower.includes('boks')) {
      categorized.boxing.push(match);
    } else if (sportLower.includes('mma') || sportLower.includes('ufc')) {
      categorized.mma.push(match);
    } else if (sportLower.includes('racing') || sportLower.includes('yarış') || sportLower.includes('f1') || sportLower.includes('nascar')) {
      categorized.racing.push(match);
    } else {
      categorized.other.push(match);
    }
  });

  return categorized;
};

/**
 * Spor verilerini getiren handler
 * Cache kontrolü yapar, gerekirse API'den veri çeker ve AI ile işler
 */
export const getSportsHandler = async (req: Request, res: Response) => {
  const city = req.query.city as string;
  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    const override = (req.query.date as string) || '';
    const isValidYMD = /^\d{4}-\d{2}-\d{2}$/.test(override);
    const dateYMD = isValidYMD 
      ? override 
      : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    console.log(`⚽ Checking sports cache for ${city} on ${dateYMD}`);

    // 1. Cache'den veri kontrol et
    const cachedResult = await checkDateData(city, dateYMD, 'sports');
    
    if (cachedResult && cachedResult.exists) {
      console.log(`✅ Cache hit for ${city} sports`);
      return res.json({ 
        sports: cachedResult.data.sports, 
        upcomingMatches: cachedResult.data.upcomingMatches,
        fromCache: true 
      });
    }

    // 2. Cache'de yoksa API'den çek
    console.log(`🔄 Cache miss for ${city} sports, fetching from API`);
    
    // Tek sorgu ile tüm spor verilerini çek (optimize edildi)
    await serpApiThrottle(); // Rate limiting
    const sportsQuery = `${city} sports news events matches schedule`;
    console.log(`🏈 Sports Debug - Query: "${sportsQuery}"`);
    
    const response = await fetchFromSerpApi('google_news', sportsQuery, { num: 25 }) as any;
    console.log(`🏈 Sports Debug - Raw response:`, {
      hasResponse: !!response,
      responseType: typeof response,
      keys: response ? Object.keys(response) : 'no response'
    });
    
    const allSportsData = response.news_results || [];
    console.log(`🏈 Sports Debug - News results:`, {
      count: allSportsData.length,
      firstItem: allSportsData.length > 0 ? {
        title: allSportsData[0].title,
        link: allSportsData[0].link,
        snippet: allSportsData[0].snippet?.substring(0, 100)
      } : 'no items'
    });
    
    console.log(`📊 Fetched ${allSportsData.length} sports items with single query`);

    // AI ile hem haber hem maç verilerini işle - tüm veriyi her ikisi için de kullan
    console.log(`🤖 Processing ${allSportsData.length} items for sports news with AI`);
    
    // AI processing'i geri aktif et
    const processedSports = await processSportsWithAI(allSportsData, 10);
    const processedMatches = await processMatchesWithAI(allSportsData, 15);

    // 4. TÜM veriyi maç olarak da işle - AI ayıracak
    console.log(`🤖 Processing ${allSportsData.length} items for matches with AI`);
    
    // 5. Maçları kategorilere ayır
    const categorizedMatches = categorizeMatches(processedMatches);

    // 6. Cache'e kaydet
    if (isValidYMD) {
      await saveToCache(city, dateYMD, 'sports', {
        sports: processedSports,
        upcomingMatches: categorizedMatches
      });
    }

    res.json({ 
      sports: processedSports, 
      upcomingMatches: categorizedMatches,
      fromCache: false,
      persisted: isValidYMD
    });

  } catch (error: any) {
    console.error('❌ Sports fetch error:', error);
    res.status(500).json({ 
      error: 'Sports fetch error', 
      details: error.message 
    });
  }
}; 