import { Request, Response } from 'express';
import { detectEventCategoryWithAI } from './utils/ai';
import { generateSimpleTestTemplate, SimpleTestData } from './utils/simpleTestTemplate';

// Basit date parser fonksiyonu
function parseEventDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  try {
    // Ay isimlerini sayılara çevir
    const monthMap: { [key: string]: number } = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };
    
    // Farklı formatları dene
    const patterns = [
      // "Thu, Jul 31, 8:00 PM"
      /(\w{3}),?\s*(\w{3})\s+(\d{1,2}),?\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i,
      // "Mon, Jul 28 – Sat, Aug 2" (ilk tarihi al)
      /(\w{3}),?\s*(\w{3})\s+(\d{1,2})\s*[–-]/i,
      // "Sun, Aug 17, 3 – 5 PM" 
      /(\w{3}),?\s*(\w{3})\s+(\d{1,2}),?\s+(\d{1,2})\s*[–-]/i
    ];
    
    for (const pattern of patterns) {
      const match = dateString.match(pattern);
      if (match) {
        const [_, dayName, monthName, date, hour, minute, ampm] = match;
        const monthNum = monthMap[monthName.toLowerCase()];
        
        if (monthNum !== undefined) {
          let hourNum = hour ? parseInt(hour) : 0;
          
          // AM/PM dönüşümü
          if (ampm) {
            if (ampm.toLowerCase() === 'pm' && hourNum !== 12) hourNum += 12;
            if (ampm.toLowerCase() === 'am' && hourNum === 12) hourNum = 0;
          }
          
          const eventDate = new Date(2025, monthNum, parseInt(date), hourNum, minute ? parseInt(minute) : 0);
          console.log(`✅ Parsed date: "${dateString}" → ${eventDate.toDateString()}`);
          return eventDate;
        }
      }
    }
    
    console.log(`❌ Could not parse date: "${dateString}"`);
    return null;
  } catch (error) {
    console.log(`❌ Date parsing error: "${dateString}"`);
    return null;
  }
}

export const testEmailHandler = async (req: Request, res: Response) => {
  try {
    const city = req.query.city as string || 'Miami';
    
    console.log(`🧪 Generating test email for ${city}...`);
    
    // GERÇEKVERİLERİ ÇEK - Daha fazla haber için
    const [weatherResponse, briefResponse, newsResponse, eventsResponse, sportsResponse] = await Promise.all([
      fetch(`http://localhost:4000/weather-email?city=${encodeURIComponent(city)}`).then(r => r.json()).catch(() => null),
      fetch(`http://localhost:4000/todays-brief?city=${encodeURIComponent(city)}`).then(r => r.json()).catch(() => null),
      fetch(`http://localhost:4000/news?city=${encodeURIComponent(city)}`).then(r => r.json()).catch(() => null),
      fetch(`http://localhost:4000/events?city=${encodeURIComponent(city)}`).then(r => r.json()).catch(() => null),
      fetch(`http://localhost:4000/sports?city=${encodeURIComponent(city)}`).then(r => r.json()).catch(() => null)
    ]);
    
    console.log(`📰 Raw news fetched:`, newsResponse?.news?.length || 0);
    
    // Gerçek verilerle data oluştur
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
          // /news endpoint'i zaten AI ile filtreliyor - sadece basit kontroller
          const allNews = newsResponse?.news || [];
          console.log(`📊 Starting with ${allNews.length} AI-filtered news items`);
          
          const finalNews = allNews
            .filter((item: any) => {
              // 1. Link kontrolü
              if (!item.link || item.link === '#') {
                console.log(`🚫 No valid link: ${item.title}`);
                return false;
              }
              
              // 2. AI zaten inappropriate'leri filtrelemiş, sadece kontrol et
              if (item.isAppropriate === false) {
                console.log(`🚫 AI marked inappropriate: ${item.title}`);
                return false;
              }
              
              console.log(`✅ PASSED: ${item.title}`);
              return true;
            })
            // 3. Basit duplikasyon kontrolü
            .filter((item: any, index: number, array: any[]) => {
              const currentTitle = (item.title || '').toLowerCase().trim();
              
              const isDuplicate = array.slice(0, index).some((prevItem: any) => {
                const prevTitle = (prevItem.title || '').toLowerCase().trim();
                
                // İlk 6 kelime aynıysa duplikat
                const currentWords = currentTitle.split(' ').slice(0, 6).join(' ');
                const prevWords = prevTitle.split(' ').slice(0, 6).join(' ');
                
                return currentWords === prevWords;
              });
              
              if (isDuplicate) {
                console.log(`🔄 DUPLICATE: ${item.title}`);
                return false;
              }
              
              return true;
            })
            .slice(0, 8); // Maksimum 8 haber
          
          console.log(`🎯 Final news count: ${finalNews.length}`);
          
          // Eğer çok az haber varsa uyar
          if (finalNews.length < 3) {
            console.log(`⚠️ Only ${finalNews.length} news items - consider checking AI filtering`);
          }
          
          return finalNews;
        })(),

        events: await (async () => {
          const rawEvents = (eventsResponse?.events || [])
            .filter((item: any) => {
              // Sadece başlık ve tarih kontrolü
              if (!item.title || !item.date) {
                console.log(`❌ Missing title or date: ${item.title || 'No title'}`);
                return false;
              }
              
              console.log(`✅ Event included: ${item.title} (${item.date})`);
              return true;
            })
            .slice(0, 15); // Biraz fazla al, sıralama sonrası 10 alacağız

          // AI ile tarihleri parse et ve sırala
          const eventsWithDates = await Promise.all(
            rawEvents.map(async (item: any) => {
              const parsedDate = parseEventDate(item.date);
              return {
                ...item,
                parsedDate: parsedDate,
                sortDate: parsedDate || new Date('2099-12-31') // Parse edilemeyen tarihleri sona koy
              };
            })
          );

          // Tarihe göre sırala (yakın olan önce)
          eventsWithDates.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

          // İlk 10'unu al ve final formatına çevir
          const finalEvents = await Promise.all(
            eventsWithDates
              .slice(0, 10)
              .map(async (item: any) => {
                // AI ile kategori belirle
                const category = await detectEventCategoryWithAI(item.title, item.snippet || '');
                
                console.log(`📅 Event sorted: ${item.title} (${item.date}) - Parsed: ${item.parsedDate ? item.parsedDate.toDateString() : 'Failed'}`);
                
                return {
                  title: item.title || 'Event Title Not Available',
                  date: item.date || 'Date not available',
                  venue: typeof item.venue === 'object' ? item.venue?.name || 'Venue not available' : item.venue || 'Venue not available',
                  category: category,
                  link: item.link || '#'
                };
              })
          );

          return finalEvents;
        })(),

        sports: (() => {
          const sportsNews = sportsResponse?.sports || [];
          const upcomingMatches = sportsResponse?.upcomingMatches || {};
          
          console.log(`🏈 Raw sports news:`, sportsNews.length);
          console.log(`🏈 Raw upcoming matches:`, Object.keys(upcomingMatches));
          
          // Spor haberlerinden kısa özet oluştur - AI alanlarını kullan
          const sportsSummary = sportsNews.length > 0 
            ? sportsNews.slice(0, 2).map((item: any) => {
                const summary = item.aiSummary || item.summary || item.aiTitle || item.title || '';
                console.log(`🏈 Using summary: ${summary.substring(0, 50)}...`);
                return summary;
              }).join(' ') 
            : `No recent sports news found for ${city}.`;
          
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
          
          console.log(`🏈 Sports summary: ${sportsSummary.substring(0, 100)}...`);
          console.log(`🏈 Total matches found: ${allMatches.length}`);
          
          return {
            summary: sportsSummary,
            matches: allMatches.slice(0, 8), // Maksimum 8 maç
            readMoreLink: sportsNews.length > 0 ? (sportsNews[0].link || sportsNews[0].originalLink || '#') : '#'
          };
        })()
      };
      
      console.log(`🌤️ Weather data:`, emailData.weather);
      console.log(`📋 Brief items:`, emailData.todaysBrief.length);
      console.log(`📰 News items:`, emailData.news.length);

    // BASİT TEST TEMPLATE'İ KULLAN
    const htmlContent = generateSimpleTestTemplate(emailData as SimpleTestData);
    
    // HTML olarak döndür
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
    
  } catch (error: any) {
    console.error('❌ Test email error:', error);
    res.status(500).json({ 
      error: 'Test email generation failed', 
      details: error.message 
    });
  }
}; 