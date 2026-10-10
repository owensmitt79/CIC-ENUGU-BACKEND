import { config } from './env.js';

let cloudinaryInstance = null;

if (config.cloudinary.isConfigured) {
  try {
    const { v2: cloudinary } = await import('cloudinary');
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
      secure: true
    });
    cloudinaryInstance = cloudinary;
    console.log('☁️ Cloudinary integration initialized successfully.');
  } catch (err) {
    console.warn('⚠️ Cloudinary SDK could not be initialized:', err.message);
  }
} else {
  console.log('📁 Local disk storage active (Cloudinary credentials not provided in .env).');
}

export const cloudinary = cloudinaryInstance;
export default cloudinary;
