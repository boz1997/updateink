// EmailData interface'ini burada tanımla
export interface EmailData {
  city: string;
  weather: any;
  news: any[];
  events: any[];
  sports: any[];
  matches: any[];
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

// New York için güzel mock veri
const getMockDataForNewYork = (): EmailData => {
  return {
    city: 'New York',
    weather: {
      current: {
        temp: 72,
        condition: 'Partly Cloudy',
        icon: '02d',
        humidity: 65,
        wind: 8,
        pressure: 1013,
        visibility: 10
      },
      hourly: [
        { time: '12:00 PM', temp: 72, condition: 'Partly Cloudy' },
        { time: '1:00 PM', temp: 74, condition: 'Sunny' },
        { time: '2:00 PM', temp: 76, condition: 'Sunny' },
        { time: '3:00 PM', temp: 75, condition: 'Partly Cloudy' },
        { time: '4:00 PM', temp: 73, condition: 'Cloudy' },
        { time: '5:00 PM', temp: 70, condition: 'Light Rain' }
      ],
      daily: [
        { date: 'Mon, Jul 28', temp: 75, condition: 'Sunny' },
        { date: 'Tue, Jul 29', temp: 78, condition: 'Partly Cloudy' },
        { date: 'Wed, Jul 30', temp: 72, condition: 'Rain' }
      ]
    },
    news: [
      {
        title: 'New York City Announces Major Infrastructure Investment Plan',
        summary: 'Mayor Adams reveals $50 billion plan to modernize city infrastructure, including subway improvements and green energy initiatives.',
        link: '#',
        isRelevant: true,
        isAppropriate: true
      },
      {
        title: 'Broadway Shows Return with Record-Breaking Attendance',
        summary: 'Theater district celebrates successful reopening with Hamilton and Wicked leading the box office recovery.',
        link: '#',
        isRelevant: true,
        isAppropriate: true
      },
      {
        title: 'NYC Restaurant Week Extended Due to Popular Demand',
        summary: 'Popular dining event extended for another week, featuring over 300 participating restaurants across all boroughs.',
        link: '#',
        isRelevant: true,
        isAppropriate: true
      },
      {
        title: 'Central Park Summer Concert Series Announced',
        summary: 'Free outdoor concerts featuring top artists including Taylor Swift and Ed Sheeran scheduled for August.',
        link: '#',
        isRelevant: true,
        isAppropriate: true
      },
      {
        title: 'New York Knicks Sign Star Point Guard in Major Trade',
        summary: 'Knicks acquire All-Star point guard in blockbuster trade, immediately becoming playoff contenders.',
        link: '#',
        isRelevant: true,
        isAppropriate: true
      },
      {
        title: 'Brooklyn Bridge Park Expansion Project Begins',
        summary: '$100 million expansion project starts, adding new recreational facilities and waterfront access.',
        link: '#',
        isRelevant: true,
        isAppropriate: true
      },
      {
        title: 'NYC Public Schools Rank #1 in National Education Survey',
        summary: 'New York City public schools achieve highest ranking in comprehensive national education assessment.',
        link: '#',
        isRelevant: true,
        isAppropriate: true
      },
      {
        title: 'Manhattan Real Estate Market Shows Strong Recovery',
        summary: 'Luxury apartment sales increase 25% as international buyers return to the market.',
        link: '#',
        isRelevant: true,
        isAppropriate: true
      },
      {
        title: 'New York Yankees Clinch Playoff Berth',
        summary: 'Yankees secure postseason spot with dramatic walk-off victory against Boston Red Sox.',
        link: '#',
        isRelevant: true,
        isAppropriate: true
      },
      {
        title: 'NYC Tech Startup Raises $500 Million in Funding Round',
        summary: 'Local fintech company becomes latest NYC unicorn, creating 200 new jobs in the city.',
        link: '#',
        isRelevant: true,
        isAppropriate: true
      },
      {
        title: 'Metropolitan Museum Announces Major Exhibition',
        summary: 'Blockbuster Van Gogh exhibition opens, featuring never-before-seen works from private collections.',
        link: '#',
        isRelevant: true,
        isAppropriate: true
      },
      {
        title: 'New York City Marathon Registration Opens',
        summary: 'World\'s largest marathon opens registration with new course improvements and increased capacity.',
        link: '#',
        isRelevant: true,
        isAppropriate: true
      }
    ],
    events: [
      {
        title: 'SummerStage Concert: The Weeknd',
        date: '07/28/2025 8:00 PM',
        venue: 'Central Park SummerStage',
        link: '#'
      },
      {
        title: 'Broadway in Bryant Park',
        date: '07/29/2025 12:30 PM',
        venue: 'Bryant Park',
        link: '#'
      },
      {
        title: 'NYC Food & Wine Festival',
        date: '07/30/2025 6:00 PM',
        venue: 'Hudson Yards',
        link: '#'
      },
      {
        title: 'Shakespeare in the Park: Hamlet',
        date: '07/31/2025 8:00 PM',
        venue: 'Delacorte Theater',
        link: '#'
      },
      {
        title: 'Brooklyn Bridge Sunset Walk',
        date: '08/01/2025 7:00 PM',
        venue: 'Brooklyn Bridge',
        link: '#'
      },
      {
        title: 'NYC Jazz Festival',
        date: '08/02/2025 7:30 PM',
        venue: 'Lincoln Center',
        link: '#'
      },
      {
        title: 'Manhattan Art Gallery Opening',
        date: '08/03/2025 6:00 PM',
        venue: 'Chelsea Galleries',
        link: '#'
      },
      {
        title: 'Queens Night Market',
        date: '08/04/2025 6:00 PM',
        venue: 'Flushing Meadows Corona Park',
        link: '#'
      },
      {
        title: 'Staten Island Ferry Sunset Cruise',
        date: '08/05/2025 6:30 PM',
        venue: 'Staten Island Ferry',
        link: '#'
      },
      {
        title: 'NYC Comedy Festival',
        date: '08/06/2025 8:00 PM',
        venue: 'Caroline\'s on Broadway',
        link: '#'
      }
    ],
    sports: [
      {
        title: 'New York Knicks vs Boston Celtics',
        snippet: 'Eastern Conference showdown as Knicks host Celtics in crucial playoff positioning game.',
        link: '#'
      },
      {
        title: 'New York Yankees vs Toronto Blue Jays',
        snippet: 'Yankees look to extend division lead against rival Blue Jays in three-game series.',
        link: '#'
      },
      {
        title: 'New York Giants Training Camp',
        snippet: 'Giants begin training camp with new quarterback and offensive coordinator.',
        link: '#'
      },
      {
        title: 'Brooklyn Nets vs Miami Heat',
        snippet: 'Nets face Heat in preseason matchup featuring star-studded lineups.',
        link: '#'
      },
      {
        title: 'NYC Marathon Training Program',
        snippet: 'Official training program begins for world\'s largest marathon with 50,000 participants.',
        link: '#'
      },
      {
        title: 'New York Rangers vs New Jersey Devils',
        snippet: 'Hockey rivalry heats up as Rangers host Devils in preseason action.',
        link: '#'
      },
      {
        title: 'US Open Tennis Championships',
        snippet: 'Flushing Meadows prepares for annual tennis grand slam with top international players.',
        link: '#'
      },
      {
        title: 'New York City FC vs LA Galaxy',
        snippet: 'MLS action as NYCFC hosts Galaxy in crucial conference matchup.',
        link: '#'
      }
    ],
    matches: [
      {
        title: '🏀 New York Knicks vs Boston Celtics',
        date: '07/28/2025 7:30 PM',
        teams: 'Knicks vs Celtics',
        sport: 'Basketball',
        link: '#'
      },
      {
        title: '⚾ New York Yankees vs Toronto Blue Jays',
        date: '07/29/2025 7:05 PM',
        teams: 'Yankees vs Blue Jays',
        sport: 'Baseball',
        link: '#'
      },
      {
        title: '🏈 New York Giants vs Dallas Cowboys',
        date: '07/30/2025 8:20 PM',
        teams: 'Giants vs Cowboys',
        sport: 'Football',
        link: '#'
      },
      {
        title: '🏀 Brooklyn Nets vs Miami Heat',
        date: '07/31/2025 7:30 PM',
        teams: 'Nets vs Heat',
        sport: 'Basketball',
        link: '#'
      },
      {
        title: '🏒 New York Rangers vs New Jersey Devils',
        date: '08/01/2025 7:00 PM',
        teams: 'Rangers vs Devils',
        sport: 'Hockey',
        link: '#'
      },
      {
        title: '⚽ New York City FC vs LA Galaxy',
        date: '08/02/2025 7:30 PM',
        teams: 'NYCFC vs LA Galaxy',
        sport: 'Soccer',
        link: '#'
      },
      {
        title: '🎾 US Open Tennis - Day 1',
        date: '08/03/2025 11:00 AM',
        teams: 'Various Players',
        sport: 'Tennis',
        link: '#'
      },
      {
        title: '🏃 NYC Marathon Training Run',
        date: '08/04/2025 8:00 AM',
        teams: 'Marathon Participants',
        sport: 'Running',
        link: '#'
      },
      {
        title: '🏀 New York Liberty vs Connecticut Sun',
        date: '08/05/2025 7:00 PM',
        teams: 'Liberty vs Sun',
        sport: 'Basketball',
        link: '#'
      },
      {
        title: '⚾ Brooklyn Cyclones vs Staten Island Yankees',
        date: '08/06/2025 7:00 PM',
        teams: 'Cyclones vs Yankees',
        sport: 'Baseball',
        link: '#'
      }
    ]
  };
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

 