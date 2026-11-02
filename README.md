# AnimeVerse 🎌

Your ultimate destination for anime discovery, streaming, tracking, and manga reading.

![AnimeVerse](./Frontend/public/Animeverse.png)

## 🌟 Key Features

- **Floating Island Capsule Navbar**: Futuristic pill-shaped navigation with dynamic frosted glassmorphism (`backdrop-blur-2xl`), rich mega-card dropdowns with icons & descriptions, global `⌘K` / `Ctrl+K` keyboard shortcut live search autocomplete, quick Random Anime dice shortcut, and authenticated user profile card.
- **Cinematic Multi-Scene Hero & Parallax Showcase (`/`)**: 4 curated 4K Sakuga video loops (Demon Slayer, Jujutsu Kaisen, Frieren, Attack on Titan) with synchronized high-visibility poster fallbacks, decoupled timer progress (React 19 StrictMode safe), live UI mockups, and deep anime background scenery with multi-speed parallax scrolling (`useScroll` / `useTransform`).
- **Dedicated Stream Catalog Hub (`/home`)**: Split routing architecture separating the cinematic landing page from the stream catalog feed. Features smooth Ken-Burns crossfading Spotlight carousel (`AnimatePresence initial={false}`), strict synopsis truncation and HTML sanitization, interactive tabs (Airing / Trending / Top Rated), Continue Watching shelf with 1-click resume, and Trending Manga rail.
- **Native In-Platform Manga Reader (`/read/:id/:chapter`)**: Distraction-free, ad-free reader with 3 viewing modes: **Webtoon (Continuous Vertical Strip)**, **Single Page Flip**, and authentic **Double Page Spread (Japanese RTL tankōbon)**. Includes auto-hiding top & bottom HUDs, an interactive page scrubber slider, full keyboard shortcuts (`←`/`→`, `[`/`]`, `F`, `M`, `Esc`), reading direction switcher, canvas themes (Pure Black, Dark Gray, Sepia), and image fit options (Fit Width, Fit Height, Original).
- **Multi-Source Manga Content Engine & Zero-Storage Proxy**: High-resilience waterfall sourcing (MangaDex official REST API $\rightarrow$ MangaPill Scraper fallback $\rightarrow$ zero-storage Express streaming proxy). Injects required `Referer` headers to bypass third-party CDN hotlink protection with 0 bytes saved on disk/DB and a 7-day browser cache. Features a 15-slot backend concurrency queue and frontend viewport lazy-loading (`IntersectionObserver`) with auto-retry to prevent upstream CDN rate limits on rapid scrolling.
- **Interactive Manga Chapter Selector & Deliberate Tracking**: 50-chapter range pagination tabs (`1-50`, `51-100`, etc.), real-time chapter search across all chapters, sort toggle (`1 → Latest` / `Latest → 1`), read status checkmark badges `✓`, dynamic "Read Chapter 1" / "Continue Reading Ch X" CTAs, "Resume Ch X" Watchlist buttons, and a "Continue Reading" shelf on the home feed. Strictly adheres to deliberate user choice (exploring chapters updates reading history without auto-adding to Watchlist).
- **Embedded Dual-Server Video Player**: Stream anime episodes directly on site with dual-server redundancy (Server 1: MegaPlay, Server 2: ZokoAnime with custom purple theme and Auto-Skip), Sub/Dub/HSub tracks, failover recovery, and collapsible 18+ adult streaming warning notice.
- **Theater & Lights-Off (Cinema) Modes**: YouTube-style wide theater mode (82vh) and viewport-wide cinema dimming (`z-[60]`) with custom keyboard shortcuts (`N`, `P`, `S`, `T`, `L`, `F`, `Esc`).
- **Comprehensive 46-Genre Taxonomy & Collapsible Filter**: Complete AniList & MyAnimeList unified genre taxonomy (46 canonical genres) with a clean collapsible filter component (`CollapsibleGenreFilter`), showing 12 popular genres upfront with one-click full catalog expansion and auto-expansion on niche genres across Browse Anime and Browse Manga.
- **Two-Tier Dynamic Tab Title & SEO Management**: Custom native React 19 `useDocumentTitle` hook paired with global `TitleManager` route listener. Automatically formats browser tab titles: `${Anime} - Episode ${Ep} • AnimeVerse` (Watch), `Top Anime of All Time • AnimeVerse` (Top Charts), `${Season} ${Year} Seasonal Anime • AnimeVerse` (Seasonal Hub), catalog browse titles, and search queries.
- **Interactive Episode Selector**: 50-episode range pagination, search filter, Grid vs List view toggling, and real episode title resolution (AniList & Kitsu mapping fallback).
- **Database-First High Performance**: Instantaneous response times (< 15ms) powered by local MongoDB caching and automated write-through fallback to AniList.
- **Unified Progress Tracking & Dynamic CTAs**: Synchronized episode tracking across `localStorage` and MongoDB Watchlist, with dynamic "Watch Episode 1" / "Continue Watching Ep X" CTAs on Anime Details, Hero, and Home.
- **Personalized Recommendations**: Contextual anime and manga recommendations with smooth horizontal snap-scroll rails.
- **Top & Seasonal Airing**: Explore all-time top-rated anime, current seasonal releases, and historical seasonal archives.
- **Character & Staff Database**: In-depth character profiles with Japanese voice actors and full production staff.
- **Auto-Expanding Pagination**: Seamless infinite browsing that dynamically fetches and caches new pages from AniList when database pages are exhausted.
- **Responsive Dark UI**: Modern dark-mode user interface optimized for desktop, tablet, and mobile devices.

## 🚀 Tech Stack

### Frontend
- **React 19** (`^19.2.0`) - Modern React UI component library with concurrent features
- **Vite 7** (`^7.2.4`) - High-performance next-generation frontend build tool (< 2.5s production bundling)
- **Tailwind CSS 3** (`^3.4.17`) - Utility-first styling with custom dark theme, glassmorphic blur, and neon glow presets
- **Framer Motion 12** (`^12.23.24`) - Smooth layout transitions, Ken-Burns carousel crossfades, and parallax scroll transforms
- **React Router 7** (`^7.9.6`) - Client-side single page application routing with split landing/home routes
- **Heroicons 2** (`^2.2.0`) - Clean, modern SVG iconography
- **Axios 1** (`^1.13.2`) - HTTP client with request deduplication and in-memory caching

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
- **MangaDex REST API (`api.mangadex.org`)** - Primary manga chapter and page metadata provider with distributed MangaDex@Home CDN direct delivery
- **MangaPill Scraper (`mangapill.com`)** - Secondary fallback content scraper ensuring comprehensive coverage on licensed Shonen Jump & mainstream manga titles

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
- `npm run build` - Build optimized production assets in `dist/` (< 2.5s)
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
- `GET /api/anime/seasonal/:year/:season` - Seasonal anime releases (e.g. `2026/winter`)
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
- `GET /api/manga/:id/chapters` - Multi-source chapter index with 24h MongoDB caching
- `GET /api/manga/:id/chapter/:chapterNumber` - Chapter pages and prev/next metadata with 7-day TTL caching
- `GET /api/manga/proxy-image` - Zero-storage streaming proxy for protected manga CDN images (rate-exempt)

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
- **Zero-Storage Manga Streaming Proxy**: Bypasses third-party hotlink protection on demand via Node.js stream piping (`Readable.fromWeb().pipe(res)`), saving 0 bytes to server disk/DB with 7-day browser caching.
- **Viewport-Only Lazy Loading & Concurrency Queue**: Front-end `IntersectionObserver` with a 600px buffer and a 15-slot backend concurrency queue prevents upstream CDN 429 burst rate limits during rapid scrolling.
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
