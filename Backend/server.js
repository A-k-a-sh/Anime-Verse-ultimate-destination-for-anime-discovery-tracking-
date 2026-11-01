require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const animeRoutes = require('./routes/animeRoutes');
const characterRoutes = require('./routes/characterRoutes');
const mangaRoutes = require('./routes/mangaRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// CORS configuration - Allow all origins in production
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Additional CORS headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Rate limiting - separate limits for different routes
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP (more reasonable)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for auth routes
    return req.path.startsWith('/api/auth/');
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes for login/register
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request timeout middleware - prevent hanging requests
app.use((req, res, next) => {
  // Set a timeout for all requests (20 seconds)
  req.setTimeout(20000, () => {
    console.error(`Request timeout: ${req.method} ${req.path}`)
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request timeout - please try again'
      });
    }
  });
  
  // Set response timeout
  res.setTimeout(20000, () => {
    console.error(`Response timeout: ${req.method} ${req.path}`);
  });
  
  next();
});

// Compression middleware
app.use(compression());

// Request logging (always enabled for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database connection middleware for Serverless
app.use(async (req, res, next) => {
  // Allow health check / to run independently and report connection status
  if (req.path === '/') {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(`Database connection error on ${req.method} ${req.path}:`, error.message);
    return res.status(503).json({
      success: false,
      message: 'Database connection failed. Please verify MONGO_URI in Vercel settings and MongoDB Atlas Network Access (0.0.0.0/0).',
      error: error.message
    });
  }
});

// Health check route
app.get('/', async (req, res) => {
  let dbStatus = 'Disconnected';
  let dbHost = null;
  let dbError = null;

  try {
    const conn = await connectDB();
    dbStatus = 'Connected';
    dbHost = conn?.connection?.host || null;
  } catch (err) {
    dbStatus = 'Connection Failed';
    dbError = err.message;
  }

  res.json({
    success: true,
    message: 'AnimeVerse API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    mongodb: dbStatus,
    mongoHost: dbHost,
    mongoUriConfigured: Boolean(process.env.MONGO_URI),
    mongoUriType: process.env.MONGO_URI
      ? (process.env.MONGO_URI.startsWith('mongodb+srv') ? 'MongoDB Atlas' : 'Local / Direct')
      : 'Missing (Falling back to local default)',
    dbError: dbError,
    endpoints: {
      health: '/',
      auth: '/api/auth',
      anime: '/api/anime',
      characters: '/api/characters',
      manga: '/api/manga',
      watchlist: '/api/watchlist',
      reviews: '/api/reviews',
      comments: '/api/comments'
    },
    sampleEndpoints: {
      topAnime: '/api/anime/top',
      search: '/api/anime/search?q=naruto',
      register: '/api/auth/register (POST)',
      login: '/api/auth/login (POST)'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/manga', mangaRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/comments', commentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server (only in local development or standalone Node, not inside Vercel serverless bundling)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('💤 Process terminated');
    });
  });
}

module.exports = app;
