import { Request, Response } from 'express';
import { getSupabaseClient } from './utils/database';
import { User } from './types';

/**
 * Tüm kullanıcıları getiren handler
 */
export const getUsersHandler = async (req: Request, res: Response) => {
  const supabase = getSupabaseClient();

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Users fetch error:', error);
      return res.status(500).json({ error: 'Users fetch failed', details: error.message });
    }

    res.json({ users: users || [] });
  } catch (error: any) {
    console.error('❌ Users handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

/**
 * Tüm kullanıcıları silen handler
 */
export const deleteAllUsersHandler = async (req: Request, res: Response) => {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000'); // Tüm kayıtları sil

    if (error) {
      console.error('❌ Users delete error:', error);
      return res.status(500).json({ error: 'Users delete failed', details: error.message });
    }

    console.log('✅ All users deleted successfully');
    res.json({ message: 'All users deleted successfully' });
  } catch (error: any) {
    console.error('❌ Delete all users error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

/**
 * Belirli bir kullanıcıyı silen handler
 */
export const deleteUserHandler = async (req: Request, res: Response) => {
  const { userId } = req.query;
  
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID query parameter is required' });
  }

  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('❌ User delete error:', error);
      return res.status(500).json({ error: 'User delete failed', details: error.message });
    }

    console.log(`✅ User ${userId} deleted successfully`);
    res.json({ message: `User deleted successfully` });
  } catch (error: any) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

/**
 * Şehir verilerini getiren handler
 */
export const getCityDataHandler = async (req: Request, res: Response) => {
  const supabase = getSupabaseClient();

  try {
    const { data: cityData, error } = await supabase
      .from('city_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ City data fetch error:', error);
      return res.status(500).json({ error: 'City data fetch failed', details: error.message });
    }

    res.json({ cityData: cityData || [] });
  } catch (error: any) {
    console.error('❌ City data handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

/**
 * Tüm verileri silen handler
 */
export const deleteAllDataHandler = async (req: Request, res: Response) => {
  const supabase = getSupabaseClient();

  try {
    // Tüm city_data kayıtlarını sil
    const { error: cityDataError } = await supabase
      .from('city_data')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');

    if (cityDataError) {
      console.error('❌ City data delete error:', cityDataError);
      return res.status(500).json({ error: 'City data delete failed', details: cityDataError.message });
    }

    // Tüm users kayıtlarını sil
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');

    if (usersError) {
      console.error('❌ Users delete error:', usersError);
      return res.status(500).json({ error: 'Users delete failed', details: usersError.message });
    }

    console.log('✅ All data deleted successfully');
    res.json({ message: 'All data deleted successfully' });
  } catch (error: any) {
    console.error('❌ Delete all data error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

/**
 * Belirli bir şehrin verilerini silen handler
 */
export const deleteCityDataHandler = async (req: Request, res: Response) => {
  const { city } = req.query;
  
  if (!city || typeof city !== 'string') {
    return res.status(400).json({ error: 'City parameter is required' });
  }

  const supabase = getSupabaseClient();

  try {
    // Belirli şehrin tüm city_data kayıtlarını sil
    const { error: cityDataError } = await supabase
      .from('city_data')
      .delete()
      .eq('city', city);

    if (cityDataError) {
      console.error('❌ City data delete error:', cityDataError);
      return res.status(500).json({ error: 'City data delete failed', details: cityDataError.message });
    }

    // Belirli şehrin tüm users kayıtlarını sil
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .eq('city', city);

    if (usersError) {
      console.error('❌ Users delete error:', usersError);
      return res.status(500).json({ error: 'Users delete failed', details: usersError.message });
    }

    console.log(`✅ All data for ${city} deleted successfully`);
    res.json({ message: `All data for ${city} deleted successfully` });
  } catch (error: any) {
    console.error('❌ Delete city data error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}; 