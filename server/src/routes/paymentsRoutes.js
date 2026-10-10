import { Router } from 'express';
import { PaymentsController } from '../controllers/paymentsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';

const router = Router();

// Public: Zero-login dues payment and receipts
router.post('/initialize', PaymentsController.initializePayment);
router.post('/verify/:reference', PaymentsController.verifyPayment);
router.get('/verify-lookup/:refOrReceipt', PaymentsController.lookupVerification);
router.get('/receipt/:reference', PaymentsController.getReceipt);

// Paystack Webhook
router.post('/webhook', PaymentsController.handleWebhook);

// Admin Protected: Accounting Ledger & Offline Receipt Issuance
router.get('/', authenticateToken, isAdmin, PaymentsController.getLedger);
router.get('/export/csv', authenticateToken, isAdmin, PaymentsController.exportLedgerCsv);
router.post('/manual', authenticateToken, isAdmin, PaymentsController.recordManualPayment);

export default router;
