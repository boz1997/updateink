export interface CityOption {
  value: string;
  label: string;
  state: string;
  aliases?: string[]; // Yazım hataları ve alternatif isimler için
}

// Bellek içi cache: CSV bir kez yüklensin
let CITIES_CACHE: CityOption[] | null = null;

// CSV'den şehirleri yükleyen fonksiyon
export const loadCitiesFromCSV = async (): Promise<CityOption[]> => {
  try {
    if (CITIES_CACHE) return CITIES_CACHE;
    const response = await fetch('/cities.csv');
    let csvText = await response.text();
    // BOM temizleme
    if (csvText.charCodeAt(0) === 0xFEFF) {
      csvText = csvText.slice(1);
    }
    
    // CSV'yi parse et
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());
    const cities: CityOption[] = [];
    
    // Header var mı kontrol et
    const hasHeader = !lines[0].match(/"([^"]+)",\s*"([^"]+)"/);
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Quotes'lu formatı dene
      let cityName = '';
      let stateCode = '';
      const quoted = line.match(/"([^\"]+)"\s*,\s*"([^\"]+)"/);
      if (quoted) {
        cityName = quoted[1].trim();
        stateCode = quoted[2].trim();
      } else {
        // Basit virgül ayrımı (unquoted)
        const parts = line.split(',');
        if (parts.length >= 2) {
          cityName = parts[0].trim();
          stateCode = parts[1].trim();
        }
      }

      if (!cityName || !stateCode) continue;

      const stateName = getStateFullName(stateCode);
      cities.push({
        value: cityName,
        label: `${cityName}, ${stateCode}`,
        state: stateName,
        aliases: [cityName.toLowerCase(), stateCode.toLowerCase(), stateName.toLowerCase()]
      });
    }
    
    CITIES_CACHE = cities;
    return CITIES_CACHE;
  } catch (error) {
    console.error('CSV yüklenirken hata:', error);
    // Hata durumunda fallback olarak temel şehirler
    CITIES_CACHE = getFallbackCities();
    return CITIES_CACHE;
  }
};

// State code'ları full name'e çeviren fonksiyon
const getStateFullName = (stateCode: string): string => {
  const stateMap: { [key: string]: string } = {
    'AK': 'Alaska', 'AL': 'Alabama', 'AR': 'Arkansas', 'AZ': 'Arizona',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DC': 'District of Columbia',
    'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii',
    'IA': 'Iowa', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'MA': 'Massachusetts',
    'MD': 'Maryland', 'ME': 'Maine', 'MI': 'Michigan', 'MN': 'Minnesota',
    'MO': 'Missouri', 'MS': 'Mississippi', 'MT': 'Montana', 'NC': 'North Carolina',
    'ND': 'North Dakota', 'NE': 'Nebraska', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NV': 'Nevada', 'NY': 'New York', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
    'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas',
    'UT': 'Utah', 'VA': 'Virginia', 'VT': 'Vermont', 'WA': 'Washington',
    'WI': 'Wisconsin', 'WV': 'West Virginia', 'WY': 'Wyoming'
  };
  
  return stateMap[stateCode.toUpperCase()] || stateCode;
};

// Fallback şehirler (CSV yüklenemezse)
const getFallbackCities = (): CityOption[] => [
  {
    value: "New York",
    label: "New York, NY",
    state: "New York",
    aliases: ["nyc", "new york city", "manhattan"]
  },
  {
    value: "Los Angeles",
    label: "Los Angeles, CA",
    state: "California",
    aliases: ["la", "los angeles", "hollywood"]
  },
  {
    value: "Chicago",
    label: "Chicago, IL",
    state: "Illinois",
    aliases: ["chicago", "windy city"]
  }
];

// Şehir arama fonksiyonu
export const searchCities = async (query: string, limit: number = 50): Promise<CityOption[]> => {
  const cities = await loadCitiesFromCSV();
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
  const cities = await loadCitiesFromCSV();
  return cities.find(city => city.value === cityValue) || null;
};

// Şehir değerini label'a çevirme
export const getCityLabel = async (cityValue: string): Promise<string> => {
  const city = await getCityOption(cityValue);
  return city ? city.label : cityValue;
};

// Tüm şehirleri getir
export const getAllCities = async (): Promise<CityOption[]> => {
  return await loadCitiesFromCSV();
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