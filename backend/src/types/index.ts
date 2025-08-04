

/**
 * Spor verisi interface'i
 */
export interface Sport {
  originalTitle: string;
  aiTitle: string;
  aiSummary: string;
  link?: string;
  date?: string;
  source?: string;
  type: 'news' | 'match';
}
export interface Event {
  title: string;
  date: string;
  venue?: string;
  link?: string;
  snippet?: string;
  thumbnail?: string;
  location?: string;
}
/**
 * Maç verisi interface'i
 */
export interface Match {
  title: string;
  date: string;
  teams: string;
  venue?: string;
  sport: string;
  time?: string;
  link?: string;
}

/**
 * Kategorize edilmiş maçlar interface'i
 */
export interface CategorizedMatches {
  basketball: Match[];
  football: Match[];
  soccer: Match[];
  tennis: Match[];
  baseball: Match[];
  hockey: Match[];
  volleyball: Match[];
  golf: Match[];
  rugby: Match[];
  boxing: Match[];
  mma: Match[];
  racing: Match[];
  other: Match[];
}

/**
 * Hava durumu verisi interface'i
 */
export interface Weather {
  current: {
    name: string;
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
      pressure: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
    };
    sys: {
      country: string;
    };
  };
  forecast: {
    list: Array<{
      dt: number;
      main: {
        temp: number;
        feels_like: number;
        humidity: number;
      };
      weather: Array<{
        main: string;
        description: string;
        icon: string;
      }>;
      dt_txt: string;
    }>;
  };
}

/**
 * Kullanıcı verisi interface'i
 */
export interface User {
  id: string;
  email: string;
  city: string;
  created_at: string;
}

/**
 * Cache verisi interface'i
 */
export interface CacheData {
  city: string;
  date: string;
  type: string;
  data: any;
  created_at: string;
}

/**
 * API yanıtı interface'i
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: string;
  fromCache?: boolean;
}

/**
 * Spor verisi yanıtı interface'i
 */
export interface SportsResponse {
  sports: Sport[];
  upcomingMatches: CategorizedMatches;
  fromCache: boolean;
} 
