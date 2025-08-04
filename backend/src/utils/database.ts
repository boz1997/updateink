import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Environment variables'ları yükle (emin olmak için)
dotenv.config();

/**
 * Supabase client instance'ını oluşturur ve yönetir
 * Singleton pattern kullanarak tek bir instance döndürür
 */
let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables are not configured');
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  
  return supabaseClient;
};

/**
 * Tarih bazlı veri kontrolü yapar
 * @param city - Şehir adı
 * @param date - Tarih (YYYY-MM-DD formatında)
 * @param type - Veri tipi (news, events, sports, weather)
 * @returns O gün için veri varsa true, yoksa false
 */
export const checkDateData = async (
  city: string, 
  date: string, 
  type: string
): Promise<{ data: any; exists: boolean } | null> => {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('city_data')
      .select('data, created_at')
      .eq('city', city)
      .eq('date', date)
      .eq('type', type)
      .single();
    
    if (error || !data) {
      return { data: null, exists: false };
    }
    
    return { data: data.data, exists: true };
  } catch (error) {
    console.error(`Date data check error for ${city} ${type}:`, error);
    return { data: null, exists: false };
  }
};

/**
 * Veriyi cache'e kaydeder
 * @param city - Şehir adı
 * @param date - Tarih
 * @param type - Veri tipi
 * @param data - Kaydedilecek veri
 */
export const saveToCache = async (
  city: string, 
  date: string, 
  type: string, 
  data: any
): Promise<boolean> => {
  const supabase = getSupabaseClient();
  
  try {
    // Eski veriyi sil
    await supabase
      .from('city_data')
      .delete()
      .eq('city', city)
      .eq('date', date)
      .eq('type', type);
    
    // Yeni veriyi kaydet
    const { error } = await supabase
      .from('city_data')
      .insert({
        city,
        date,
        type,
        data
      });
    
    if (error) {
      console.error(`Cache save error for ${city} ${type}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Cache save error for ${city} ${type}:`, error);
    return false;
  }
};

/**
 * Cache'i temizler (belirli şehir ve veri tipi için)
 * @param city - Şehir adı (opsiyonel, tüm şehirler için boş bırak)
 * @param type - Veri tipi (opsiyonel, tüm tipler için boş bırak)
 */
export const clearCache = async (city?: string, type?: string): Promise<boolean> => {
  const supabase = getSupabaseClient();
  
  try {
    let query = supabase.from('city_data').delete();
    
    if (city) {
      query = query.eq('city', city);
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error(`Cache clear error:`, error);
      return false;
    }
    
    console.log(`🗑️ Cache cleared for ${city || 'all cities'} ${type || 'all types'}`);
    return true;
  } catch (error) {
    console.error(`Cache clear error:`, error);
    return false;
  }
}; 