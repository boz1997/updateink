// EmailData interface'ini burada tanımla
export interface EmailData {
  city: string;
  weather: Record<string, unknown>;
  news: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
  sports: Array<Record<string, unknown>>;
  matches: Array<Record<string, unknown>>;
}

export const generateEmailContent = async (city: string): Promise<EmailData> => {
  try {
    console.log('🔄 Fetching data for city:', city);
    
    // Mock data kullan (API isteklerini azaltmak için)
    if (city === 'New York') {
      return getMockDataForNewYork();
    }
    
    // Fetch all data for the city with cache headers
    const [weatherData, newsData, eventsData, sportsData] = await Promise.all([
      fetchWeatherData(city),
      fetchNewsData(city),
      fetchEventsData(city),
      fetchSportsData(city)
    ]);

    return {
      city,
      weather: weatherData,
      news: newsData,
      events: eventsData,
      sports: sportsData.sports || [],
      matches: sportsData.matches || []
    };
  } catch (error) {
    console.error('Error generating email content:', error);
    throw error;
  }
};

const fetchWeatherData = async (city: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`, {
      headers: {
        'Cache-Control': 'max-age=300' // 5 dakika cache
      }
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const weather = data.weather;
    
    return {
      current: {
        temp: Math.round(weather.current.main.temp),
        condition: weather.current.weather[0]?.description || 'Unknown',
        icon: weather.current.weather[0]?.icon || '🌤️',
        humidity: weather.current.main.humidity,
        wind: Math.round(weather.current.wind.speed),
        pressure: weather.current.main.pressure,
        visibility: Math.round(weather.current.visibility / 1609.34) // Convert meters to miles
      },
      hourly: weather.forecast?.list?.slice(0, 6).map((hour: any) => ({
        time: new Date(hour.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        temp: Math.round(hour.main.temp),
        condition: hour.weather[0]?.description || 'Unknown'
      })) || [],
      daily: weather.forecast?.list?.filter((item: any, index: number) => index % 8 === 0).slice(0, 3).map((day: any) => ({
        date: new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        temp: Math.round(day.main.temp),
        condition: day.weather[0]?.description || 'Unknown'
      })) || []
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    return {
      current: { temp: 0, condition: 'Data unavailable', icon: '❌' },
      hourly: [],
      daily: []
    };
  }
};

const fetchNewsData = async (city: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/news?city=${encodeURIComponent(city)}`, {
      headers: {
        'Cache-Control': 'max-age=600' // 10 dakika cache
      }
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.news?.slice(0, 12).map((news: any) => ({
      title: news.title || 'No title',
      summary: news.summary || 'No summary',
      link: news.link || '#',
      isRelevant: news.isRelevant,
      isAppropriate: news.isAppropriate
    })) || [];
  } catch (error) {
    console.error('News fetch error:', error);
    return [];
  }
};

// Extract venue information from snippet
const extractVenueFromSnippet = (snippet: string): string => {
  if (!snippet) return 'Venue not specified';
  
  // Farklı venue pattern'lerini kontrol et
  const patterns = [
    /@\s*([^,]+(?:,\s*[^,]+)*)/i,  // @ The Wiltern, Los Angeles, CA
    /at\s+([^,]+(?:,\s*[^,]+)*)/i,  // at Hollywood Bowl in Los Angeles
    /showing at\s+([^,]+(?:,\s*[^,]+)*)/i,  // showing at the Exchange LA
    /in\s+([^,]+(?:,\s*[^,]+)*)/i,  // in Los Angeles
  ];

  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return 'Venue not specified';
};

// Fix date format
const formatEventDate = (dateString: string): string => {
  if (!dateString) return 'Date not specified';
  
  try {
    // API'den gelen format: "Thu, Jul 31, 7:00 - 8:30 PM"
    // Bu formatı parse etmek için özel işlem yapalım
    if (typeof dateString === 'string' && dateString.includes(',')) {
      // "Thu, Jul 31, 7:00 - 8:30 PM" formatını parse et
      const parts = dateString.split(',');
      if (parts.length >= 2) {
        const datePart = parts[1].trim(); // "Jul 31"
        const timePart = parts[2]?.trim() || ''; // "7:00 - 8:30 PM"
        
        // Sadece tarih kısmını al
        const dateOnly = datePart.split(' ')[1]; // "31"
        const monthOnly = datePart.split(' ')[0]; // "Jul"
        
        // 2025 yılını ekle
        const fullDate = `${monthOnly} ${dateOnly}, 2025`;
        const date = new Date(fullDate);
        
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) + (timePart ? ` ${timePart}` : '');
        }
      }
    }
    
    // Normal date parsing dene
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Date not specified';
    }
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
      } catch (error) {
      return 'Date not specified';
    }
};

const fetchEventsData = async (city: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events?city=${encodeURIComponent(city)}`, {
      headers: {
        'Cache-Control': 'max-age=600' // 10 dakika cache
      }
    });
    const data = await response.json();

    console.log('🎭 Events API Response:', data);
    console.log('🎭 Events data:', data.events);

    if (data.error) {
      throw new Error(data.error);
    }

    const processedEvents = data.events?.slice(0, 10).map((event: any) => {
      console.log('🎭 Processing event:', event);
      console.log('🎭 Event date:', event.date, 'Type:', typeof event.date);
      console.log('🎭 Event venue:', event.venue, 'Type:', typeof event.venue);
      console.log('🎭 Event snippet:', event.snippet, 'Type:', typeof event.snippet);
      
      const formattedDate = formatEventDate(event.date);
      
      // If venue is an object, get the name property, otherwise extract from snippet
      let venueName = 'Venue not specified';
      if (event.venue && typeof event.venue === 'object' && event.venue.name) {
        venueName = event.venue.name;
      } else if (event.venue && typeof event.venue === 'string') {
        venueName = event.venue;
      } else {
        venueName = extractVenueFromSnippet(event.snippet || '');
      }
      
      console.log('🎭 Formatted date:', formattedDate);
      console.log('🎭 Venue name:', venueName);
      
      return {
        title: event.title || 'No event name',
        date: formattedDate,
        venue: venueName,
        link: event.link || '#'
      };
    }) || [];
    
    console.log('🎭 Final processed events:', processedEvents);
    return processedEvents;
  } catch (error) {
    console.error('Events fetch error:', error);
    return [];
  }
};

const fetchSportsData = async (city: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/sports?city=${encodeURIComponent(city)}`, {
      headers: {
        'Cache-Control': 'max-age=600' // 10 dakika cache
      }
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // AI işlenmiş spor haberlerini kullan
    const sports = data.sports?.slice(0, 8).map((sport: any) => ({
      title: sport.aiTitle || sport.originalTitle || 'No sports news title',
      summary: sport.aiSummary || 'No summary',
      link: sport.link || '#',
      originalTitle: sport.originalTitle,
      isAIProcessed: !!sport.aiTitle
    })) || [];

    // Spor emoji fonksiyonu
    const getSportEmoji = (sport: string): string => {
      const sportLower = sport.toLowerCase();
      if (sportLower.includes('basketball') || sportLower.includes('nba')) return '🏀';
      if (sportLower.includes('football') || sportLower.includes('nfl')) return '🏈';
      if (sportLower.includes('baseball') || sportLower.includes('mlb')) return '⚾';
      if (sportLower.includes('soccer') || sportLower.includes('mls')) return '⚽';
      if (sportLower.includes('hockey') || sportLower.includes('nhl')) return '🏒';
      if (sportLower.includes('tennis')) return '🎾';
      if (sportLower.includes('volleyball')) return '🏐';
      if (sportLower.includes('golf')) return '⛳';
      if (sportLower.includes('rugby')) return '🏉';
      if (sportLower.includes('boxing')) return '🥊';
      if (sportLower.includes('mma') || sportLower.includes('ufc')) return '🥋';
      if (sportLower.includes('racing') || sportLower.includes('f1') || sportLower.includes('nascar')) return '🏁';
      if (sportLower.includes('running') || sportLower.includes('marathon')) return '🏃';
      return '🏆'; // Default emoji
    };

    // Maç verilerini de al
    const matches = data.upcomingMatches ? 
      Object.values(data.upcomingMatches).flat().slice(0, 10).map((match: any) => {
        const sport = match.sport || 'Sport not specified';
        const emoji = getSportEmoji(sport);
        return {
          title: `${emoji} ${match.title || 'Match'}`,
          date: match.date || 'Date not specified',
          teams: match.teams || 'Teams not specified',
          sport: sport,
          link: match.link || '#'
        };
      }) : [];

    return { sports, matches };
  } catch (error) {
    console.error('Sports fetch error:', error);
    return { sports: [], matches: [] };
  }
};

 
