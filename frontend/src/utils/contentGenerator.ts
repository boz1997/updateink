export interface WeatherCurrent {
  temp: number
  condition: string
  icon: string
  humidity: number
  wind: number
  pressure: number
  visibility: number
}

export interface WeatherHourlyItem {
  time: string
  temp: number
  condition: string
}

export interface WeatherDailyItem {
  date: string
  temp: number
  condition: string
}

export interface WeatherData {
  current: WeatherCurrent
  hourly: WeatherHourlyItem[]
  daily: WeatherDailyItem[]
}

// 2) Haber öğesi
export interface NewsItem {
  title: string
  summary: string
  link: string
  isRelevant?: boolean
  isAppropriate?: boolean
}

// 3) Etkinlik öğesi
export interface EventItem {
  title: string
  date: string
  venue: string
  link: string
}

// 4) Spor haberi öğesi
export interface SportItem {
  title: string
  summary: string
  link: string
  originalTitle?: string
  isAIProcessed: boolean
}

// 5) Maç öğesi
export interface MatchItem {
  title: string
  date: string
  teams: string
  sport: string
  link: string
}

// 6) EmailData’yı artık gerçek tiplerle tanımlıyoruz
export interface EmailData {
  city: string
  weather: WeatherData
  news: NewsItem[]
  events: EventItem[]
  sports: SportItem[]
  matches: MatchItem[]
}

interface Match {
  sport: string
  title?: string
  date?: string
  teams?: string
  link?: string
}

type FormattedMatch = {
  title: string
  date: string
  teams: string
  sport: string
  link: string
}

export const generateEmailContent = async (city: string): Promise<EmailData> => {
  try {
    const [weatherData, newsData, eventsData, sportsData] = await Promise.all([
      fetchWeatherData(city),
      fetchNewsData(city),
      fetchEventsData(city),
      fetchSportsData(city)
    ])

    return {
      city,
      weather: weatherData,
      news: newsData,
      events: eventsData,
      sports: sportsData.sports,
      matches: sportsData.matches
    }
  } catch (error) {
    console.error('Error generating email content:', error)
    throw error
  }
}

const fetchWeatherData = async (city: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`,
      { headers: { 'Cache-Control': 'max-age=300' } }
    )
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    const weather = data.weather
    return {
      current: {
        temp: Math.round(weather.current.main.temp),
        condition: weather.current.weather[0]?.description || 'Unknown',
        icon: weather.current.weather[0]?.icon || '🌤️',
        humidity: weather.current.main.humidity,
        wind: Math.round(weather.current.wind.speed),
        pressure: weather.current.main.pressure,
        visibility: Math.round(weather.current.visibility / 1609.34)
      },
      hourly:
        weather.forecast?.list
          ?.slice(0, 6)
          .map((hour: any) => ({
            time: new Date(hour.dt * 1000).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            temp: Math.round(hour.main.temp),
            condition: hour.weather[0]?.description || 'Unknown'
          })) || [],
      daily:
        weather.forecast?.list
          ?.filter((_: any, i: number) => i % 8 === 0)
          .slice(0, 3)
          .map((day: any) => ({
            date: new Date(day.dt * 1000).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            }),
            temp: Math.round(day.main.temp),
            condition: day.weather[0]?.description || 'Unknown'
          })) || []
    }
  } catch {
    console.error('Weather fetch error')
    return {
      current: { temp: 0, condition: 'Data unavailable', icon: '❌' },
      hourly: [],
      daily: []
    }
  }
}

const fetchNewsData = async (city: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/news?city=${encodeURIComponent(city)}`,
      { headers: { 'Cache-Control': 'max-age=600' } }
    )
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return (
      data.news
        ?.slice(0, 12)
        .map((n: any) => ({
          title: n.title || 'No title',
          summary: n.summary || 'No summary',
          link: n.link || '#',
          isRelevant: n.isRelevant,
          isAppropriate: n.isAppropriate
        })) || []
    )
  } catch {
    console.error('News fetch error')
    return []
  }
}

const extractVenueFromSnippet = (snippet: string): string => {
  if (!snippet) return 'Venue not specified'
  const patterns = [
    /@\s*([^,]+(?:,\s*[^,]+)*)/i,
    /at\s+([^,]+(?:,\s*[^,]+)*)/i,
    /showing at\s+([^,]+(?:,\s*[^,]+)*)/i,
    /in\s+([^,]+(?:,\s*[^,]+)*)/i
  ]
  for (const pattern of patterns) {
    const match = snippet.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return 'Venue not specified'
}

const formatEventDate = (dateString: string): string => {
  if (!dateString) return 'Date not specified'
  try {
    if (dateString.includes(',')) {
      const parts = dateString.split(',')
      if (parts.length >= 2) {
        const [_, datePart, timePart = ''] = parts
        const [monthOnly, dateOnly] = datePart.trim().split(' ')
        const fullDate = `${monthOnly} ${dateOnly}, 2025`
        const d = new Date(fullDate)
        if (!isNaN(d.getTime())) {
          const formatted = d.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
          return timePart.trim() ? `${formatted} ${timePart.trim()}` : formatted
        }
      }
    }
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return 'Date not specified'
    return d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Date not specified'
  }
}

const fetchEventsData = async (city: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events?city=${encodeURIComponent(city)}`,
      { headers: { 'Cache-Control': 'max-age=600' } }
    )
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return (
      data.events
        ?.slice(0, 10)
        .map((e: any) => {
          const date = formatEventDate(e.date)
          let venue = 'Venue not specified'
          if (e.venue && typeof e.venue === 'object' && e.venue.name) {
            venue = e.venue.name
          } else if (typeof e.venue === 'string') {
            venue = e.venue
          } else {
            venue = extractVenueFromSnippet(e.snippet || '')
          }
          return {
            title: e.title || 'No event name',
            date,
            venue,
            link: e.link || '#'
          }
        }) || []
    )
  } catch {
    console.error('Events fetch error')
    return []
  }
}

const fetchSportsData = async (
  city: string
): Promise<{ sports: any[]; matches: FormattedMatch[] }> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/sports?city=${encodeURIComponent(city)}`,
      { headers: { 'Cache-Control': 'max-age=600' } }
    )
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    const sports =
      data.sports
        ?.slice(0, 8)
        .map((s: any) => ({
          title: s.aiTitle || s.originalTitle || 'No sports news title',
          summary: s.aiSummary || 'No summary',
          link: s.link || '#',
          originalTitle: s.originalTitle,
          isAIProcessed: Boolean(s.aiTitle)
        })) || []
    const rawMatches: Match[] = data.upcomingMatches
      ? Object.values<Match[]>(data.upcomingMatches).flat()
      : []
    const matches: FormattedMatch[] = rawMatches
      .slice(0, 10)
      .map(m => ({
        title: `${getSportEmoji(m.sport)} ${m.title ?? 'Match'}`,
        date: m.date ?? 'Date not specified',
        teams: m.teams ?? 'Teams not specified',
        sport: m.sport,
        link: m.link ?? '#'
      }))
    return { sports, matches }
  } catch {
    console.error('Sports fetch error')
    return { sports: [], matches: [] }
  }
}

const getSportEmoji = (sport: string): string => {
  const s = sport.toLowerCase()
  if (s.includes('basketball') || s.includes('nba')) return '🏀'
  if (s.includes('football') || s.includes('nfl')) return '🏈'
  if (s.includes('baseball') || s.includes('mlb')) return '⚾'
  if (s.includes('soccer') || s.includes('mls')) return '⚽'
  if (s.includes('hockey') || s.includes('nhl')) return '🏒'
  if (s.includes('tennis')) return '🎾'
  if (s.includes('volleyball')) return '🏐'
  if (s.includes('golf')) return '⛳'
  if (s.includes('rugby')) return '🏉'
  if (s.includes('boxing')) return '🥊'
  if (s.includes('mma') || s.includes('ufc')) return '🥋'
  if (s.includes('racing') || s.includes('f1') || s.includes('nascar')) return '🏁'
  if (s.includes('running') || s.includes('marathon')) return '🏃'
  return '🏆'
}
