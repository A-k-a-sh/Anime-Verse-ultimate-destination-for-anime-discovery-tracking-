import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Squares2X2Icon,
  BookmarkIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  FireIcon,
  SparklesIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import SearchAutocomplete from './SearchAutocomplete';

const DiceIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="8" cy="8" r="1.2" fill="currentColor" />
    <circle cx="16" cy="8" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="8" cy="16" r="1.2" fill="currentColor" />
    <circle cx="16" cy="16" r="1.2" fill="currentColor" />
  </svg>
);

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'anime' | 'manga' | null

  const dropdownTimeoutRef = useRef(null);
  const userMenuRef = useRef(null);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll listener for glass elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownEnter = (key) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(key);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const animeMenuItems = [
    {
      name: 'Browse Anime',
      desc: 'Filter 46+ genres, seasons & formats',
      path: '/browse',
      icon: Squares2X2Icon,
    },
    {
      name: 'Top 100 Charts',
      desc: 'All-time highest rated & trending',
      path: '/anime/top',
      icon: FireIcon,
      badge: 'HOT',
    },
    {
      name: 'Seasonal Hub',
      desc: 'Current airing & upcoming seasons',
      path: '/seasonal',
      icon: CalendarDaysIcon,
    },
    {
      name: 'Random Anime',
      desc: "Can't decide? Let fate choose for you",
      path: '/random',
      icon: SparklesIcon,
      badge: 'ROLL',
    },
  ];

  const mangaMenuItems = [
    {
      name: 'Browse Manga',
      desc: 'Read chapters, manhwa & novels',
      path: '/manga',
      icon: BookOpenIcon,
    },
    {
      name: 'Top Manga',
      desc: 'Critically acclaimed & top ranked',
      path: '/manga/top',
      icon: StarIcon,
      badge: 'POPULAR',
    },
  ];

  const userMenuItems = [
    { name: 'Profile', path: '/profile', icon: UserCircleIcon },
    { name: 'Watchlist & History', path: '/watchlist', icon: BookmarkIcon },
    { name: 'Dashboard', path: '/dashboard', icon: Squares2X2Icon },
    { name: 'Settings', path: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <header className="fixed top-2.5 sm:top-3.5 inset-x-0 z-50 px-2.5 sm:px-6 pointer-events-none transition-all duration-300">
      {/* =========================================================================
          OPTION B: FLOATING ISLAND CAPSULE NAVBAR
      ========================================================================= */}
      <div
        className={`pointer-events-auto max-w-7xl mx-auto rounded-2xl md:rounded-full transition-all duration-300 relative border ${
          isScrolled
            ? 'bg-[#0B0C15]/90 backdrop-blur-2xl border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.7)] py-1.5 px-3 sm:px-5'
            : 'bg-[#0B0C15]/75 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.45)] py-2 px-3 sm:px-6'
        }`}
      >
        {/* Subtle Bottom Ambient Gradient Glow */}
        <div className="absolute -bottom-[1px] inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-primary/35 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between h-11 sm:h-12 gap-2 sm:gap-4">
          {/* =====================================================================
              1. BRAND LOGO
          ===================================================================== */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <img
              src="/Animeverse.png"
              alt="AnimeVerse Logo"
              className="h-8 sm:h-9 w-auto transform group-hover:scale-105 group-hover:drop-shadow-[0_0_14px_rgba(255,107,107,0.7)] transition-all duration-300"
            />
            <span className="text-base sm:text-lg font-display font-black tracking-tight text-white hidden sm:flex items-center gap-1.5">
              <span>Anime</span>
              <span className="text-gradient">Verse</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
            </span>
          </Link>

          {/* =====================================================================
              2. DESKTOP NAVIGATION LINKS WITH RICH MEGA DROPDOWNS
          ===================================================================== */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* Home Link */}
            <Link
              to="/home"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                location.pathname === '/home'
                  ? 'bg-white/10 text-white shadow-inner'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </Link>

            {/* Anime Mega Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleDropdownEnter('anime')}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'anime' ? null : 'anime')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all duration-200 cursor-pointer ${
                  location.pathname.startsWith('/anime') || location.pathname === '/browse' || location.pathname === '/seasonal' || location.pathname === '/random'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Anime</span>
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'anime' ? 'rotate-180 text-primary' : 'text-gray-400'
                  }`}
                />
              </button>

              <AnimatePresence>
                {activeDropdown === 'anime' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute left-0 mt-2 w-72 bg-[#0E0F1E]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50"
                  >
                    <div className="px-3 py-1.5 mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-white/5">
                      Anime Hub & Charts
                    </div>
                    <div className="space-y-0.5">
                      {animeMenuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white transition-all group/item"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-white transition-colors shrink-0">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white group-hover/item:text-primary transition-colors">
                                {item.name}
                              </span>
                              {item.badge && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 truncate">{item.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Manga Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleDropdownEnter('manga')}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'manga' ? null : 'manga')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all duration-200 cursor-pointer ${
                  location.pathname.startsWith('/manga')
                    ? 'bg-white/10 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Manga</span>
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'manga' ? 'rotate-180 text-primary' : 'text-gray-400'
                  }`}
                />
              </button>

              <AnimatePresence>
                {activeDropdown === 'manga' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute left-0 mt-2 w-72 bg-[#0E0F1E]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50"
                  >
                    <div className="px-3 py-1.5 mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-white/5">
                      Manga & Webtoons
                    </div>
                    <div className="space-y-0.5">
                      {mangaMenuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white transition-all group/item"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-white transition-colors shrink-0">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white group-hover/item:text-primary transition-colors">
                                {item.name}
                              </span>
                              {item.badge && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 truncate">{item.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Recommendations Link */}
            <Link
              to="/recommendations"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                location.pathname === '/recommendations'
                  ? 'bg-white/10 text-white shadow-inner'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Recs
            </Link>
          </nav>

          {/* =====================================================================
              3. SEARCH AUTOCOMPLETE & RANDOM SHORTCUT
          ===================================================================== */}
          <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm mx-1 sm:mx-3">
            <SearchAutocomplete />
            {/* Quick Random Anime Dice Shortcut */}
            <Link
              to="/random"
              title="Surprise me with a random anime"
              className="p-1.5 ml-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all group shrink-0 relative"
              aria-label="Random Anime"
            >
              <DiceIcon className="w-4 h-4 text-primary group-hover:rotate-45 group-hover:scale-110 transition-all duration-300" />
            </Link>
          </div>

          {/* =====================================================================
              4. AUTHENTICATION & USER PROFILE
          ===================================================================== */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
                  aria-label="User Profile Menu"
                >
                  <div className="relative">
                    <img
                      src={user?.avatar || '/default-avatar.png'}
                      alt={user?.username || 'User'}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-primary/80 object-cover shadow-sm"
                    />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 absolute bottom-0 right-0 border border-dark-100" />
                  </div>
                  <span className="hidden lg:block text-xs font-semibold text-white max-w-[90px] truncate">
                    {user?.username}
                  </span>
                  <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400 hidden lg:block" />
                </button>

                {/* User Dropdown Card */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 w-60 bg-[#0E0F1E]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50"
                    >
                      {/* User Header */}
                      <div className="px-3 py-2.5 mb-1 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                        <img
                          src={user?.avatar || '/default-avatar.png'}
                          alt={user?.username}
                          className="w-9 h-9 rounded-full border border-primary/50 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{user?.username}</p>
                          <span className="inline-block text-[10px] text-primary font-semibold">
                            AnimeVerse Member
                          </span>
                        </div>
                      </div>

                      {/* Menu Links */}
                      <div className="space-y-0.5">
                        {userMenuItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <item.icon className="w-4 h-4 text-gray-400" />
                            <span>{item.name}</span>
                          </Link>
                        ))}
                      </div>

                      <div className="pt-1 mt-1 border-t border-white/5">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-gray-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 sm:px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_0_15px_rgba(255,107,107,0.4)] hover:shadow-[0_0_25px_rgba(255,107,107,0.6)] transform hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-5 h-5 text-white" />
              ) : (
                <Bars3Icon className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* =====================================================================
            5. MOBILE NAVIGATION DRAWER SHEET
        ===================================================================== */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="md:hidden overflow-hidden pt-3 border-t border-white/10 mt-2"
            >
              <div className="space-y-3 pb-2">
                {/* Mobile Search */}
                <SearchAutocomplete isMobile onSelect={() => setIsMobileMenuOpen(false)} />

                {/* Mobile Nav Links */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to="/home"
                    className="p-2.5 rounded-xl bg-white/5 text-center text-xs font-bold text-white hover:bg-white/10 transition-colors"
                  >
                    Home Feed
                  </Link>
                  <Link
                    to="/random"
                    className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-center text-xs font-bold text-primary flex items-center justify-center gap-1.5 hover:bg-primary/20 transition-colors"
                  >
                    <DiceIcon className="w-3.5 h-3.5" />
                    <span>Random Pick</span>
                  </Link>
                </div>

                {/* Anime Section */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">
                    Anime Catalog
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {animeMenuItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white/5 text-gray-300 hover:text-white text-xs font-medium"
                      >
                        <item.icon className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Manga Section */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">
                    Manga & Webtoons
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {mangaMenuItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white/5 text-gray-300 hover:text-white text-xs font-medium"
                      >
                        <item.icon className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <Link
                  to="/recommendations"
                  className="block p-2 rounded-xl bg-white/5 text-center text-xs font-medium text-gray-200 hover:bg-white/10"
                >
                  Recommendations
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Navbar;
