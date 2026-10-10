import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Production Security Validation: Prevent running with default or insecure secrets
const DEFAULT_PLACEHOLDER_JWT = 'cic-enugu-1995-super-secret-jwt-key-2026-production';
const rawJwtSecret = process.env.JWT_SECRET || DEFAULT_PLACEHOLDER_JWT;

if (isProduction && (rawJwtSecret === DEFAULT_PLACEHOLDER_JWT || rawJwtSecret.length < 32)) {
  console.warn('\n⚠️ [SECURITY WARNING] You are running in PRODUCTION with a default or weak JWT_SECRET.');
  console.warn('⚠️ Please generate a secure random secret (min 32 characters) in your production .env file.\n');
}

const isSecureCookie = process.env.COOKIE_SECURE !== undefined
  ? process.env.COOKIE_SECURE === 'true'
  : isProduction;

export const config = {
  port: parseInt(process.env.PORT, 10) || 5050,
  nodeEnv,
  apiPrefix: process.env.API_PREFIX || '/api',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  
  jwt: {
    secret: rawJwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  cookie: {
    secret: process.env.COOKIE_SECRET || 'cic-enugu-cookie-secret-key-1995',
    secure: isSecureCookie,
    sameSite: isProduction && isSecureCookie ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  },

  cors: {
    origins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500,http://localhost:8080,http://127.0.0.1:8080,http://localhost:5050')
      .split(',')
      .map(origin => origin.trim())
  },

  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || '',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    baseUrl: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co'
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    isConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  }
};

export default config;
