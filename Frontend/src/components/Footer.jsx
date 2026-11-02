import { Link } from 'react-router-dom';
import {
  HeartIcon,
  ChevronUpIcon,
  TvIcon,
  BookOpenIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { POPULAR_GENRES } from '../constants/genres';

// Clean SVG Icons for Community / Social Links
const DiscordIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const TwitterIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const RedditIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

const GitHubIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const ALPHABET = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const animeLinks = [
    { name: 'Browse Anime Catalog', path: '/browse' },
    { name: 'Top 100 Charts', path: '/anime/top', badge: 'HOT' },
    { name: 'Currently Airing', path: '/browse?status=airing' },
    { name: 'Seasonal Anime Hub', path: '/seasonal' },
    { name: 'Random Anime Pick', path: '/random', badge: 'DICE' },
  ];

  const mangaLinks = [
    { name: 'Browse Manga & Webtoons', path: '/manga' },
    { name: 'Top Ranked Manga', path: '/manga/top', badge: 'POPULAR' },
    { name: 'Publishing Series', path: '/manga?status=publishing' },
    { name: 'Completed Manga', path: '/manga?status=complete' },
  ];

  const discoveryLinks = [
    { name: 'Home Stream Catalog', path: '/home' },
    { name: 'Live Search Engine', path: '/search' },
    { name: 'Community Recommendations', path: '/recommendations' },
    { name: 'My Watchlist & Library', path: '/watchlist' },
    { name: 'User Dashboard & Stats', path: '/dashboard' },
  ];

  const platformLinks = [
    { name: 'About AnimeVerse', path: '/about' },
    { name: 'Contact & Support', path: '/contact' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms of Service', path: '/terms' },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-dark-100 via-[#0B0C18] to-[#06070D] border-t border-white/[0.08] text-gray-300 pt-12 pb-8 mt-24 overflow-hidden">
      {/* Top Ambient Glow Line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none" />
      {/* Ambient Radial Neon Glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* =========================================================================
            1. A-Z ALPHABET DIRECTORY QUICK-BAR
        ========================================================================= */}
        <div className="mb-10 pb-8 border-b border-white/[0.06]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
              <SparklesIcon className="w-4 h-4 text-primary" />
              <span>A-Z Anime Directory</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Instant alphabetical index across our entire streaming catalog
            </p>
          </div>

          <div className="flex flex-wrap gap-1 sm:gap-1.5 items-center">
            {ALPHABET.map((char) => (
              <Link
                key={char}
                to={`/search?q=${encodeURIComponent(char === '#' ? '0' : char)}`}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/[0.04] hover:bg-primary hover:text-white border border-white/5 hover:border-primary/50 flex items-center justify-center text-xs font-semibold text-gray-300 transition-all duration-150 transform hover:scale-105"
                title={`Browse anime starting with ${char}`}
              >
                {char}
              </Link>
            ))}
          </div>
        </div>

        {/* =========================================================================
            2. MAIN 5-COLUMN NAVIGATION GRID
        ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 mb-12">
          {/* Brand & System Status (Span 4) */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img
                src="/Animeverse.png"
                alt="AnimeVerse Logo"
                className="h-9 w-auto transform group-hover:scale-105 group-hover:drop-shadow-[0_0_12px_rgba(255,107,107,0.7)] transition-all duration-300"
              />
              <span className="text-xl font-display font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Anime</span>
                <span className="text-gradient">Verse</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
              </span>
            </Link>

            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Your next-generation anime streaming and manga reading destination. Featuring dual-server redundancy, sub & dub audio, unified progress synchronization, and rich AniList metadata.
            </p>

            {/* Live Server Health Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>MegaPlay & ZokoAnime: Online</span>
            </div>

            {/* Metadata Attribution Badges */}
            <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
              <span className="flex items-center gap-1 bg-white/[0.03] border border-white/5 px-2 py-1 rounded-md">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-primary" />
                <span>AniList GraphQL v2</span>
              </span>
              <span className="flex items-center gap-1 bg-white/[0.03] border border-white/5 px-2 py-1 rounded-md">
                <TvIcon className="w-3.5 h-3.5 text-secondary" />
                <span>Kitsu Open Engine</span>
              </span>
            </div>
          </div>

          {/* Column 2: Anime Catalog (Span 2) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <TvIcon className="w-3.5 h-3.5 text-primary" />
              <span>Anime Stream</span>
            </h3>
            <ul className="space-y-2 text-xs">
              {animeLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-white hover:translate-x-1 inline-flex items-center gap-1.5 transition-all duration-150"
                  >
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-primary/20 text-primary border border-primary/30">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Manga Catalog (Span 2) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <BookOpenIcon className="w-3.5 h-3.5 text-secondary" />
              <span>Manga & Novels</span>
            </h3>
            <ul className="space-y-2 text-xs">
              {mangaLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-white hover:translate-x-1 inline-flex items-center gap-1.5 transition-all duration-150"
                  >
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-secondary/20 text-secondary border border-secondary/30">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Discovery & Library (Span 2) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <SparklesIcon className="w-3.5 h-3.5 text-primary" />
              <span>Discovery</span>
            </h3>
            <ul className="space-y-2 text-xs">
              {discoveryLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-white hover:translate-x-1 inline-flex items-center gap-1.5 transition-all duration-150"
                  >
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Platform & Legal (Span 2) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-gray-300" />
              <span>Platform</span>
            </h3>
            <ul className="space-y-2 text-xs">
              {platformLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-white hover:translate-x-1 inline-flex items-center gap-1.5 transition-all duration-150"
                  >
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* =========================================================================
            3. POPULAR GENRES CHIP STRIP
        ========================================================================= */}
        <div className="mb-8 pt-6 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-gray-300 mr-2">Top Genres:</span>
            {POPULAR_GENRES.slice(0, 12).map((genre) => (
              <Link
                key={genre}
                to={`/browse?genre=${encodeURIComponent(genre)}`}
                className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/10 hover:text-white border border-white/5 text-[11px] text-gray-400 transition-colors"
              >
                {genre}
              </Link>
            ))}
            <Link
              to="/browse"
              className="px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold hover:bg-primary/20 transition-colors"
            >
              All 46 Genres →
            </Link>
          </div>
        </div>

        {/* =========================================================================
            4. DMCA & STREAMING DISCLAIMER BOX
        ========================================================================= */}
        <div className="mb-8 p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-400 leading-relaxed">
          <p>
            <strong className="text-gray-300">Disclaimer: </strong>
            AnimeVerse does not store or host any media files on its servers. All anime streams and manga chapters are provided by non-affiliated third-party providers. AnimeVerse is an index and discovery platform that links to media freely available across the public internet. For legal issues or DMCA inquiries, please contact the respective media hosters.
          </p>
        </div>

        {/* =========================================================================
            5. BOTTOM BAR: COPYRIGHT, COMMUNITY SOCIALS & BACK TO TOP
        ========================================================================= */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 text-center md:text-left">
            <span>© {currentYear} AnimeVerse. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline-flex items-center">
              Made with <HeartIcon className="w-3.5 h-3.5 text-primary mx-1 fill-primary animate-pulse" /> for anime fans worldwide
            </span>
          </div>

          {/* Community Social Icons */}
          <div className="flex items-center gap-2">
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/10 text-gray-400 hover:text-indigo-400 transition-colors border border-white/5"
              aria-label="AnimeVerse Discord"
              title="Join our Discord community"
            >
              <DiscordIcon className="w-4 h-4" />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/10 text-gray-400 hover:text-sky-400 transition-colors border border-white/5"
              aria-label="AnimeVerse X"
              title="Follow on X"
            >
              <TwitterIcon className="w-4 h-4" />
            </a>
            <a
              href="https://reddit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/10 text-gray-400 hover:text-orange-400 transition-colors border border-white/5"
              aria-label="AnimeVerse Reddit"
              title="Join Reddit Community"
            >
              <RedditIcon className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/cross-entropy0/Anime-Verse-ultimate-destination-for-anime-discovery-tracking-"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
              aria-label="AnimeVerse GitHub"
              title="View on GitHub"
            >
              <GitHubIcon className="w-4 h-4" />
            </a>

            {/* Back to Top Button */}
            <button
              type="button"
              onClick={scrollToTop}
              className="p-2 ml-2 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary transition-all duration-200 cursor-pointer group flex items-center gap-1 text-xs font-semibold"
              aria-label="Back to top"
              title="Scroll back to top"
            >
              <ChevronUpIcon className="w-4 h-4 transform group-hover:-translate-y-0.5 transition-transform" />
              <span className="hidden sm:inline">Top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
