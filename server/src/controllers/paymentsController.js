import { prisma } from '../config/db.js';
import { ReceiptService } from '../services/receiptService.js';
import { PaymentService } from '../services/paymentService.js';
import { ReportService } from '../services/reportService.js';

export class PaymentsController {
  /**
   * Initialize a Zero-Login Payment Checkout (Paystack / Online)
   * POST /api/payments/initialize
   */
  static async initializePayment(req, res, next) {
    try {
      const {
        name,
        email,
        phone,
        paymentType,
        categoryId,
        selectedMonths,
        amount,
        gateway = 'Paystack',
        channel = 'Debit Card',
        itemDescription,
        projectId,
        callbackUrl
      } = req.body;

      if (!name || !email || !amount || Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Full name, email address, and a positive amount are required'
        });
      }

      const numAmount = Number(amount);
      const reference = ReceiptService.generateReference();
      const receiptNumber = ReceiptService.generateReceiptNumber();
      const formattedDate = ReceiptService.formatDate();
      const timestamp = BigInt(Date.now());

      // Prepare months array or string
      let monthsStr = '';
      if (Array.isArray(selectedMonths)) {
        monthsStr = JSON.stringify(selectedMonths);
      } else if (typeof selectedMonths === 'string') {
        monthsStr = selectedMonths;
      }

      // Generate Verification QR Code
      const qrCode = await ReceiptService.generateVerificationQr(reference, `${req.protocol}://${req.get('host')}`);

      // Call Paystack initialization
      const paystackResult = await PaymentService.initializePaystack({
        email: email.trim().toLowerCase(),
        amountInNaira: numAmount,
        reference,
        callbackUrl,
        metadata: {
          name,
          phone,
          paymentType,
          receiptNumber,
          selectedMonths: monthsStr,
          projectId
        }
      });

      // Save payment record in DB
      const isSimulatedTest = paystackResult.isMock;
      const status = isSimulatedTest ? 'Successful' : 'Pending';

      const payment = await prisma.payment.create({
        data: {
          reference,
          receiptNumber,
          name: name.trim(),
          phone: phone ? phone.trim() : '',
          email: email.trim().toLowerCase(),
          paymentType: paymentType || 'Monthly Dues',
          categoryId: categoryId || null,
          selectedMonths: monthsStr,
          amount: numAmount,
          gateway,
          channel,
          status,
          date: formattedDate,
          timestamp,
          itemDescription: itemDescription || `${paymentType || 'Payment'} - ${name}`,
          recordedBy: 'Self Checkout',
          receiptQrCode: qrCode,
          verifiedAt: isSimulatedTest ? new Date() : null
        }
      });

      // If simulated successful and tied to a project, update project raised amount
      if (isSimulatedTest && projectId) {
        try {
          await prisma.project.update({
            where: { id: projectId },
            data: {
              raisedAmount: { increment: numAmount },
              donorCount: { increment: 1 }
            }
          });
        } catch (_) {}
      }

      return res.status(200).json({
        success: true,
        reference,
        receiptNumber,
        authorization_url: paystackResult.authorization_url,
        access_code: paystackResult.access_code,
        payment: {
          ...payment,
          timestamp: Number(payment.timestamp),
          securityHash: ReceiptService.generateSecurityHash(payment)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify and confirm payment by reference
   * POST /api/payments/verify/:reference
   */
  static async verifyPayment(req, res, next) {
    try {
      const { reference } = req.params;
      const cleanRef = reference.trim().toUpperCase();

      let payment = await prisma.payment.findUnique({
        where: { reference: cleanRef }
      });

      if (!payment) {
        // Also check if lookup by receipt number
        payment = await prisma.payment.findUnique({
          where: { receiptNumber: cleanRef }
        });
      }

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Payment record not found for this reference'
        });
      }

      if (payment.status !== 'Successful') {
        const verifyResult = await PaymentService.verifyPaystack(payment.reference);
        if (verifyResult.status === 'success' || verifyResult.isMock) {
          payment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'Successful',
              verifiedAt: new Date()
            }
          });
        }
      }

      return res.status(200).json({
        success: true,
        verified: payment.status === 'Successful',
        payment: {
          ...payment,
          timestamp: Number(payment.timestamp),
          securityHash: ReceiptService.generateSecurityHash(payment)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Secretariat Manual Receipt Issuance (Offline Cash / Bank Wire / POS)
   * POST /api/payments/manual
   */
  static async recordManualPayment(req, res, next) {
    try {
      const {
        name,
        email,
        phone,
        paymentType,
        categoryId,
        selectedMonths,
        amount,
        channel = 'Bank Transfer',
        notes,
        projectId
      } = req.body;

      if (!name || !amount || Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Payer name and valid amount are required'
        });
      }

      const numAmount = Number(amount);
      const reference = ReceiptService.generateReference();
      const receiptNumber = ReceiptService.generateReceiptNumber();
      const formattedDate = ReceiptService.formatDate();
      const timestamp = BigInt(Date.now());

      let monthsStr = '';
      if (Array.isArray(selectedMonths)) {
        monthsStr = JSON.stringify(selectedMonths);
      } else if (typeof selectedMonths === 'string') {
        monthsStr = selectedMonths;
      }

      const qrCode = await ReceiptService.generateVerificationQr(reference, `${req.protocol}://${req.get('host')}`);
      const adminIdentity = req.user ? `${req.user.name} (${req.user.email})` : 'Secretariat Officer';

      const payment = await prisma.payment.create({
        data: {
          reference,
          receiptNumber,
          name: name.trim(),
          phone: phone ? phone.trim() : '',
          email: email ? email.trim().toLowerCase() : 'secretariat@cicalumni1995.org',
          paymentType: paymentType || 'Manual Offline Receipt',
          categoryId: categoryId || null,
          selectedMonths: monthsStr,
          amount: numAmount,
          gateway: 'Manual / Offline',
          channel: channel || 'Bank Transfer',
          status: 'Successful',
          date: formattedDate,
          timestamp,
          itemDescription: notes || `Manual Receipt issued for ${name}`,
          notes: notes || '',
          recordedBy: adminIdentity,
          receiptQrCode: qrCode,
          verifiedAt: new Date()
        }
      });

      // Update project raised amount if allocated to a project
      if (projectId) {
        try {
          await prisma.project.update({
            where: { id: projectId },
            data: {
              raisedAmount: { increment: numAmount },
              donorCount: { increment: 1 }
            }
          });
        } catch (_) {}
      }

      return res.status(201).json({
        success: true,
        message: 'Official manual receipt issued successfully',
        payment: {
          ...payment,
          timestamp: Number(payment.timestamp),
          securityHash: ReceiptService.generateSecurityHash(payment)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public Zero-Login Verification Engine
   * GET /api/payments/verify-lookup/:refOrReceipt
   */
  static async lookupVerification(req, res, next) {
    try {
      const { refOrReceipt } = req.params;
      if (!refOrReceipt) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Payment reference or receipt number is required'
        });
      }

      const query = refOrReceipt.trim().toUpperCase();

      const payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { reference: query },
            { receiptNumber: query }
          ]
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          verified: false,
          error: 'NotFound',
          message: `No authentic transaction or receipt record found matching '${refOrReceipt}'`
        });
      }

      let parsedMonths = [];
      if (payment.selectedMonths) {
        try {
          parsedMonths = JSON.parse(payment.selectedMonths);
        } catch (_) {
          parsedMonths = payment.selectedMonths.split(',').map((s) => s.trim());
        }
      }

      const securityHash = ReceiptService.generateSecurityHash(payment);

      return res.status(200).json({
        success: true,
        verified: payment.status === 'Successful',
        data: {
          reference: payment.reference,
          receiptNumber: payment.receiptNumber,
          name: payment.name,
          email: payment.email,
          phone: payment.phone,
          paymentType: payment.paymentType,
          selectedMonths: parsedMonths,
          amount: payment.amount,
          gateway: payment.gateway,
          channel: payment.channel,
          status: payment.status,
          date: payment.date,
          timestamp: Number(payment.timestamp),
          recordedBy: payment.recordedBy,
          itemDescription: payment.itemDescription,
          receiptQrCode: payment.receiptQrCode,
          securitySeal: 'AUTHENTIC & VERIFIED - CIC ENUGU 1995 SECRETARIAT',
          securityHash
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get complete receipt details by reference
   * GET /api/payments/receipt/:reference
   */
  static async getReceipt(req, res, next) {
    try {
      const { reference } = req.params;
      const cleanRef = reference.trim().toUpperCase();

      const payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { reference: cleanRef },
            { receiptNumber: cleanRef }
          ]
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Receipt not found'
        });
      }

      return res.status(200).json({
        success: true,
        receipt: {
          ...payment,
          timestamp: Number(payment.timestamp),
          securityHash: ReceiptService.generateSecurityHash(payment)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Financial Payment Ledger
   * GET /api/payments
   */
  static async getLedger(req, res, next) {
    try {
      const {
        search,
        paymentType,
        categoryId,
        gateway,
        channel,
        status,
        page,
        limit,
        all
      } = req.query;

      const where = {};

      if (paymentType && paymentType !== 'All') {
        where.paymentType = paymentType;
      }
      if (categoryId) {
        where.categoryId = categoryId;
      }
      if (gateway && gateway !== 'All') {
        where.gateway = gateway;
      }
      if (channel && channel !== 'All') {
        where.channel = channel;
      }
      if (status && status !== 'All') {
        where.status = status;
      }

      if (search) {
        const query = search.trim();
        where.OR = [
          { reference: { contains: query } },
          { receiptNumber: { contains: query } },
          { name: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } },
          { paymentType: { contains: query } }
        ];
      }

      if (all === 'true') {
        const payments = await prisma.payment.findMany({
          where,
          orderBy: { date: 'desc' }
        });
        return res.status(200).json({
          success: true,
          count: payments.length,
          data: payments.map((p) => ({ ...p, timestamp: Number(p.timestamp) }))
        });
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      const skip = (pageNum - 1) * pageSize;

      const [total, payments] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { date: 'desc' }
        })
      ]);

      return res.status(200).json({
        success: true,
        pagination: {
          total,
          page: pageNum,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        },
        data: payments.map((p) => ({ ...p, timestamp: Number(p.timestamp) }))
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export Ledger to CSV
   * GET /api/payments/export/csv
   */
  static async exportLedgerCsv(req, res, next) {
    try {
      const payments = await prisma.payment.findMany({
        orderBy: { date: 'desc' }
      });

      const csvData = ReportService.paymentsToCsv(payments);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="cic_alumni_payments_ledger.csv"');
      return res.status(200).send(csvData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Paystack Webhook
   * POST /api/payments/webhook
   */
  static async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-paystack-signature'];
      const rawBody = req.rawBody || JSON.stringify(req.body);

      const isValid = PaymentService.verifyWebhookSignature(signature, rawBody);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid webhook signature' });
      }

      const event = req.body;
      if (event.event === 'charge.success') {
        const { reference, amount, paid_at, channel } = event.data;
        const numAmount = amount / 100;

        await prisma.payment.updateMany({
          where: { reference },
          data: {
            status: 'Successful',
            channel: channel || 'Debit Card',
            verifiedAt: new Date(paid_at)
          }
        });
      }

      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  }
}

export default PaymentsController;
