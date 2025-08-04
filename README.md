# 🌍 Regor - Location-Based Updates

A modern web application that provides personalized location-based information including weather, news, events, and sports updates for cities around the world.

## ✨ Features

### 🌤️ Weather Information
- Real-time current weather data
- 6-hour hourly forecasts
- 5-day weather predictions
- Beautiful weather icons and descriptions

### 📰 Local News
- City-specific news aggregation
- Latest local headlines
- News source attribution
- Cached data for performance

### 🎉 Events & Entertainment
- Local event discovery
- Entertainment recommendations
- Cultural activities
- Community events

### ⚽ Sports Updates
- Local team news and scores
- Match schedules and results
- Sports league information
- Team statistics

### 📧 Newsletter Subscription
- Email subscription system
- Personalized daily updates
- City-specific content delivery
- User preference management

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS** - Utility-first CSS framework
- **React Components** - Modular and reusable UI components

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web application framework
- **TypeScript** - Full-stack type safety

### Database & Storage
- **Supabase** - PostgreSQL database with real-time features
- **Supabase Storage** - File storage and management

### External APIs
- **SerpApi** - Google Search results for news and events
- **OpenWeatherMap** - Weather data and forecasts
- **OpenAI GPT** - AI-powered content processing and filtering
- **Eventbrite API** - Event discovery and information

## 🏗️ Project Structure

```
regor/
├── frontend/                 # Next.js React application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # Reusable React components
│   │   ├── utils/           # Frontend utilities
│   │   └── data/            # Static data files
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── utils/           # Backend utilities
│   │   ├── types/           # TypeScript type definitions
│   │   ├── *.ts             # API route handlers
│   │   └── index.ts         # Server entry point
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- API keys for external services

### Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend `.env`:**
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SERPAPI_KEY=your_serpapi_key
OPENAI_API_KEY=your_openai_api_key
OPENWEATHERMAP_KEY=your_openweathermap_key
EVENTBRITE_API_KEY=your_eventbrite_api_key
PORT=4000
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/regor.git
   cd regor
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up Supabase database:**
   - Create a new Supabase project
   - Set up the required tables (users, city_data)
   - Add your Supabase credentials to the backend `.env`

5. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

6. **Start the frontend development server:**
   ```bash
   cd frontend
   npm run dev
   ```

7. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📊 API Endpoints

### Core Endpoints
- `GET /` - Health check
- `POST /subscribe` - Newsletter subscription
- `GET /users` - Get all subscribers
- `GET /data` - Get cached city data

### Data Endpoints
- `GET /news?city={city}` - Get local news
- `GET /events?city={city}` - Get local events
- `GET /sports?city={city}` - Get sports updates
- `GET /weather?city={city}` - Get weather data

### Admin Endpoints
- `DELETE /delete-all-users` - Remove all subscribers
- `DELETE /delete-all-data` - Clear all cached data
- `DELETE /delete-user` - Remove specific user
- `DELETE /delete-city-data` - Clear specific city data

## 🎨 Key Features Implementation

### Smart Caching System
- **Weather**: 3-hour cache duration
- **News**: 6-hour cache duration
- **Events**: 6-hour cache duration
- **Sports**: 6-hour cache duration

### AI-Powered Content Filtering
- Uses OpenAI GPT models to filter and process content
- Removes inappropriate or irrelevant content
- Generates summaries and improves readability
- Categorizes events and news automatically

### Rate Limiting & Performance
- API throttling to respect external service limits
- Efficient caching strategy to minimize API calls
- Debounced user inputs for better UX
- Optimized database queries

### Error Handling & Reliability
- Comprehensive error handling across all endpoints
- Graceful degradation when external services fail
- Retry mechanisms for critical operations
- Detailed logging for debugging

## 🧪 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Quality
```bash
# TypeScript type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format
```

### Building for Production
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured experience with side-by-side layouts
- **Tablet**: Adapted layouts with touch-friendly interfaces
- **Mobile**: Stacked layouts with simplified navigation

## 🔒 Security & Privacy

- Input validation and sanitization
- Environment variable protection
- Secure API key management
- CORS configuration for cross-origin requests
- Rate limiting to prevent abuse

## 🌟 Future Enhancements

- [ ] User authentication and profiles
- [ ] Push notifications for breaking news
- [ ] Multi-language support
- [ ] Advanced filtering and personalization
- [ ] Mobile app development
- [ ] Social sharing features
- [ ] Analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for database and hosting
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Next.js](https://nextjs.org/) for the React framework

---

**Made with ❤️ by [Your Name]**
