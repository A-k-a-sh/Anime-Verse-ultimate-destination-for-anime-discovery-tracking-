import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Automatically scrolls the browser window to the top (0, 0) smoothly
 * whenever the route or search query changes.
 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Smoothly scroll to top of document on route navigation
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;

