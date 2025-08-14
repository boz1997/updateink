import mjml2html from 'mjml';
import Handlebars from 'handlebars';
import juice from 'juice';
import { MJML_TEMPLATE } from './mjmlTemplate';
import { CachedCityData } from './cityData';

export interface SponsorCard { name: string; tagline: string; logo: string }
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

export function mapToVM(content: CachedCityData): EmailVM {
  const weather = {
    icon: content.weather?.current?.icon || '☀️',
    condition: content.weather?.current?.condition || content.weather?.condition || 'Clear',
    detail: `${content.weather?.current?.temp ?? content.weather?.high ?? '--'}° • ${content.weather?.current?.wind ?? content.weather?.wind ?? ''}`.trim()
  };

  const sponsors: SponsorCard[][] = [
    [
      { name: 'Blazing Heat HVAC', tagline: 'HVAC Partner', logo: 'https://via.placeholder.com/100x100.png?text=HVAC' },
      { name: 'Go With The Flow Plumbing', tagline: 'Plumbing Partner', logo: 'https://via.placeholder.com/100x100.png?text=Plumbing' },
      { name: "What's your home worth? Ask Sam Snyder", tagline: 'Real Estate Partner', logo: 'https://via.placeholder.com/100x100.png?text=Real+Estate' }
    ]
  ];

  const todaysBrief = (content.todaysBrief || []).map((x: any) => x?.title || x?.text || x?.content || String(x)).slice(0, 5);
  const news = (content.news || []).slice(0, 4).map((n: any) => ({ title: n.title, summary: n.summary || n.snippet || '', link: n.link || n.originalLink || '#' }));
  const events = (content.events || []).slice(0, 6).map((e: any) => ({
    title: e.title,
    category: e.category || 'Event',
    categoryClass: (e.category || 'other').toLowerCase(),
    date: e.date || 'Date TBD',
    venue: e.venue?.name || e.venue
  }));
  const matches = (content.sports?.matches || []).slice(0, 8).map((m: any) => ({
    sport: m.sport || 'Other', title: m.title || m.teams || 'Game', date: m.date || m.time || 'TBD', venue: m.venue, teams: m.teams
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
