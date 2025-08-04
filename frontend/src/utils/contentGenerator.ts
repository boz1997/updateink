export interface EmailData {
  city: string;
  weather: {
    temperature: number;
    condition: string;
    humidity?: number;
    windSpeed?: number;
    description?: string;
  };
  news: Array<{
    title: string;
    snippet: string;
    link: string;
    source?: string;
    publishedAt?: string;
  }>;
  events: Array<{
    title: string;
    date: string;
    venue?: string;
    link?: string;
    snippet?: string;
    thumbnail?: string;
    location?: string;
  }>;
  sports: Array<{
    title: string;
    score?: string;
    teams?: string[];
    date?: string;
    link?: string;
  }>;
  matches: Array<{
    homeTeam: string;
    awayTeam: string;
    score?: string;
    date: string;
    venue?: string;
    link?: string;
  }>;
}
