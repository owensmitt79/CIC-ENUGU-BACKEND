import { prisma } from '../config/db.js';

export class ConfigController {
  /**
   * Get system configuration
   * GET /api/config
   */
  static async getConfig(req, res, next) {
    try {
      let systemConfig = await prisma.systemConfig.findUnique({
        where: { id: 'default_config' }
      });

      if (!systemConfig) {
        systemConfig = await prisma.systemConfig.create({
          data: {
            id: 'default_config',
            associationName: 'CIC ALUMNI 1995 SET',
            slogan: 'Connecting the Past. Building the Future.',
            monthlyDuesRate: 5000,
            annualDuesRate: 25000,
            reunionFeeRate: 15000,
            activeGateway: 'Paystack',
            gatewayMode: 'Test Mode',
            bankName: 'First Heritage Bank',
            accountNumber: '1029384756',
            accountName: 'CIC Alumni 1995 Set National',
            ussdPrefix: '*737*50*5000#'
          }
        });
      }

      // Structure object to match data.js DEFAULT_CONFIG format
      return res.status(200).json({
        success: true,
        data: {
          associationName: systemConfig.associationName,
          slogan: systemConfig.slogan,
          monthlyDuesRate: systemConfig.monthlyDuesRate,
          annualDuesRate: systemConfig.annualDuesRate,
          reunionFeeRate: systemConfig.reunionFeeRate,
          activeGateway: systemConfig.activeGateway,
          gatewayMode: systemConfig.gatewayMode,
          bankAccount: {
            bankName: systemConfig.bankName,
            accountNumber: systemConfig.accountNumber,
            accountName: systemConfig.accountName
          },
          ussdPrefix: systemConfig.ussdPrefix
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update system configuration
   * PUT /api/config
   */
  static async updateConfig(req, res, next) {
    try {
      const {
        associationName,
        slogan,
        monthlyDuesRate,
        annualDuesRate,
        reunionFeeRate,
        activeGateway,
        gatewayMode,
        bankAccount,
        ussdPrefix
      } = req.body;

      const updateData = {};
      if (associationName !== undefined) updateData.associationName = associationName;
      if (slogan !== undefined) updateData.slogan = slogan;
      if (monthlyDuesRate !== undefined) updateData.monthlyDuesRate = parseFloat(monthlyDuesRate);
      if (annualDuesRate !== undefined) updateData.annualDuesRate = parseFloat(annualDuesRate);
      if (reunionFeeRate !== undefined) updateData.reunionFeeRate = parseFloat(reunionFeeRate);
      if (activeGateway !== undefined) updateData.activeGateway = activeGateway;
      if (gatewayMode !== undefined) updateData.gatewayMode = gatewayMode;
      if (ussdPrefix !== undefined) updateData.ussdPrefix = ussdPrefix;

      if (bankAccount) {
        if (bankAccount.bankName) updateData.bankName = bankAccount.bankName;
        if (bankAccount.accountNumber) updateData.accountNumber = bankAccount.accountNumber;
        if (bankAccount.accountName) updateData.accountName = bankAccount.accountName;
      }

      const updated = await prisma.systemConfig.upsert({
        where: { id: 'default_config' },
        update: updateData,
        create: {
          id: 'default_config',
          ...updateData
        }
      });

      return res.status(200).json({
        success: true,
        message: 'System settings updated successfully',
        data: {
          associationName: updated.associationName,
          slogan: updated.slogan,
          monthlyDuesRate: updated.monthlyDuesRate,
          annualDuesRate: updated.annualDuesRate,
          reunionFeeRate: updated.reunionFeeRate,
          activeGateway: updated.activeGateway,
          gatewayMode: updated.gatewayMode,
          bankAccount: {
            bankName: updated.bankName,
            accountNumber: updated.accountNumber,
            accountName: updated.accountName
          },
          ussdPrefix: updated.ussdPrefix
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ConfigController;
