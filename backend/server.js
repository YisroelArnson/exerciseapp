const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Initialize Firebase
const { initializeFirebase } = require('./firebase/config');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-frontend-domain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// Initialize Firebase before routes
try {
  initializeFirebase();
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  process.exit(1);
}

// Routes
const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);

// Serve test client
app.use('/test-client', helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      "default-src": ["'self'"],
      "base-uri": ["'self'"],
      "font-src": ["'self'", "https:", "data:"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'self'"],
      "img-src": ["'self'", "data:"],
      "object-src": ["'none'"],
      "script-src": ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "http://localhost:3000"],
      "script-src-elem": ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "http://localhost:3000"],
      "script-src-attr": ["'none'"],
      "style-src": ["'self'", "https:", "'unsafe-inline'"],
      "connect-src": [
        "'self'",
        "http://localhost:9099",
        "ws://localhost:9099",
        "http://localhost:3000",
        "https://www.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://identitytoolkit.googleapis.com"
      ]
    }
  }
}));
app.use('/test-client', express.static(path.join(__dirname, 'testing')));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


module.exports = app; 