import OpenAI from 'openai';

/**
 * OpenAI client instance'ını oluşturur ve yönetir
 * Singleton pattern kullanarak tek bir instance döndürür
 */
let openaiClient: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    
    openaiClient = new OpenAI({
      apiKey: apiKey.trim(),
    });
  }
  
  return openaiClient;
};

/**
 * Manuel negatif kelime kontrolü
 * @param text - Kontrol edilecek metin
 * @returns true if negative content detected
 */
export const containsNegativeContent = (text: string): boolean => {
  const negativeKeywords = [
    'death', 'dead', 'died', 'killed', 'murder', 'homicide', 'suicide',
    'accident', 'crash', 'fatal', 'injury', 'wounded', 'shot', 'stabbed',
    'disease', 'outbreak', 'epidemic', 'pandemic', 'virus', 'infection',
    'crime', 'robbery', 'theft', 'assault', 'rape', 'abuse', 'violence',
    'terrorism', 'bomb', 'explosion', 'fire', 'disaster', 'emergency',
    'crisis', 'tragedy', 'funeral', 'obituary', 'memorial', 'victim',
    'suspect', 'arrest', 'jail', 'prison', 'conviction', 'sentence',
    'protest', 'riot', 'demonstration', 'conflict', 'war', 'battle',
    'casualty', 'casualties', 'missing', 'disappeared', 'kidnapped',
    'legionnaires', 'legionella', 'contamination', 'poisoning'
  ];
  
  const lowerText = text.toLowerCase();
  return negativeKeywords.some(keyword => lowerText.includes(keyword));
};

/**
 * OpenAI ile haber işleme
 * @param news - İşlenecek haber dizisi
 * @param city - Şehir adı
 * @param maxItems - Maksimum işlenecek haber sayısı
 */
export const processNewsWithAI = async (
  news: any[], 
  city: string, 
  maxItems: number = 20
): Promise<any[]> => {
  const openai = getOpenAIClient();
  const processedNews: any[] = [];
  
  // Maksimum haber sayısını sınırla
  const newsToProcess = news.slice(0, maxItems);
  
  console.log(`🤖 Processing ${newsToProcess.length} news items with AI for ${city}`);
  
  for (const item of newsToProcess) {
    try {
      const prompt = `
Analyze this news article and evaluate it according to the following STRICT criteria:

News Title: "${item.title}"
${item.snippet ? `News Snippet: "${item.snippet}"` : ''}

Please respond with a JSON object:
{
  "isRelevant": true/false,
  "isAppropriate": true/false,
  "isPositive": true/false,
  "title": "cleaned title (max 80 characters)",
  "summary": "brief summary in 1-2 sentences (max 150 characters)"
}

STRICT CRITERIA:
1. isRelevant: Is this news directly relevant to people living in or visiting ${city}?
2. isAppropriate: Is this news appropriate for a general audience newsletter? (no violence, explicit content, etc.)
3. isPositive: Is this news POSITIVE, UPLIFTING, or NEUTRAL? REJECT if it contains:
   - Death, injury, violence, crime, accidents
   - Disease outbreaks, health emergencies
   - Tragedies, disasters, crises
   - Negative political conflicts, protests, riots
   - Any content that could upset or worry readers

4. title: Clean, concise version of the title
5. summary: Brief, informative summary

BE EXTREMELY STRICT - Only include POSITIVE, UPLIFTING, or NEUTRAL news that makes readers feel good about their city.
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        try {
          const result = JSON.parse(response);
          if (result.isRelevant && result.isAppropriate && result.isPositive) {
            processedNews.push({
              title: result.title || item.title,
              summary: result.summary,
              link: item.link,
              date: item.date,
              source: item.source,
              isRelevant: true,
              isAppropriate: true,
              isPositive: true
            });
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
        }
      }
    } catch (error) {
      console.error('AI processing error:', error);
    }
  }
  
  console.log(`✅ AI processed ${processedNews.length} relevant news items`);
  return processedNews;
};

/**
 * AI ile etkinlik kategorisi belirleme
 * @param title - Etkinlik başlığı
 * @param snippet - Etkinlik açıklaması (opsiyonel)
 */
export const detectEventCategoryWithAI = async (title: string, snippet?: string): Promise<string> => {
  if (!title || typeof title !== 'string') {
    return 'Other';
  }

  try {
    const openai = getOpenAIClient();
    
    const prompt = `
Analyze this event carefully and categorize it into the MOST SPECIFIC category:

Categories:
- Music: concerts, bands, singers, DJs, music festivals
- Art: galleries, exhibitions, museums, art shows, visual arts
- Theatre: plays, musicals, comedy shows, drama, performances
- Sports: games, matches, races, athletic events, sports competitions
- Festivals: cultural festivals, food festivals, celebrations, community events
- Markets: farmers markets, flea markets, craft fairs, bazaars
- Food: restaurant events, food tastings, culinary events, dining
- Other: lectures, workshops, business events, general entertainment

Event Title: "${title}"
${snippet ? `Event Description: "${snippet}"` : ''}

Look for key words and context clues. Be precise - don't default to Music unless it's clearly a musical event.

Respond with only ONE category name: Music, Art, Theatre, Sports, Festivals, Markets, Food, or Other.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 20
    });

    const category = completion.choices[0]?.message?.content?.trim();
    
    // Geçerli kategorilerden birini döndür
    const validCategories = ['Music', 'Art', 'Theatre', 'Sports', 'Festivals', 'Markets', 'Food', 'Other'];
    return category && validCategories.includes(category) ? category : 'Other';
  } catch (error) {
    console.error('AI category detection error:', error);
    // AI hatası durumunda basit kategori tespiti yap
    return getBasicCategory(title);
  }
};

/**
 * AI ile spor türü emoji belirleme
 * @param teamName - Takım adı
 * @param sport - Spor türü
 */
export const detectSportEmojiWithAI = async (teamName: string, sport: string): Promise<string> => {
  try {
    const openai = getOpenAIClient();
    
    const prompt = `
Determine the best emoji for this sports team/sport:
Team: ${teamName}
Sport: ${sport}

Choose the most appropriate emoji from these options:
⚽ - Soccer/Football
🏀 - Basketball  
🏈 - American Football
⚾ - Baseball
🏒 - Hockey
🎾 - Tennis
🏐 - Volleyball
🏓 - Table Tennis
🏸 - Badminton
🥊 - Boxing
🏆 - General Sports/Trophy
🏟️ - Stadium/General

Respond with only the emoji character.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 5
    });

    const emoji = completion.choices[0]?.message?.content?.trim();
    
    // Emoji karakteri kontrolü
    if (emoji && emoji.length <= 4) {
      return emoji;
    }
    
    return getSportEmoji(sport);
  } catch (error) {
    console.error('AI emoji detection error:', error);
    return getSportEmoji(sport);
  }
};

/**
 * Basit spor emoji tespiti (AI hatası durumunda fallback)
 */
function getSportEmoji(sport: string): string {
  const sportLower = sport.toLowerCase();
  
  if (sportLower.includes('soccer') || sportLower.includes('football') && !sportLower.includes('american')) {
    return '⚽';
  } else if (sportLower.includes('basketball')) {
    return '🏀';
  } else if (sportLower.includes('american football') || sportLower.includes('nfl')) {
    return '🏈';
  } else if (sportLower.includes('baseball')) {
    return '⚾';
  } else if (sportLower.includes('hockey')) {
    return '🏒';
  } else if (sportLower.includes('tennis')) {
    return '🎾';
  } else if (sportLower.includes('volleyball')) {
    return '🏐';
  } else if (sportLower.includes('boxing')) {
    return '🥊';
  } else {
    return '🏆';
  }
}

/**
 * Basit kategori tespiti (AI hatası durumunda fallback)
 */
function getBasicCategory(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('music') || lowerTitle.includes('concert') || lowerTitle.includes('band') || lowerTitle.includes('singer')) {
    return 'Music';
  } else if (lowerTitle.includes('art') || lowerTitle.includes('gallery') || lowerTitle.includes('exhibition') || lowerTitle.includes('museum')) {
    return 'Art';
  } else if (lowerTitle.includes('theatre') || lowerTitle.includes('theater') || lowerTitle.includes('play') || lowerTitle.includes('comedy') || lowerTitle.includes('drama')) {
    return 'Theatre';
  } else if (lowerTitle.includes('sport') || lowerTitle.includes('game') || lowerTitle.includes('match') || lowerTitle.includes('race')) {
    return 'Sports';
  } else if (lowerTitle.includes('festival') || lowerTitle.includes('fest') || lowerTitle.includes('celebration')) {
    return 'Festivals';
  } else if (lowerTitle.includes('market') || lowerTitle.includes('fair') || lowerTitle.includes('farmers')) {
    return 'Markets';
  } else if (lowerTitle.includes('food') || lowerTitle.includes('restaurant') || lowerTitle.includes('dining')) {
    return 'Food';
  } else {
    return 'Other';
  }
}

/**
 * OpenAI ile spor haberlerini işle
 * @param sportsNews - İşlenecek spor haberleri
 * @param maxItems - Maksimum işlenecek haber sayısı
 */
export const processSportsWithAI = async (
  sportsNews: any[], 
  maxItems: number = 10
): Promise<any[]> => {
  const openai = getOpenAIClient();
  const processedSports: any[] = [];
  
  const newsToProcess = sportsNews.slice(0, maxItems);
  
  console.log(`🤖 Processing ${newsToProcess.length} sports news items with AI`);
  
  for (const news of newsToProcess) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a sports editor. Create a clear, informative 1-2 sentence summary in English. Always provide a summary, never leave it empty."
          },
          {
            role: "user",
            content: `Process this sports news: "${news.title}"\n\nSummary: ${news.snippet || 'No summary'}\n\nCreate a JSON response:\n{\n  "aiTitle": "Original English title (keep as is)",\n  "aiSummary": "1-2 sentence summary explaining what happened, when, and why it's important"\n}\n\nIMPORTANT: Always provide a meaningful summary, never return empty or 'No summary'"`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      const aiResponse = completion.choices[0]?.message?.content;
      let aiData;
      
      try {
        aiData = JSON.parse(aiResponse || '{}');
      } catch {
        aiData = {
          aiTitle: news.title,
          aiSummary: news.snippet || 'No summary available'
        };
      }

      const finalSummary = aiData.aiSummary || news.snippet || 'No summary available';

      processedSports.push({
        originalTitle: news.title,
        aiTitle: aiData.aiTitle || news.title,
        aiSummary: finalSummary,
        link: news.link,
        date: news.date,
        source: news.source,
        type: 'news'
      });
    } catch (aiError) {
      console.error('AI sports processing error:', aiError);
      // AI hatası durumunda haberi özet olmadan ekle
      processedSports.push({
        originalTitle: news.title,
        aiTitle: news.title,
        aiSummary: news.snippet || 'No summary available',
        link: news.link,
        date: news.date,
        source: news.source,
        type: 'news'
      });
    }
  }
  
  console.log(`✅ AI processed ${processedSports.length} sports news items`);
  return processedSports;
};

/**
 * OpenAI ile maç verilerini işle
 * @param matches - İşlenecek maç verileri
 * @param maxItems - Maksimum işlenecek maç sayısı
 */
export const processMatchesWithAI = async (
  matches: any[], 
  maxItems: number = 10
): Promise<any[]> => {
  const openai = getOpenAIClient();
  const processedMatches: any[] = [];
  
  const matchesToProcess = matches.slice(0, maxItems);
  
  console.log(`🤖 Processing ${matchesToProcess.length} matches with AI`);
  
  for (const match of matchesToProcess) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a sports editor. Analyze the given content and determine if it's a real MATCH or NEWS. Only accept real matches."
          },
          {
            role: "user",
            content: `Analyze this content: "${match.title}"\n\nSummary: ${match.snippet || 'No summary'}\n\nIf this is a real MATCH, respond in JSON format:\n{\n  "isMatch": true,\n  "title": "Match title",\n  "teams": "Team 1 vs Team 2",\n  "sport": "Sport type (Basketball, Football, Tennis, NFL, NBA, MLB, etc.)",\n  "venue": "Stadium/Arena name (empty string if not available)",\n  "time": "Match time (empty string if not available)"\n}\n\nIf this is NEWS:\n{\n  "isMatch": false\n}`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      const aiResponse = completion.choices[0]?.message?.content;
      let aiData;
      
      try {
        aiData = JSON.parse(aiResponse || '{}');
      } catch {
        aiData = {
          isMatch: false
        };
      }

      // AI maç olarak tanımladıysa ekle
      if (aiData.isMatch === true || aiData.isMatch === undefined) {
        processedMatches.push({
          title: aiData.title || match.title,
          date: match.date || 'Tarih belirsiz',
          teams: aiData.teams || '',
          venue: aiData.venue || '',
          sport: aiData.sport || 'Diğer',
          time: aiData.time || '',
          link: match.link
        });
      }
    } catch (aiError) {
      console.error('AI match processing error:', aiError);
      processedMatches.push({
        title: match.title,
        date: match.date || 'Tarih belirsiz',
        teams: 'Takım bilgisi mevcut değil',
        sport: 'Spor türü belirsiz',
        link: match.link
      });
    }
  }
  
  console.log(`✅ AI processed ${processedMatches.length} matches`);
  return processedMatches;
};

/**
 * AI ile etkinlik tarihini parse eder ve sıralar
 * @param dateString - Tarih string'i
 * @returns Parsed date object veya null
 */
export const parseEventDateWithAI = async (dateString: string): Promise<Date | null> => {
  if (!dateString) return null;
  
  const openai = getOpenAIClient();
  
  try {
    const prompt = `
Parse this event date and return ONLY a valid JavaScript date in ISO format (YYYY-MM-DDTHH:MM:SS.000Z).

Current date context: It's July 30, 2025.

Event date string: "${dateString}"

Rules:
- If no year is specified, assume 2025
- If it's a date range (e.g., "Jul 31 - Aug 1"), use the START date
- If it's a multi-day event, use the first day
- Return format: YYYY-MM-DDTHH:MM:SS.000Z
- If you can't parse it, return "INVALID"

Examples:
"Thu, Jul 31, 8:00 PM" → "2025-07-31T20:00:00.000Z"
"Sat, Aug 2, 8 PM – Sun, Aug 3, 9 PM" → "2025-08-02T20:00:00.000Z"
"Mon, Jul 28 – Sat, Aug 2" → "2025-07-28T00:00:00.000Z"

Response (only the ISO date or "INVALID"):`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 50
    });

    const response = completion.choices[0]?.message?.content?.trim();
    
    if (response && response !== 'INVALID') {
      const parsedDate = new Date(response);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    return null;
  } catch (error) {
    console.log(`❌ AI date parsing failed for: ${dateString}`);
    return null;
  }
}; 

/**
 * AI ile etkinlikleri tarihe göre sırala
 * @param events - Sıralanacak etkinlikler
 * @returns Sıralanmış etkinlikler (yakından uzağa)
 */
export const sortEventsWithAI = async (events: any[]): Promise<any[]> => {
  if (events.length === 0) return events;
  
  console.log(`🤖 Starting AI sorting for ${events.length} events`);
  
  try {
    const openai = getOpenAIClient();
    
    // Etkinlikleri AI'ya gönder
    const eventsText = events.map((event, index) => 
      `${index + 1}. ${event.title} - ${event.date}`
    ).join('\n');
    
    console.log(`📝 Events to sort:\n${eventsText}`);
    
    const prompt = `
Sort these events by date from nearest to farthest (closest date first). 
Consider today's date and sort chronologically.

Events:
${eventsText}

Respond with ONLY the sorted order numbers separated by commas (e.g., "3,1,2,4").
If you can't determine the date, put that event at the end.
`;

    console.log(`🤖 Sending to AI for sorting...`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 50
    });

    const response = completion.choices[0]?.message?.content?.trim();
    console.log(`🤖 AI response: "${response}"`);
    
    if (response) {
      // AI'dan gelen sıralama numaralarını parse et
      const orderNumbers = response.split(',').map(num => parseInt(num.trim()) - 1);
      console.log(`🔢 Parsed order numbers: [${orderNumbers.join(', ')}]`);
      
      // Geçerli indeksleri filtrele ve sırala
      const validIndices = orderNumbers.filter(index => index >= 0 && index < events.length);
      console.log(`✅ Valid indices: [${validIndices.join(', ')}]`);
      
      if (validIndices.length === events.length) {
        const sortedEvents = validIndices.map(index => events[index]);
        console.log(`🤖 AI successfully sorted ${events.length} events`);
        return sortedEvents;
      } else {
        console.log(`⚠️ AI sorting incomplete: ${validIndices.length}/${events.length} events sorted`);
      }
    }
    
    // AI sıralama başarısız olursa orijinal sırayı döndür
    console.log(`⚠️ AI sorting failed, keeping original order`);
    return events;
    
  } catch (error) {
    console.error('❌ AI event sorting error:', error);
    return events;
  }
}; 