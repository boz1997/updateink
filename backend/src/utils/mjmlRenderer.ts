import mjml2html from 'mjml';
import Handlebars from 'handlebars';
import juice from 'juice';
import { MJML_TEMPLATE } from './mjmlTemplate';
import { CachedCityData } from './cityData';

export interface SponsorCard { name: string; tagline: string; logo: string ,phone: string; website: string;}
export interface EventItem { title: string; category: string; categoryClass: string; date: string; venue?: string }
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
const sponsors: SponsorCard[][] = [ //sponsors grouped by 3 for layout,default 9 sponsors
  [
    {
      name: 'A1 Roofing',
      tagline: 'Niche – Roofing',
      logo: 'https://i.ibb.co/8Lz0FvWr/A1roofing.png',
      phone: '260-348-9338',
      website: ''
    },
    {
      name: 'Blazing Heat HVAC',
      tagline: 'Niche – HVAC',
      logo: 'https://i.ibb.co/rfKQ0bD7/blazing-Heat.png',
      phone: '260-797-1850',
      website: ''
    },
    {
      name: 'Go With The Flow Plumbing',
      tagline: 'Niche – Plumbing',
      logo: 'https://i.ibb.co/MyxwgSWd/go-With-Flow.png',
      phone: '260-837-5555',
      website: ''
    }
  ],
  [
  
    {
      name: 'Sam Snyder',
      tagline: 'Niche – Real Estate Agent',
      logo: 'https://i.ibb.co/yFYYsHhw/sam-Snyder.png',
      phone: '260-466-2595',
      website: ''
    },
    {
      name: 'A1 Roofing',
      tagline: 'Niche – Roofing',
      logo: 'https://i.ibb.co/8Lz0FvWr/A1roofing.png',
      phone: '260-348-9338',
      website: ''
    },
    {
      name: 'Blazing Heat HVAC',
      tagline: 'Niche – HVAC',
      logo: 'https://i.ibb.co/rfKQ0bD7/blazing-Heat.png',
      phone: '260-797-1850',
      website: ''
    }
  ],
  [
    {
      name: 'Go With The Flow Plumbing',
      tagline: 'Niche – Plumbing',
      logo: 'https://i.ibb.co/MyxwgSWd/go-With-Flow.png',
      phone: '260-837-5555',
      website: ''
    },
    {
      name: 'Sam Snyder',
      tagline: 'Niche – Real Estate Agent',
      logo: 'https://i.ibb.co/yFYYsHhw/sam-Snyder.png',
      phone: '260-466-2595',
      website: ''
    },
    {
      name: 'A1 Roofing',
      tagline: 'Niche – Roofing',
      logo: 'https://i.ibb.co/8Lz0FvWr/A1roofing.png',
      phone: '260-348-9338',
      website: ''
    }
  ]
];



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


export function mapToVM(content: CachedCityData): EmailVM {
  const weather = {
    icon: content.weather?.current?.icon || '☀️',
    condition: content.weather?.current?.condition || content.weather?.condition || 'Clear',
    detail: `${content.weather?.current?.temp ?? (content.weather?.high && content.weather?.low ? `High- ${content.weather.high} Low- ${content.weather.low}` : '--')}° • ${content.weather?.current?.wind ?? content.weather?.wind ?? ''}`.trim()
  };

  const todaysBrief = (content.todaysBrief || []).map((x: any) => x?.title || x?.text || x?.content || String(x)).slice(0, 5);
  const news = (content.news || []).slice(0, 4).map((n: any) => ({ title: n.title, summary: n.summary || n.snippet || '', link: n.link || n.originalLink || '#' }));
  const events = (content.events || []).slice(0, 6).map((e: any) => ({
    title: e.title,
    category: e.category || 'Event',
    categoryClass: (e.category || 'other').toLowerCase(),
    date: e.date || 'Date TBD',
    venue: e.venue?.name || e.venue,
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

export function renderMjml(vm: EmailVM): string {
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
