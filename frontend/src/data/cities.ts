export interface CityOption {
  value: string;
  label: string;
  state?: string;
  aliases?: string[]; // Yazım hataları ve alternatif isimler için
}

// Backend API'den gelen şehir verisi için interface
interface BackendCity {
  value: string;
  label: string;
}

// Bellek içi cache: API'den bir kez yüklensin
let CITIES_CACHE: CityOption[] | null = null;

// Backend API'den şehirleri yükleyen fonksiyon
export const loadCitiesFromAPI = async (): Promise<CityOption[]> => {
  try {
    if (CITIES_CACHE) return CITIES_CACHE;
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/cities`);
    const data = await response.json();
    
    if (!data.success || !data.cities) {
      throw new Error('Failed to load cities from API');
    }

    // Backend'ten gelen format: { "Indiana (IN)": [{value: "fishers", label: "Fishers"}] }
    const cities: CityOption[] = [];
    
    Object.entries(data.cities).forEach(([stateLabel, stateCities]) => {
      const stateCode = stateLabel.match(/\(([^)]+)\)$/)?.[1] || '';
      (stateCities as BackendCity[]).forEach(city => {
        cities.push({
          value: city.value,
          label: `${city.label}, ${stateCode}`, // Eyalet kodu eklendi
          state: stateCode,
          aliases: [city.label.toLowerCase(), stateCode.toLowerCase()]
        });
      });
    });

    // Cache'le ve döndür
    CITIES_CACHE = cities;
    console.log(`✅ Loaded ${cities.length} cities from API`);
    return cities;
  } catch (error) {
    console.error('Failed to load cities from API:', error);
    // Hata durumunda fallback olarak temel şehirler
    CITIES_CACHE = getFallbackCities();
    return CITIES_CACHE;
  }
};

// Fallback şehirler (API yüklenemezse)
const getFallbackCities = (): CityOption[] => [
  {
    value: "fort-wayne",
    label: "Fort Wayne, FL",
    state: "FL",
    aliases: ["fort wayne", "florida"]
  }
];

// Şehir arama fonksiyonu
export const searchCities = async (query: string, limit: number = 50): Promise<CityOption[]> => {
  const cities = await loadCitiesFromAPI();
  const trimmed = query.trim();
  if (!trimmed) return cities.slice(0, limit);

  const q = trimmed.toLowerCase();

  const scored = cities
    .map((city) => {
      const value = city.value.toLowerCase();
      const label = city.label.toLowerCase();
      const aliases = (city.aliases || []).map((a) => a.toLowerCase());

      let score = 0;
      if (value === q) score = 100; // Tam şehir adı eşleşmesi
      else if (label.startsWith(q)) score = 90; // Label başında
      else if (value.startsWith(q)) score = 85; // Şehir adı başında
      else if (aliases.includes(q)) score = 80; // Alias tam eşleşme
      else if (aliases.some((a) => a.startsWith(q))) score = 70;
      else if (label.includes(q)) score = 60;
      else if (value.includes(q)) score = 55;

      return { city, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => (b.score - a.score) || a.city.label.localeCompare(b.city.label))
    .map((x) => x.city);

  return scored.slice(0, limit);
};

// Şehir değerini CityOption'a çevirme
export const getCityOption = async (cityValue: string): Promise<CityOption | null> => {
  const cities = await loadCitiesFromAPI();
  return cities.find(city => city.value === cityValue) || null;
};

// Şehir değerini label'a çevirme
export const getCityLabel = async (cityValue: string): Promise<string> => {
  const city = await getCityOption(cityValue);
  return city ? city.label : cityValue;
};

// Tüm şehirleri getir
export const getAllCities = async (): Promise<CityOption[]> => {
  return await loadCitiesFromAPI();
}; 

// Paginasyonlu arama (infinite scroll için)
export const searchCitiesPaged = async (
  query: string,
  offset: number = 0,
  limit: number = 30
): Promise<{ items: CityOption[]; total: number }> => {
  const all = await searchCities(query, Number.MAX_SAFE_INTEGER);
  const total = all.length;
  const items = all.slice(offset, offset + limit);
  return { items, total };
};

// Debugging: Tüm şehir sayısını logla
export const debugCityCount = async () => {
  const cities = await getAllCities();
  console.log(`🏙️ Total cities loaded: ${cities.length}`);
  return cities.length;
};