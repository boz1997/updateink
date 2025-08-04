export interface CityOption {
  value: string;
  label: string;
  state: string;
  population?: number;
  aliases?: string[]; // Yazım hataları ve alternatif isimler için
}

// Amerika'nın en popüler şehirleri (yaklaşık 20 şehir)
export const US_CITIES: CityOption[] = [
  {
    value: "New York",
    label: "New York, NY",
    state: "New York",
    population: 8336817,
    aliases: ["nyc", "new york city", "manhattan", "brooklyn", "queens", "bronx", "staten island"]
  },
  {
    value: "Los Angeles",
    label: "Los Angeles, CA",
    state: "California",
    population: 3979576,
    aliases: ["la", "los angeles", "hollywood", "beverly hills", "santa monica"]
  },
  {
    value: "Chicago",
    label: "Chicago, IL",
    state: "Illinois",
    population: 2693976,
    aliases: ["chicago", "windy city", "second city"]
  },
  {
    value: "Houston",
    label: "Houston, TX",
    state: "Texas",
    population: 2320268,
    aliases: ["houston", "space city", "bayou city"]
  },
  {
    value: "Phoenix",
    label: "Phoenix, AZ",
    state: "Arizona",
    population: 1608139,
    aliases: ["phoenix", "valley of the sun", "phx"]
  },
  {
    value: "Philadelphia",
    label: "Philadelphia, PA",
    state: "Pennsylvania",
    population: 1603797,
    aliases: ["philly", "philadelphia", "city of brotherly love"]
  },
  {
    value: "San Antonio",
    label: "San Antonio, TX",
    state: "Texas",
    population: 1547253,
    aliases: ["san antonio", "alamo city", "river city"]
  },
  {
    value: "San Diego",
    label: "San Diego, CA",
    state: "California",
    population: 1423851,
    aliases: ["san diego", "america's finest city", "sd"]
  },
  {
    value: "Dallas",
    label: "Dallas, TX",
    state: "Texas",
    population: 1343573,
    aliases: ["dallas", "big d", "dfw"]
  },
  {
    value: "San Jose",
    label: "San Jose, CA",
    state: "California",
    population: 1030119,
    aliases: ["san jose", "silicon valley", "sj"]
  },
  {
    value: "Austin",
    label: "Austin, TX",
    state: "Texas",
    population: 978908,
    aliases: ["austin", "live music capital", "atx"]
  },
  {
    value: "Jacksonville",
    label: "Jacksonville, FL",
    state: "Florida",
    population: 949611,
    aliases: ["jacksonville", "jax", "river city"]
  },
  {
    value: "Fort Worth",
    label: "Fort Worth, TX",
    state: "Texas",
    population: 918915,
    aliases: ["fort worth", "cowtown", "fw"]
  },
  {
    value: "Columbus",
    label: "Columbus, OH",
    state: "Ohio",
    population: 898553,
    aliases: ["columbus", "ohio state", "cbus"]
  },
  {
    value: "Charlotte",
    label: "Charlotte, NC",
    state: "North Carolina",
    population: 885708,
    aliases: ["charlotte", "queen city", "clt"]
  },
  {
    value: "San Francisco",
    label: "San Francisco, CA",
    state: "California",
    population: 873965,
    aliases: ["san francisco", "sf", "frisco", "bay area", "golden gate"]
  },
  {
    value: "Indianapolis",
    label: "Indianapolis, IN",
    state: "Indiana",
    population: 876384,
    aliases: ["indianapolis", "indy", "circle city"]
  },
  {
    value: "Seattle",
    label: "Seattle, WA",
    state: "Washington",
    population: 744955,
    aliases: ["seattle", "emerald city", "rain city", "sea"]
  },
  {
    value: "Denver",
    label: "Denver, CO",
    state: "Colorado",
    population: 727211,
    aliases: ["denver", "mile high city", "den"]
  },
  {
    value: "Washington",
    label: "Washington, DC",
    state: "District of Columbia",
    population: 689545,
    aliases: ["washington", "dc", "washington dc", "district of columbia", "capitol"]
  },
  {
    value: "Boston",
    label: "Boston, MA",
    state: "Massachusetts",
    population: 675647,
    aliases: ["boston", "beantown", "the hub", "bos"]
  },
  {
    value: "El Paso",
    label: "El Paso, TX",
    state: "Texas",
    population: 678815,
    aliases: ["el paso", "sun city", "ep"]
  },
  {
    value: "Nashville",
    label: "Nashville, TN",
    state: "Tennessee",
    population: 689447,
    aliases: ["nashville", "music city", "nash"]
  },
  {
    value: "Detroit",
    label: "Detroit, MI",
    state: "Michigan",
    population: 674841,
    aliases: ["detroit", "motor city", "motown", "det"]
  },
  {
    value: "Oklahoma City",
    label: "Oklahoma City, OK",
    state: "Oklahoma",
    population: 655057,
    aliases: ["oklahoma city", "okc", "sooner city"]
  },
  {
    value: "Bodrum",
    label: "Bodrum, Muğla",
    state: "Muğla",
    population: 175000,
    aliases: ["bodrum", "muğla", "mugla", "turkey", "türkiye"]
  },
  {
    value: "Pendik",
    label: "Pendik, İstanbul",
    state: "İstanbul",
    population: 700000,
    aliases: ["pendik", "istanbul", "turkey", "türkiye", "pendik istanbul"]
  }
];

// Şehir arama fonksiyonu - yazım hatalarını ve alternatif isimleri destekler
export const searchCities = (query: string): CityOption[] => {
  if (!query.trim()) return US_CITIES;
  
  const searchTerm = query.toLowerCase().trim();
  
  return US_CITIES.filter(city => {
    // Ana isim kontrolü
    if (city.value.toLowerCase().includes(searchTerm) || 
        city.label.toLowerCase().includes(searchTerm) ||
        city.state.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    // Alias kontrolü
    if (city.aliases) {
      return city.aliases.some(alias => 
        alias.toLowerCase().includes(searchTerm)
      );
    }
    
    return false;
  });
};

// Şehir değerini CityOption'a çevirme
export const getCityOption = (cityValue: string): CityOption | null => {
  return US_CITIES.find(city => city.value === cityValue) || null;
};

// Şehir değerini label'a çevirme
export const getCityLabel = (cityValue: string): string => {
  const city = getCityOption(cityValue);
  return city ? city.label : cityValue;
}; 