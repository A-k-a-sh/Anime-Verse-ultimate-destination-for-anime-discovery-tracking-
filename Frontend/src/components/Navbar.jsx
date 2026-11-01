import { useState, useEffect } from 'react';
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
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import SearchAutocomplete from './SearchAutocomplete';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAnimeMenuOpen, setIsAnimeMenuOpen] = useState(false);
  const [isMangaMenuOpen, setIsMangaMenuOpen] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/home' },
    { 
      name: 'Anime', 
      hasDropdown: true,
      dropdownKey: 'anime',
      items: [
        { name: 'Browse Anime', path: '/browse' },
        { name: 'Top Anime', path: '/anime/top' },
        { name: 'Seasonal', path: '/seasonal' },
        { name: 'Random', path: '/random' },
      ]
    },
    { 
      name: 'Manga', 
      hasDropdown: true,
      dropdownKey: 'manga',
      items: [
        { name: 'Browse Manga', path: '/manga' },
        { name: 'Top Manga', path: '/manga/top' },
      ]
    },
    { name: 'Recommendations', path: '/recommendations' },
  ];

  const userMenuItems = [
    { name: 'Profile', path: '/profile', icon: UserCircleIcon },
    { name: 'Watchlist', path: '/watchlist', icon: BookmarkIcon },
    { name: 'Dashboard', path: '/dashboard', icon: Squares2X2Icon },
    { name: 'Settings', path: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-dark-200/95 backdrop-blur-lg shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img 
              src="/Animeverse.png" 
              alt="AnimeVerse Logo" 
              className="h-10 w-auto transform group-hover:scale-110 transition-transform duration-200"
            />
            <span className="text-xl font-display font-bold text-white hidden sm:block">
              Anime<span className="text-gradient">Verse</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              if (link.hasDropdown) {
                const isOpen = link.dropdownKey === 'anime' ? isAnimeMenuOpen : isMangaMenuOpen;
                const setIsOpen = link.dropdownKey === 'anime' ? setIsAnimeMenuOpen : setIsMangaMenuOpen;
                
                return (
                  <div key={link.name} className="relative"
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                  >
                    <button
                      className="text-sm font-medium transition-colors duration-200 hover:text-primary text-gray-300 flex items-center gap-1"
                    >
                      {link.name}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute left-0 mt-2 w-48 bg-dark-300 border border-dark-400 rounded-lg shadow-xl overflow-hidden"
                        >
                          {link.items.map((item) => (
                            <Link
                              key={item.path}
                              to={item.path}
                              className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-dark-400 hover:text-white transition-colors duration-150"
                            >
                              {item.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors duration-200 hover:text-primary ${
                    location.pathname === link.path
                      ? 'text-primary'
                      : 'text-gray-300'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Search Bar with Live Autocomplete */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <SearchAutocomplete />
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <img
                    src={user?.avatar || '/default-avatar.png'}
                    alt={user?.username}
                    className="w-8 h-8 rounded-full border-2 border-primary hover:scale-110 transition-transform duration-200"
                  />
                  <span className="hidden md:block text-sm font-medium text-white">
                    {user?.username}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-dark-300 border border-dark-400 rounded-lg shadow-xl overflow-hidden"
                    >
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-dark-400 hover:text-white transition-colors duration-150"
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </Link>
                      ))}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-accent-red hover:bg-dark-400 transition-colors duration-150"
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-secondary rounded-full hover:shadow-glow-md transform hover:scale-105 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-300 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-dark-300 border-t border-dark-400"
          >
            <div className="px-4 py-4 space-y-3">
              {/* Mobile Search with Live Autocomplete */}
              <div className="relative">
                <SearchAutocomplete isMobile onSelect={() => setIsMobileMenuOpen(false)} />
              </div>

              {/* Mobile Nav Links */}
              {navLinks.map((link) => {
                if (link.hasDropdown) {
                  return (
                    <div key={link.name} className="space-y-1">
                      <div className="px-4 py-2 text-sm font-semibold text-gray-400">
                        {link.name}
                      </div>
                      {link.items.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`block px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            location.pathname === item.path
                              ? 'bg-primary/20 text-primary'
                              : 'text-gray-300 hover:bg-dark-400 hover:text-white'
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  );
                }
                
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      location.pathname === link.path
                        ? 'bg-primary/20 text-primary'
                        : 'text-gray-300 hover:bg-dark-400 hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

              {/* Mobile Auth Buttons */}
              {!isAuthenticated && (
                <div className="pt-3 border-t border-dark-400 space-y-2">
                  <Link
                    to="/login"
                    className="block w-full text-center px-4 py-2 text-sm font-medium text-gray-300 bg-dark-400 rounded-lg hover:bg-dark-500 transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full text-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-secondary rounded-lg hover:shadow-glow-md transition-all duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
