// === Raw API response types ===
interface RawWeatherResponse {
  weather: {
    current: {
      main: { temp: number; humidity: number; pressure: number };
      weather: { description: string; icon: string }[];
      wind: { speed: number };
      visibility: number;
    };
    forecast: { list: RawForecastItem[] };
  };
}

interface RawForecastItem {
  dt: number;
  main: { temp: number };
  weather: { description: string }[];
}

interface RawNewsItem {
  title?: string;
  summary?: string;
  link?: string;
  isRelevant?: boolean;
  isAppropriate?: boolean;
}

interface RawEventItem {
  title?: string;
  date?: string;
  venue?: { name?: string } | string;
  snippet?: string;
  link?: string;
}

interface RawSportItem {
  aiTitle?: string;
  aiSummary?: string;
  originalTitle?: string;
  link?: string;
}

interface RawMatchItem {
  sport?: string;
  title?: string;
  date?: string;
  teams?: string;
  link?: string;
}

// === Outgoing (typed) interfaces ===
export interface WeatherCurrent {
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  wind: number;
  pressure: number;
  visibility: number;
}

export interface WeatherHourlyItem {
  time: string;
  temp: number;
  condition: string;
}

export interface WeatherDailyItem {
  date: string;
  temp: number;
  condition: string;
}

export interface WeatherData {
  current: WeatherCurrent;
  hourly: WeatherHourlyItem[];
  daily: WeatherDailyItem[];
}

export interface NewsItem {
  title: string;
  summary: string;
  link: string;
  isRelevant?: boolean;
  isAppropriate?: boolean;
}

export interface EventItem {
  title: string;
  date: string;
  venue: string;
  link: string;
}

export interface SportItem {
  title: string;
  summary: string;
  link: string;
  originalTitle?: string;
  isAIProcessed: boolean;
}

export interface MatchItem {
  title: string;
  date: string;
  teams: string;
  sport: string;
  link: string;
}

export interface EmailData {
  city: string;
  weather: WeatherData;
  news: NewsItem[];
  events: EventItem[];
  sports: SportItem[];
  matches: MatchItem[];
}

// === Main generator ===
export const generateEmailContent = async (city: string): Promise<EmailData> => {
  const [weatherData, newsData, eventsData, sportsData] = await Promise.all([
    fetchWeatherData(city),
    fetchNewsData(city),
    fetchEventsData(city),
    fetchSportsData(city),
  ]);

  return {
    city,
    weather: weatherData,
    news: newsData,
    events: eventsData,
    sports: sportsData.sports,
    matches: sportsData.matches,
  };
};

// === Helpers ===

const fetchWeatherData = async (city: string): Promise<WeatherData> => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`,
      { headers: { 'Cache-Control': 'max-age=300' } }
    );
    const data = (await res.json()) as RawWeatherResponse;
    const w = data.weather;

    return {
      current: {
        temp: Math.round(w.current.main.temp),
        condition: w.current.weather[0].description,
        icon: w.current.weather[0].icon,
        humidity: w.current.main.humidity,
        wind: Math.round(w.current.wind.speed),
        pressure: w.current.main.pressure,
        visibility: Math.round(w.current.visibility / 1609.34),
      },
      hourly: w.forecast.list.slice(0, 6).map((h): WeatherHourlyItem => ({
        time: new Date(h.dt * 1000).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        temp: Math.round(h.main.temp),
        condition: h.weather[0].description,
      })),
      daily: w.forecast.list
        .filter((_, i) => i % 8 === 0)
        .slice(0, 3)
        .map((d): WeatherDailyItem => ({
          date: new Date(d.dt * 1000).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          temp: Math.round(d.main.temp),
          condition: d.weather[0].description,
        })),
    };
  } catch {
    return {
      current: {
        temp: 0,
        condition: 'Data unavailable',
        icon: '❌',
        humidity: 0,
        wind: 0,
        pressure: 0,
        visibility: 0,
      },
      hourly: [],
      daily: [],
    };
  }
};

const fetchNewsData = async (city: string): Promise<NewsItem[]> => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/news?city=${encodeURIComponent(city)}`,
      { headers: { 'Cache-Control': 'max-age=600' } }
    );
    const { news = [] } = (await res.json()) as { news?: RawNewsItem[] };

    return news.slice(0, 12).map((n): NewsItem => ({
      title: n.title ?? 'No title',
      summary: n.summary ?? 'No summary',
      link: n.link ?? '#',
      isRelevant: n.isRelevant,
      isAppropriate: n.isAppropriate,
    }));
  } catch {
    return [];
  }
};

const extractVenueFromSnippet = (snippet: string): string => {
  const patterns = [
    /@\s*([^,]+(?:,\s*[^,]+)*)/i,
    /at\s+([^,]+(?:,\s*[^,]+)*)/i,
    /showing at\s+([^,]+(?:,\s*[^,]+)*)/i,
    /in\s+([^,]+(?:,\s*[^,]+)*)/i,
  ];
  for (const p of patterns) {
    const m = snippet.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return 'Venue not specified';
};

const formatEventDate = (dateString: string): string => {
  if (!dateString) return 'Date not specified';
  try {
    if (dateString.includes(',')) {
      const parts = dateString.split(',');
      if (parts.length >= 2) {
        const datePart = parts[1].trim();
        const timePart = parts[2]?.trim() ?? '';
        const [month, day] = datePart.split(' ');
        const d = new Date(`${month} ${day}, 2025`);
        if (!isNaN(d.getTime())) {
         const base = d.toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
          return timePart ? `${base} ${timePart}` : base;
        }
      }
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) throw new Error();
    return d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Date not specified';
  }
};

const fetchEventsData = async (city: string): Promise<EventItem[]> => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events?city=${encodeURIComponent(city)}`,
      { headers: { 'Cache-Control': 'max-age=600' } }
    );
    const { events = [] } = (await res.json()) as { events?: RawEventItem[] };

    return events.slice(0, 10).map((e): EventItem => {
      const date = formatEventDate(e.date ?? '');
      let venue = 'Venue not specified';
      if (e.venue && typeof e.venue === 'object') venue = e.venue.name ?? venue;
      else if (typeof e.venue === 'string') venue = e.venue;
      else venue = extractVenueFromSnippet(e.snippet ?? '');

      return {
        title: e.title ?? 'No event name',
        date,
        venue,
        link: e.link ?? '#',
      };
    });
  } catch {
    return [];
  }
};

const fetchSportsData = async (
  city: string
): Promise<{ sports: SportItem[]; matches: MatchItem[] }> => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/sports?city=${encodeURIComponent(city)}`,
      { headers: { 'Cache-Control': 'max-age=600' } }
    );
    const data = (await res.json()) as {
      sports?: RawSportItem[];
      upcomingMatches?: Record<string, RawMatchItem[]>;
    };

    const sports = (data.sports ?? []).slice(0, 8).map((s): SportItem => ({
      title: s.aiTitle ?? s.originalTitle ?? 'No sports news title',
      summary: s.aiTitle ? s.aiSummary ?? '' : 'No summary',
      link: s.link ?? '#',
      originalTitle: s.originalTitle,
      isAIProcessed: Boolean(s.aiTitle),
    }));

    const rawMatches = data.upcomingMatches
      ? Object.values<RawMatchItem[]>(data.upcomingMatches).flat()
      : [];

    const matches = rawMatches.slice(0, 10).map((m): MatchItem => {
      const sportName = m.sport ?? 'Sport not specified';
      return {
        title: `${getSportEmoji(sportName)} ${m.title ?? 'Match'}`,
        date: m.date ?? 'Date not specified',
        teams: m.teams ?? 'Teams not specified',
        sport: sportName,
        link: m.link ?? '#',
      };
    });

    return { sports, matches };
  } catch {
    return { sports: [], matches: [] };
  }
};

const getSportEmoji = (sport: string): string => {
  const key = sport.toLowerCase();
  if (key.includes('basketball') || key.includes('nba')) return '🏀';
  if (key.includes('football') || key.includes('nfl')) return '🏈';
  if (key.includes('baseball') || key.includes('mlb')) return '⚾';
  if (key.includes('soccer') || key.includes('mls')) return '⚽';
  if (key.includes('hockey') || key.includes('nhl')) return '🏒';
  if (key.includes('tennis')) return '🎾';
  if (key.includes('volleyball')) return '🏐';
  if (key.includes('golf')) return '⛳';
  if (key.includes('rugby')) return '🏉';
  if (key.includes('boxing')) return '🥊';
  if (key.includes('mma') || key.includes('ufc')) return '🥋';
  if (key.includes('racing') || key.includes('f1') || key.includes('nascar')) return '🏁';
  if (key.includes('running') || key.includes('marathon')) return '🏃';
  return '🏆';
};
