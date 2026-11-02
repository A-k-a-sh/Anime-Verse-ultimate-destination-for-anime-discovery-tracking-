import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const STATIC_ROUTE_TITLES = {
  '/': 'AnimeVerse — Watch Anime & Read Manga Free',
  '/home': 'Home Feed • AnimeVerse',
  '/browse': 'Browse Anime Catalog • AnimeVerse',
  '/anime/top': 'Top Anime of All Time • AnimeVerse',
  '/seasonal': 'Seasonal Anime • AnimeVerse',
  '/random': 'Random Anime Discovery • AnimeVerse',
  '/recommendations': 'Anime Recommendations • AnimeVerse',
  '/manga': 'Browse Manga & Webtoons • AnimeVerse',
  '/manga/top': 'Top Manga of All Time • AnimeVerse',
  '/search': 'Search Anime & Manga • AnimeVerse',
  '/watchlist': 'My Watchlist & Library • AnimeVerse',
  '/dashboard': 'My Dashboard • AnimeVerse',
  '/profile': 'My Profile • AnimeVerse',
  '/settings': 'Account Settings • AnimeVerse',
  '/login': 'Sign In • AnimeVerse',
  '/register': 'Create Account • AnimeVerse',
  '/about': 'About Us • AnimeVerse',
  '/contact': 'Contact Us • AnimeVerse',
  '/privacy': 'Privacy Policy • AnimeVerse',
  '/terms': 'Terms of Service • AnimeVerse',
};

/**
 * Global component placed inside <Router> to set default/fallback titles on route navigation
 */
const TitleManager = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    if (STATIC_ROUTE_TITLES[path]) {
      document.title = STATIC_ROUTE_TITLES[path];
    } else if (path.startsWith('/watch/')) {
      document.title = 'Watch Anime • AnimeVerse';
    } else if (path.startsWith('/read/')) {
      document.title = 'Read Manga • AnimeVerse';
    } else if (path.startsWith('/anime/')) {
      document.title = 'Anime Details • AnimeVerse';
    } else if (path.startsWith('/manga/')) {
      document.title = 'Manga Details • AnimeVerse';
    } else if (path.startsWith('/character/')) {
      document.title = 'Character Profile • AnimeVerse';
    }
  }, [location.pathname]);

  return null;
};

export default TitleManager;
