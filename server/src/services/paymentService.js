import crypto from 'crypto';
import { config } from '../config/env.js';

export class PaymentService {
  /**
   * Initialize Paystack transaction checkout
   * @param {Object} params
   * @param {string} params.email
   * @param {number} params.amountInNaira
   * @param {string} params.reference
   * @param {string} [params.callbackUrl]
   * @param {Object} [params.metadata]
   * @returns {Promise<Object>}
   */
  static async initializePaystack({ email, amountInNaira, reference, callbackUrl, metadata = {} }) {
    const isMock = !config.paystack.secretKey || config.paystack.secretKey.includes('placeholder');

    if (isMock) {
      return {
        success: true,
        isMock: true,
        authorization_url: `https://checkout.paystack.com/mock-${reference}`,
        access_code: `mock_code_${reference}`,
        reference
      };
    }

    try {
      const response = await fetch(`${config.paystack.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.paystack.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amountInNaira * 100), // convert Naira to Kobo
          reference,
          callback_url: callbackUrl,
          metadata
        })
      });

      const data = await response.json();
      if (!response.ok || !data.status) {
        throw new Error(data.message || 'Paystack initialization failed');
      }

      return {
        success: true,
        isMock: false,
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference
      };
    } catch (error) {
      console.error('Paystack initialize error:', error);
      throw error;
    }
  }

  /**
   * Verify Paystack transaction by reference
   * @param {string} reference
   * @returns {Promise<Object>}
   */
  static async verifyPaystack(reference) {
    const isMock = !config.paystack.secretKey || config.paystack.secretKey.includes('placeholder');

    if (isMock) {
      return {
        success: true,
        isMock: true,
        status: 'success',
        amount: 5000,
        paid_at: new Date().toISOString(),
        channel: 'card',
        gateway_response: 'Successful mock transaction'
      };
    }

    try {
      const response = await fetch(`${config.paystack.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.paystack.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok || !data.status) {
        throw new Error(data.message || 'Transaction verification failed');
      }

      return {
        success: true,
        isMock: false,
        status: data.data.status,
        amount: data.data.amount / 100, // back to Naira
        paid_at: data.data.paid_at,
        channel: data.data.channel,
        gateway_response: data.data.gateway_response,
        customer: data.data.customer
      };
    } catch (error) {
      console.error('Paystack verification error:', error);
      throw error;
    }
  }

  /**
   * Validate Paystack Webhook HMAC SHA512 Signature
   * @param {string} signature - x-paystack-signature header
   * @param {string|Buffer} rawBody
   * @returns {boolean}
   */
  static verifyWebhookSignature(signature, rawBody) {
    if (!config.paystack.secretKey || !signature) return false;
    const hash = crypto
      .createHmac('sha512', config.paystack.secretKey)
      .update(rawBody)
      .digest('hex');
    return hash === signature;
  }
}

export default PaymentService;
