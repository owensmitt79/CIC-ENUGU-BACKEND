import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { config } from './config/env.js';
import { prisma } from './config/db.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const app = express();

// 1. Trust proxy when running behind reverse proxies (Nginx, Render, Railway, etc.)
app.set('trust proxy', 1);

// 2. Security HTTP Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false
  })
);

// 3. CORS Configuration (Supports HttpOnly cookies & credentials)
const allowedOrigins = config.cors.origins;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, or local file://)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some(allowed => 
        origin === allowed || 
        origin.endsWith('.localhost') || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1')
      );

      if (isAllowed || config.nodeEnv === 'development') {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not permitted by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-paystack-signature']
  })
);

// 4. Request Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
}

// 5. Rate Limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});
app.use(config.apiPrefix, apiLimiter);

// 6. Body Parsers & Cookie Parser
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser(config.cookie.secret));

// 7. Static File Serving for Uploaded Assets
app.use('/uploads', express.static(UPLOAD_DIR));

// 8. Serve Frontend Static Assets if available
const frontendCandidates = [
  path.resolve(__dirname, '../../../Eng ilo'),
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, '../../public')
];

for (const candidate of frontendCandidates) {
  if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))) {
    app.use(express.static(candidate));
    console.log(`🌐 Serving frontend assets from: ${candidate}`);
    break;
  }
}

// 9. Root & Health Check Endpoints
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'degraded',
      database: 'disconnected',
      error: error.message
    });
  }
});

// 10. Mount REST API Routes
app.use(config.apiPrefix, apiRoutes);

// 11. 404 Handler for Unknown Routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// 12. Centralized Error Handler Middleware
app.use(errorHandler);

// 13. Server Launch
const PORT = config.port;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, async () => {
  try {
    await prisma.$connect();
    console.log(`\n========================================================`);
    console.log(`🚀 CIC ENUGU 1995 ALUMNI PORTAL BACKEND RUNNING`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🔌 API Prefix: http://localhost:${PORT}${config.apiPrefix}`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    console.log(`🗄️  Database: Connected (${config.databaseUrl})`);
    console.log(`========================================================\n`);
  } catch (dbErr) {
    console.error('❌ Database connection error on startup:', dbErr.message);
  }
});

// 14. Graceful Shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('✅ Database disconnected. Server shut down cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during database disconnect:', err);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
