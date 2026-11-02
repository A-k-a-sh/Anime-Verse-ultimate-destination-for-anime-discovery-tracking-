import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TitleManager from './components/TitleManager';

// Pages (will be created)
import Landing from './pages/Landing';
import Home from './pages/Home';
import Browse from './pages/Browse';
import AnimeDetails from './pages/AnimeDetails';
import Watch from './pages/Watch';
import CharacterDetails from './pages/CharacterDetails';
import MangaBrowse from './pages/MangaBrowse';
import MangaDetails from './pages/MangaDetails';
import TopManga from './pages/TopManga';
import Search from './pages/Search';
import Seasonal from './pages/Seasonal';
import Random from './pages/Random';
import Recommendations from './pages/Recommendations';
import TopAnime from './pages/TopAnime';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Watchlist from './pages/Watchlist';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <TitleManager />
          <div className="min-h-screen bg-dark-100 flex flex-col">
            <Navbar />
            <main className="flex-1 pt-20 sm:pt-24">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/home" element={<Home />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/anime/top" element={<TopAnime />} />
                <Route path="/anime/:id" element={<AnimeDetails />} />
                <Route path="/watch/:id" element={<Watch />} />
                <Route path="/watch/:id/:episode" element={<Watch />} />
                <Route path="/character/:id" element={<CharacterDetails />} />
                <Route path="/manga" element={<MangaBrowse />} />
                <Route path="/manga/top" element={<TopManga />} />
                <Route path="/manga/:id" element={<MangaDetails />} />
                <Route path="/search" element={<Search />} />
                <Route path="/seasonal" element={<Seasonal />} />
                <Route path="/random" element={<Random />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/reviews" element={<Navigate to="/browse" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Footer Pages */}
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />

                {/* Protected Routes */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/watchlist"
                  element={
                    <ProtectedRoute>
                      <Watchlist />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
