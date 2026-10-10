import crypto from 'crypto';
import QRCode from 'qrcode';
import { config } from '../config/env.js';

export class ReceiptService {
  /**
   * Generate a unique transaction reference formatted as HAA-YYYY-XXXXX
   * @param {number} [year]
   * @returns {string}
   */
  static generateReference(year = new Date().getFullYear()) {
    const randomFiveDigit = Math.floor(10000 + Math.random() * 90000);
    return `HAA-${year}-${randomFiveDigit}`;
  }

  /**
   * Generate an official receipt serial formatted as REC-YYYY-XXXX
   * @param {number} [year]
   * @returns {string}
   */
  static generateReceiptNumber(year = new Date().getFullYear()) {
    const randomFourDigit = Math.floor(1000 + Math.random() * 9000);
    return `REC-${year}-${randomFourDigit}`;
  }

  /**
   * Generate a High-Density QR code Data URL encoding public verification link
   * @param {string} reference
   * @param {string} [baseUrl]
   * @returns {Promise<string>}
   */
  static async generateVerificationQr(reference, baseUrl = '') {
    try {
      const verifyUrl = baseUrl 
        ? `${baseUrl.replace(/\/$/, '')}/verify.html?ref=${encodeURIComponent(reference)}`
        : `https://cicalumni1995.org/verify.html?ref=${encodeURIComponent(reference)}`;

      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        color: {
          dark: '#0B1320', // Navy-950 brand color
          light: '#FFFFFF'
        },
        width: 250
      });

      return qrDataUrl;
    } catch (error) {
      console.error('Failed to generate verification QR code:', error);
      return '';
    }
  }

  /**
   * Generate cryptographic HMAC signature for receipt anti-tampering
   * @param {Object} payment
   * @returns {string}
   */
  static generateSecurityHash(payment) {
    const payload = `${payment.reference}|${payment.receiptNumber}|${payment.amount}|${payment.email}|${payment.date}`;
    return crypto
      .createHmac('sha256', config.jwt.secret)
      .update(payload)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Format payment date string standard "YYYY-MM-DD HH:mm:ss"
   * @param {Date} [d]
   * @returns {string}
   */
  static formatDate(d = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}

export default ReceiptService;
