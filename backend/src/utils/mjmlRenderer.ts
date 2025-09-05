import mjml2html from 'mjml';
import Handlebars from 'handlebars';
import juice from 'juice';
import { MJML_TEMPLATE } from './mjmlTemplate';
import { CachedCityData } from './cityData';
import { getSupabaseClient } from './database';

export interface SponsorCard { name: string; tagline: string; logo: string ,phone: string; website: string;}
export interface EventItem { title: string; category: string; categoryClass: string; date: string; venue?: string; link?: string }
export interface NewsItem { title: string; summary: string; link: string }
export interface MatchItem { sport: string; title: string; date: string; venue?: string; teams?: string }

export interface EmailVM {
  city: string;
  date: string;
  heroImageUrl?: string;
  weather: { icon: string; condition: string; detail: string };
  sponsors: SponsorCard[][];
  todaysBrief: string[];
  ad: { ctaText: string; ctaUrl: string };
  news: NewsItem[];
  events: EventItem[];
  sports: { summary?: string; readMoreLink?: string; matches: MatchItem[] };
}
// Fetch sponsors from database for a specific city
async function fetchSponsorsForCity(citySlug: string): Promise<SponsorCard[][]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: sponsors, error } = await supabase
      .from('sponsors')
      .select('sponsor_name, sponsor_tag, sponsor_url, sponsor_phone, sponsor_website, display_order')
      .eq('city_slug', citySlug)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(9);

    if (error || !sponsors || sponsors.length === 0) {
      console.warn(`No sponsors found for city: ${citySlug}`);
      return getDefaultSponsors();
    }

    // Convert to SponsorCard format
    const sponsorCards: SponsorCard[] = sponsors.map(s => ({
      name: s.sponsor_name,
      tagline: s.sponsor_tag,
      logo: s.sponsor_url,
      phone: s.sponsor_phone || '',
      website: s.sponsor_website || ''
    }));

    // Group by 3 for layout (MJML template expects this)
    const grouped: SponsorCard[][] = [];
    for (let i = 0; i < sponsorCards.length; i += 3) {
      grouped.push(sponsorCards.slice(i, i + 3));
    }

    return grouped;
  } catch (error) {
    console.error(`Error fetching sponsors for ${citySlug}:`, error);
    return getDefaultSponsors();
  }
}

// Fallback sponsors if DB query fails
function getDefaultSponsors(): SponsorCard[][] {
  return [
    [
      {
        name: 'Local Business Partner',
        tagline: 'Your trusted partner',
        logo: 'https://via.placeholder.com/100x100.png?text=Partner1',
        phone: '(555) 000-0001',
        website: 'https://example.com'
      },
      {
        name: 'Community Service Pro',
        tagline: 'Professional services',
        logo: 'https://via.placeholder.com/100x100.png?text=Partner2',
        phone: '(555) 000-0002',
        website: 'https://example.com'
      },
      {
        name: 'Local Expert',
        tagline: 'Expert solutions',
        logo: 'https://via.placeholder.com/100x100.png?text=Partner3',
        phone: '(555) 000-0003',
        website: 'https://example.com'
      }
    ]
  ];
}



  const EVENT_ICON_MAP: Record<string, string> = {
    music:     '🎵',
    theatre:   '🎭',
    theater:   '🎭',
    art:       '🎨',
    festival:  '🎉',
    festivals: '🎉',
    market:    '🛍️',
    markets:   '🛍️',
    sports:    '⚽',
    sport:     '⚽',
    comedy:    '🎤',
    default:   '📅',
  };

  const SPORT_EMOJI_MAP: Record<string, string> = {
    baseball: '⚾',
    softball: '🥎',
    basketball: '🏀',
    americanfootball: '🏈',
    football: '🏈',        
    soccer: '⚽',  
    associationfootball: '⚽',
    hockey: '🏒',          
    fieldhockey: '🏑',
    tennis: '🎾',
    golf: '⛳',
    cricket: '🏏',
    rugby: '🏉',
    volleyball: '🏐',
    swimming: '🏊',
    run: '🏃',
    running: '🏃',
    marathon: '🏃',
    athletics: '🏃',
    cycling: '🚴',
    boxing: '🥊',
    mma: '🥋',
    wrestling: '🤼',
    karate: '🥋',
    taekwondo: '🥋',
    judo: '🥋',
    motorsport: '🏎️',
    racing: '🏎️',
    f1: '🏎️',
    moto: '🏍️',
    motocross: '🏍️',
    esports: '🎮',
    tabletennis: '🏓',
    pingpong: '🏓',
    badminton: '🏸',
    billiards: '🎱',
    snooker: '🎱',
    chess: '♟️',
    skiing: '🎿',
    snowboard: '🏂',
    skating: '⛸️',
    skateboard: '🛹',
    rowing: '🚣',
    canoe: '🛶',
    kayak: '🛶',
    sailing: '⛵',
    surf: '🏄',
    darts: '🎯',
    handball: '🤾',
  };

  const DEFAULT_SPORT_EMOJI = '🏟️';
  const normalize = (s: string = '') => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

  // Weather condition to icon mapping
  function getWeatherIcon(condition?: string): string {
    if (!condition) return '☀️';
    
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return '🌧️';
    if (c.includes('storm') || c.includes('thunder')) return '⛈️';
    if (c.includes('snow')) return '❄️';
    if (c.includes('cloud')) return '☁️';
    if (c.includes('clear') || c.includes('sunny')) return '☀️';
    if (c.includes('fog') || c.includes('mist')) return '🌫️';
    if (c.includes('wind')) return '💨';
    
    return '☀️'; // default
  }

  // Heuristics to pick the best emoji from sport/title text
  function pickSportEmoji(sport?: string, title?: string): string {
    const bag = `${sport || ''} ${title || ''}`.toLowerCase();
    const n = normalize(bag);

    // Specific disambiguations first
    if (n.includes('fieldhockey')) return '🏑';
    if (n.includes('icehockey') || (n.includes('hockey') && !n.includes('field'))) return '🏒';

    if (n.includes('soccer') || n.includes('footballclub') || /\bfc\b/.test(bag)) return '⚽';
    if (n.includes('americanfootball')) return '🏈';

    if (n.includes('motogp') || n.includes('motorcycle') || n.includes('moto') || n.includes('bike')) return '🏍️';

    const bySport = SPORT_EMOJI_MAP[normalize(sport || '')];
    if (bySport) return bySport;

    for (const [key, emoji] of Object.entries(SPORT_EMOJI_MAP)) {
      if (n.includes(key)) return emoji;
    }

    return DEFAULT_SPORT_EMOJI;
  }


export async function mapToVM(content: CachedCityData): Promise<EmailVM> {
  // Weather data comes from weather-email endpoint format:
  // { condition: "Rain", high: 82, low: 78, wind: "SSW 23-28 mph", date: "Friday, September 5" }
  const weather = {
    icon: getWeatherIcon(content.weather?.condition) || '☀️',
    condition: content.weather?.condition || 'Clear',
    detail: content.weather?.high && content.weather?.low 
      ? `High ${content.weather.high}°F, Low ${content.weather.low}°F • ${content.weather.wind || 'N/A'}`
      : content.weather?.condition 
        ? `Weather: ${content.weather.condition}`
        : 'Weather data unavailable'
  };

  // Fetch sponsors from database based on city
  const citySlug = content.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const sponsors = await fetchSponsorsForCity(citySlug);

  const todaysBrief = (content.todaysBrief || []).map((x: any) => x?.title || x?.text || x?.content || String(x)).slice(0, 5);
  const news = (content.news || []).slice(0, 4).map((n: any) => ({ title: n.title, summary: n.summary || n.snippet || '', link: n.link || n.originalLink || '#' }));
  const events = (content.events || []).slice(0, 6).map((e: any) => ({
    title: e.title,
    category: e.category || 'Event',
    categoryClass: (e.category || 'other').toLowerCase(),
    date: e.date || 'Date TBD',
    venue: e.venue?.name || e.venue,
    link: e.link || e.url || null,
    icon: EVENT_ICON_MAP[e.category?.toLowerCase()] || EVENT_ICON_MAP.default
  }));
  const matches = (content.sports?.matches || []).slice(0, 8).map((m: any) => ({
    sport: m.sport || 'Other', title: m.title || m.teams || 'Game', date: m.date || m.time || 'TBD', venue: m.venue, teams: m.teams,icon: pickSportEmoji(m.sport, m.title || m.teams),
  }));

  return {
    city: content.city,
    date: content.date,
    heroImageUrl: 'https://via.placeholder.com/1200x400.png?text=Header',
    weather,
    sponsors,
    todaysBrief,
    ad: { ctaText: 'Explore Now', ctaUrl: 'https://example.com' },
    news,
    events,
    sports: { summary: content.sports?.summary, readMoreLink: content.sports?.readMoreLink, matches }
  };
}

export async function renderMjml(content: CachedCityData): Promise<string> {
  const vm = await mapToVM(content);
  const hbs = Handlebars.compile(MJML_TEMPLATE);
  const mjml = hbs(vm);
  const { html, errors } = mjml2html(mjml, { beautify: false, validationLevel: 'soft' });
  if (errors && errors.length) {
    console.warn('MJML validation:', errors);
  }
  return html;
}

export function toEmailSafeBody(html: string): string {
  const inlined = juice(html, { preserveImportant: true, removeStyleTags: true });
  const match = inlined.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : inlined;
}
