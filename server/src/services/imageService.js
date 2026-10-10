import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';
import { cloudinary } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class ImageService {
  /**
   * Process and persist uploaded file (local disk or Cloudinary)
   * @param {Object} file - Multer file object
   * @param {string} [folder='general']
   * @returns {Promise<string>} Public URL of the uploaded image
   */
  static async processUpload(file, folder = 'general') {
    if (!file) throw new Error('No file provided for upload');

    // Cloudinary path if active
    if (cloudinary) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `cic-alumni/${folder}`,
              format: 'webp',
              transformation: [{ quality: 'auto:good' }]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer || fs.readFileSync(file.path));
        });

        // Clean up temporary local file if multer diskStorage was used
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return result.secure_url;
      } catch (err) {
        console.warn('Cloudinary upload failed, falling back to local file storage:', err.message);
      }
    }

    // Local disk storage fallback
    if (file.filename) {
      return `/uploads/${file.filename}`;
    }

    // If memory buffer, write to disk
    const ext = path.extname(file.originalname) || '.webp';
    const filename = `img-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const destinationPath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(destinationPath, file.buffer);

    return `/uploads/${filename}`;
  }

  /**
   * Process and save a Base64 Data URL (e.g. from browser FileReader)
   * @param {string} base64DataUrl
   * @param {string} [folder='uploads']
   * @returns {Promise<string>} Public URL
   */
  static async processBase64(base64DataUrl, folder = 'uploads') {
    if (!base64DataUrl || typeof base64DataUrl !== 'string') return '';
    if (!base64DataUrl.startsWith('data:image/')) return base64DataUrl; // Return as-is if already an HTTP URL

    if (cloudinary) {
      try {
        const uploadResult = await cloudinary.uploader.upload(base64DataUrl, {
          folder: `cic-alumni/${folder}`,
          format: 'webp',
          transformation: [{ quality: 'auto:good' }]
        });
        return uploadResult.secure_url;
      } catch (err) {
        console.warn('Cloudinary base64 upload failed, writing locally:', err.message);
      }
    }

    // Parse base64
    const matches = base64DataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64DataUrl;
    }

    const ext = matches[1].replace('+xml', '') === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `b64-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  }
}

export default ImageService;
