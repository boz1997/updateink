import { Request, Response } from 'express';
import { checkDateData, saveToCache } from './utils/database';
import { fetchFromSerpApi, fetchEventbriteEvents, serpApiThrottle } from './utils/api';
import { sortEventsWithAI } from './utils/ai';
import { Event } from './types';

/**
 * Etkinlik verilerini getiren handler
 * Cache kontrolü yapar, gerekirse API'den veri çeker
 */
export const getEventsHandler = async (req: Request, res: Response) => {
  const city = req.query.city as string;
  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`🎉 Checking events cache for ${city} on ${today}`);

    // 1. Cache'den veri kontrol et
    const cachedResult = await checkDateData(city, today, 'events');
    
    if (cachedResult && cachedResult.exists) {
      console.log(`✅ Cache hit for ${city} events`);
      return res.json({ events: cachedResult.data, fromCache: true });
    }

    // 2. Cache'de yoksa API'den çek
    console.log(`🔄 Cache miss for ${city} events, fetching from API`);
    
    let events: any[] = [];
    
    // Önce SerpAPI'den etkinlik verisi çek
    try {
      // Rate limiting uygula
      await serpApiThrottle();
      
      const response = await fetchFromSerpApi('google_events', `${city} events concerts shows`, {
        num: 20,
        location_requested: city,
        location: city,
        near: city
      }) as any;
      
      events = response.events_results || [];
      console.log(`📊 Fetched ${events.length} events from SerpAPI`);
      
    } catch (error) {
      console.log('❌ SerpAPI events failed, trying google_search...');
      
      // Fallback olarak google_search kullan
      await serpApiThrottle(); // Rate limiting
      
      const response = await fetchFromSerpApi('google_search', `${city} upcoming events concerts shows 2024 2025`, {
        num: 20
      }) as any;
      
      events = response.events_results || [];
    }
    
    // Eventbrite'dan ek veri çek (venue bilgisi eksikse)
    if (events.length > 0 && events.every((event: any) => !event.venue && !event.location)) {
      try {
        const eventbriteResponse = await fetchEventbriteEvents(city);
        const eventbriteEvents = eventbriteResponse.events || [];
        
        // Eventbrite verilerini SerpAPI formatına çevir
        const convertedEvents = eventbriteEvents.map((event: any) => ({
          title: event.name?.text || 'Event Title',
          date: event.start?.local || 'Date not available',
          venue: event.venue?.name || 'Venue not available',
          link: event.url || '#',
          snippet: event.description?.text?.substring(0, 200) || 'No description',
          thumbnail: event.logo?.url || null
        }));
        
        events = [...events, ...convertedEvents];
        console.log(`📊 Added ${convertedEvents.length} events from Eventbrite`);
        
      } catch (eventbriteError) {
        console.log('❌ Eventbrite API failed:', eventbriteError);
      }
    }
    
    // 3. Veri yapısını temizle ve geçmiş etkinlikleri filtrele
    const now = new Date();
    const cleanedEvents = events
      .map((event: any) => {
        // Date alanını string'e çevir
        let dateString = 'Date not available';
        if (event.date) {
          if (typeof event.date === 'string') {
            dateString = event.date;
          } else if (typeof event.date === 'object' && event.date.when) {
            dateString = event.date.when;
          } else if (typeof event.date === 'object' && event.date.start_date) {
            dateString = event.date.start_date;
          }
        } else if (event.date_when) {
          dateString = event.date_when;
        }

        // Venue alanını kontrol et
        let venueString = 'Venue not available';
        if (event.venue) {
          venueString = event.venue;
        } else if (event.location) {
          venueString = event.location;
        } else if (event.address) {
          venueString = event.address;
        } else if (event.place) {
          venueString = event.place;
        } else if (event.venue_name) {
          venueString = event.venue_name;
        }

        return {
          title: event.title || 'Event Title Not Available',
          date: dateString,
          venue: venueString,
          link: event.link || event.event_link || '#',
          snippet: event.snippet || event.description || 'No description available',
          thumbnail: event.thumbnail || null
        };
      })
      .filter((event: any) => event !== null); // Geçmiş etkinlikleri filtrele

    console.log(`✅ Processed ${cleanedEvents.length} events`);

    // 4. AI ile etkinlikleri sırala
    const sortedEvents = await sortEventsWithAI(cleanedEvents);

    console.log(`✅ AI sorted ${sortedEvents.length} events`);

    // 5. Cache'e kaydet
    await saveToCache(city, today, 'events', sortedEvents);

    res.json({ events: sortedEvents, fromCache: false });

  } catch (error: any) {
    console.error('❌ Events fetch error:', error);
    res.status(500).json({ 
      error: 'Events fetch error', 
      details: error.message 
    });
  }
}; 