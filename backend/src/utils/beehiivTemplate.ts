import juice from 'juice';
import { CachedCityData } from './cityData';

/**
 * Converts our daily email content into Beehiiv-compatible HTML
 * We reuse the professional email layout via emailScheduler.generateEmailHTML
 * to keep a single source of truth for layout.
 */
export function buildBeehiivHtmlFromCityData(data: CachedCityData, generateEmailHTML: (content: any) => string): string {
  const content = {
    city: data.city,
    date: data.date,
    weather: data.weather,
    todaysBrief: data.todaysBrief,
    news: data.news,
    events: data.events,
    sports: data.sports
  };

  return generateEmailHTML(content as any);
}

export function toEmailSafeHtml(fullHtml: string): string {
  try {
    // CSS'i inline et
    const inlined = juice(fullHtml, { 
      preserveImportant: true,
      removeStyleTags: true,
      webResources: {
        relativeTo: 'http://localhost:4000'
      }
    });
    
    // Sadece <body> içeriğini al (Beehiiv body_content için)
    const bodyMatch = inlined.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : inlined;
    
    return bodyContent.trim();
  } catch (error) {
    console.error('CSS inline hatası:', error);
    // Hata durumunda orijinal HTML'i döndür
    return fullHtml;
  }
}


