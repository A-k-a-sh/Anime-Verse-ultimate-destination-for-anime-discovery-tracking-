# AnimeVerse 🎌

Your ultimate destination for anime discovery, tracking, and community engagement.

![AnimeVerse](./Frontend/public/Animeverse.png)

## 🌟 Features

- **Discover Anime & Manga**: Browse thousands of anime and manga titles with advanced filtering by genres, status, release years, formats, and adult ratings
- **Embedded Dual-Server Video Player**: Stream anime episodes directly on site with dual-server redundancy (Server 1: MegaPlay, Server 2: ZokoAnime with custom purple theme and Auto-Skip), Sub/Dub/HSub tracks, and failover recovery
- **Theater & Lights-Off (Cinema) Modes**: YouTube-style wide theater mode (82vh) and viewport-wide cinema dimming (`z-[60]`) with custom keyboard shortcuts (`N`, `P`, `S`, `T`, `L`, `F`, `Esc`)
- **Interactive Episode Selector**: 50-episode range pagination, search filter, Grid vs List view toggling, and real episode title resolution (AniList & Kitsu mapping fallback)
- **Database-First High Performance**: Instantaneous response times (< 15ms) powered by local MongoDB caching and automated write-through fallback to AniList
- **Unified Progress Tracking & Dynamic CTAs**: Synchronized episode tracking across `localStorage` and MongoDB Watchlist, with dynamic "Watch Episode 1" / "Continue Watching Ep X" CTAs on Anime Details, Hero, and Home
- **Personalized Recommendations**: Contextual anime and manga recommendations with smooth horizontal snap-scroll rails
- **Top & Seasonal Airing**: Explore all-time top-rated anime, current seasonal releases, and historical seasonal archives
- **Character & Staff Database**: In-depth character profiles with Japanese voice actors and full production staff
- **Auto-Expanding Pagination**: Seamless infinite browsing that dynamically fetches and caches new pages from AniList when database pages are exhausted
- **Responsive Dark UI**: Modern dark-mode user interface optimized for desktop, tablet, and mobile devices

## 🚀 Tech Stack

### Frontend
- **React 18** - UI component library
- **Vite** - High-performance frontend build tool
- **Tailwind CSS** - Modern utility-first styling
- **Framer Motion** - Smooth transitions and layout animations
- **Axios** - HTTP client with request deduplication and in-memory caching
- **React Router 7** - Client-side single page application routing
- **Heroicons** - Clean SVG iconography

### Backend
- **Node.js & Express** - Scalable REST API framework
- **MongoDB & Mongoose** - Document database with schema indexing and database-first caching
- **AniList GraphQL Client** - Resilient external data provider client (`graphql.anilist.co`)
- **JWT (JSON Web Tokens)** - Stateless authentication
- **Bcrypt** - Salted password hashing
- **Express Rate Limit** - API abuse protection
- **Helmet** - Enterprise security headers

### External API & Streaming Providers
- **AniList GraphQL API v2** - High-speed, modern GraphQL catalog API for anime, manga, and characters
- **Server 1: MegaPlay (`megaplay.buzz`)** - High-speed default video stream provider with Sub/Dub audio tracks
- **Server 2: ZokoAnime (`zokoanime.video`)** - Multi-server video stream provider with Auto-Skip intro/outro, Sub/Dub/HSub tracks, and custom purple accent skin
- **Kitsu API (`kitsu.io`)** - Secondary episode mapping provider ensuring complete episode lists and titles for long-running series

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB (local community edition or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the `Backend` directory:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure your `.env` file:
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/anime-site
JWT_SECRET=your_jwt_secret_key
ANILIST_API_URL=https://graphql.anilist.co
FRONTEND_URL=http://localhost:5173
```

4. Seed initial catalog data (Optional but recommended):
```bash
# Seed top 1,000 anime
npm run seed:anime

# Seed top 100 manga catalog
npm run seed:manga

# Synchronize currently airing anime episodes
npm run sync:airing
```

5. Start the backend development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the `Frontend` directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure your `.env` file:
```env
VITE_API_URL=http://localhost:3000/api
```

4. Start the frontend development server:
```bash
npm run dev
```

## 🛠️ Available Scripts

### Backend (`/Backend`)
- `npm run dev` - Start development server with Nodemon auto-reload
- `npm start` - Run production server
- `npm run seed:anime` - Batch seed top 1,000 popular anime titles from AniList into MongoDB
- `npm run seed:manga` - Batch seed top 100 popular manga titles from AniList into MongoDB
- `npm run sync:airing` - Refresh episode counts, airing statuses, and scores for currently releasing anime

### Frontend (`/Frontend`)
- `npm run dev` - Start Vite development server
- `npm run build` - Build optimized production assets in `dist/`
- `npm run preview` - Preview production build locally

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new account
- `POST /api/auth/login` - Authenticate user & issue JWT
- `GET /api/auth/me` - Retrieve current authenticated user profile
- `PUT /api/auth/profile` - Update user bio, avatar, and preferences

### Anime
- `GET /api/anime` - Paginated anime catalog with filters (genre, status, rating, sort)
- `GET /api/anime/search` - Advanced search and multi-filter browse with AniList auto-fallback
- `GET /api/anime/top` - Get all-time top-rated anime
- `GET /api/anime/seasonal/:year/:season` - Seasonal anime releases (e.g. `2024/fall`)
- `GET /api/anime/:id` - Full anime details (characters, voice actors, staff, recommendations)
- `GET /api/anime/:id/characters` - Anime character roster with Japanese voice actors
- `GET /api/anime/:id/recommendations` - Contextual recommendations (genre-matched fallback)
- `GET /api/anime/:id/episodes` - Complete episode list with resolved titles (AniList + Kitsu fallback)

### Manga
- `GET /api/manga` - Paginated manga catalog with database-first caching
- `GET /api/manga/search` - Search and browse manga with adult content toggles
- `GET /api/manga/top` - Top-rated manga titles
- `GET /api/manga/:id` - Full manga details, chapters, volumes, and authors
- `GET /api/manga/:id/characters` - Characters appearing in manga
- `GET /api/manga/:id/recommendations` - Related manga recommendations

### Characters
- `GET /api/characters/:id` - Detailed character profile with about summary and anime appearances
- `GET /api/characters/:id/pictures` - High-resolution character artwork

### Watchlist
- `GET /api/watchlist` - Fetch user's personal anime watchlist
- `POST /api/watchlist` - Add anime to watchlist
- `PUT /api/watchlist/:id` - Update watched episode progress, status, or personal score
- `DELETE /api/watchlist/:id` - Remove anime from watchlist
- `GET /api/watchlist/stats` - Compute user tracking statistics (total episodes, mean score, distribution)

## 🔒 Security & Performance Features

- **Database-First Caching Engine**: Over 90% of requests served directly from indexed MongoDB collections in < 15ms.
- **Stale-While-Revalidate (SWR)**: High-speed local cache return paired with background revalidation.
- **Auto-Expanding Pagination**: Clean, infinite load-more flow that queries AniList on database exhaustion and persists new records automatically.
- **JWT Authentication with Security Cookies**: Protected user state with bcrypt salted hashing.
- **Enterprise Middleware**: Helmet HTTP security headers, CORS origin protection, and Express Rate Limiting.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Metadata provided by the [AniList GraphQL API](https://graphql.anilist.co)
- UI Icons by [Heroicons](https://heroicons.com)
- Motion design by [Framer Motion](https://www.framer.com/motion)

---

Made with ❤️ for anime and manga fans worldwide
