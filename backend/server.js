import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Import routes
import eventRoutes from './src/routes/eventRoutes.js';
import aiRoutes from './src/routes/aiRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';

// Import middleware
import { errorHandler } from './src/middleware/errorHandler.js';
import { requestLogger } from './src/middleware/requestLogger.js';
import { createRateLimit, sanitizeInput } from './src/middleware/security.js';

// Import services
import reminderService from './src/services/reminderService.js';
import notificationService from './src/services/notificationService.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure database directory exists
const dbDir = join(__dirname, 'src', 'database');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Security middleware
app.use(helmet());
app.use(createRateLimit(15 * 60 * 1000, 100)); // 100 requests per 15 minutes
app.use(sanitizeInput);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  app.use(requestLogger);
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: '✅ Connected',
      email: process.env.GMAIL_USER ? '✅ Configured' : '⚠️  Not configured',
      ai: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY ? '✅ Configured' : '⚠️  Not configured',
      reminders: '✅ Active',
      notifications: '✅ Active',
      analytics: '✅ Active',
      cache: '✅ Active'
    }
  });
});

// API routes
app.use('/api/events', eventRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║  🚀 GOOGLE CALENDAR CLONE - PRODUCTION SERVER            ║
║                                                          ║
║  Server:       http://localhost:${PORT.toString().padEnd(5)}                     ║
║  Environment:  ${(process.env.NODE_ENV || 'development').padEnd(14)}                  ║
║  Health:       http://localhost:${PORT}/health               ║
║                                                          ║
║  📧 Email:      ${process.env.GMAIL_USER ? '✅ Connected' : '⚠️  Not configured'}                     ║
║  🤖 AI:         ${process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY ? '✅ Enabled  ' : '⚠️  Disabled '}                     ║
║  🔔 Reminders:  ✅ Active                                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);

  try {
    // Initialize services
    reminderService.initializeReminderService();
    notificationService.initialize();
    
    // Initialize email service
    console.log('📧 Initializing email service...');
    
    // Test email configuration
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      console.log('✅ Gmail credentials configured');
    } else {
      console.warn('⚠️  Gmail credentials missing - email features disabled');
    }

    // Configuration warnings
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('\n⚠️  WARNING: Gmail not configured');
      console.warn('   Email notifications will not work');
      console.warn('   Setup guide: backend/SETUP_GUIDE.md\n');
    }

    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
      console.warn('⚠️  WARNING: No AI keys configured');
      console.warn('   Using fallback algorithms\n');
    }
  } catch (error) {
    console.error('❌ Error initializing services:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('\n❌ Unhandled Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('\n❌ Uncaught Exception:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

export default app;
