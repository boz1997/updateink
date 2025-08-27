import { Request, Response } from 'express';
import { getSupabaseClient } from './utils/database';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();


/**
 * Kullanıcı abonelik handler'ı
 * Kullanıcıyı hem yerel veritabanına hem de Beehiiv'e kaydeder
 */
export const subscribeHandler = async (req: Request, res: Response) => {
  console.log('📧 Subscribe request received:', { 
    origin: req.headers.origin,
    method: req.method,
    body: req.body 
  });
  
  const supabase = getSupabaseClient();
  const { email, city } = req.body;
  
  if (!email || !city) {
    return res.status(400).json({ error: 'Email and city are required.' });
  }

  try {
    // 1. Supabase'e kaydet (hızlı işlem)
    const { error: dbError } = await supabase.from('users').insert([{ email, city }]);
    if (dbError) {
      console.error('❌ Database error:', dbError);
      return res.status(500).json({ error: 'Database error', details: dbError.message });
    }

    console.log(`✅ User ${email} subscribed to local database for ${city}`);

    // 2. Beehiiv'e de kaydet (async, response'u etkilemez)
    const citySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    subscribeToBeehiiv(email, city, citySlug).catch(error => {
      console.error('⚠️ Beehiiv subscription failed (non-blocking):', error);
    });

    // 3. Hemen response döndür (kullanıcı hızlı response alır)
    const response = {
      success: true,
      message: `Successfully subscribed to ${city} newsletter!`
    };

    return res.json(response);

  } catch (error: any) {
    console.error('❌ Subscribe handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Subscribe user to Beehiiv (async, non-blocking)
async function subscribeToBeehiiv(email: string, city: string, citySlug: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  try {
    // 1. Get publication_id from city_pub table
    const { data: cityPub, error: cityError } = await supabase
      .from('city_pub')
      .select('beehiiv_publication_id')
      .eq('city_slug', citySlug)
      .eq('is_active', true)
      .single();

    if (cityError || !cityPub) {
      console.warn(`⚠️ No active publication found for city: ${citySlug}`);
      return;
    }

    const publicationId = cityPub.beehiiv_publication_id;
    const apiKey = process.env.BEEHIIV_API_KEY;

    if (!apiKey) {
      console.error('❌ BEEHIIV_API_KEY not configured');
      return;
    }

    // 2. Create/update subscriber in Beehiiv
    const beehiivUrl = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`;
    const payload = {
      email: email,
      custom_fields: [
        {
          name: 'city_name',
          value: city
        }
      ],
      reactivate_existing: true,
      send_welcome_email: false
    };

    const response = await axios.post(beehiivUrl, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log(`🐝 Successfully subscribed ${email} to Beehiiv publication ${publicationId} for ${city}`);
    
  } catch (error: any) {
    // Log but don't throw - this is non-blocking
    if (error.response?.status === 409) {
      console.log(`🐝 User ${email} already exists in Beehiiv for ${city}`);
    } else {
      console.error(`❌ Beehiiv subscription error for ${email}:`, error.response?.data || error.message);
    }
  }
}

 