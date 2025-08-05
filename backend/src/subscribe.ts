import { Request, Response } from 'express';
import { getSupabaseClient } from './utils/database';


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

    // 2. Hemen response döndür (kullanıcı hızlı response alır)
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

 