const { default: mongoose } = require("mongoose");
const invoiceRepository = require("../repo/invoice.repo");
const transactionRepo = require("../repo/transaction.repo");

class AnalyticsService {
  /**
   * Get invoice analytics for a business
   * @param {string} entityId - Business entity ID
   * @param {Object} filters - Date and other filters
   * @returns {Promise<Object>} Analytics data
   */
  static async getInvoiceAnalytics(entityId, filters = {}) {
    const { startDate, endDate } = filters;

    // Calculate month-on-month comparison dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const previousMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );

    const matchStage = {
      entity: new mongoose.Types.ObjectId(entityId),
    };

    if (startDate || endDate) {
      matchStage.issueDate = {};
      if (startDate) {
        matchStage.issueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.issueDate.$lte = end;
      }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          // Total counts
          totalInvoices: { $sum: 1 },
          totalPublishedInvoices: {
            $sum: {
              $cond: [{ $eq: ["$status", "published"] }, 1, 0],
            },
          },
          totalUnpaidPublishedInvoices: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "published"] },
                    { $ne: ["$paymentStatus", "paid"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          // Amount calculations
          totalAmount: { $sum: "$total" },
          totalSubtotal: { $sum: "$subtotal" },
          // Published invoice amounts
          publishedPaidSubtotal: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "published"] },
                    { $eq: ["$paymentStatus", "paid"] },
                  ],
                },
                "$subtotal",
                0,
              ],
            },
          },
          publishedUnpaidSubtotal: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "published"] },
                    { $ne: ["$paymentStatus", "paid"] },
                  ],
                },
                "$subtotal",
                0,
              ],
            },
          },
          // Total published invoices (both paid and unpaid)
          totalPublishedSubtotal: {
            $sum: {
              $cond: [{ $eq: ["$status", "published"] }, "$subtotal", 0],
            },
          },
          // All paid invoices subtotal
          allPaidSubtotal: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$subtotal", 0],
            },
          },
          // Legacy fields for backward compatibility
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0],
            },
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $in: ["$status", ["sent", "draft"]] }, "$total", 0],
            },
          },
          overdueAmount: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "overdue"] }, "$total", 0],
            },
          },
          whatsappShares: {
            $sum: {
              $cond: [{ $eq: ["$whatsappShared", true] }, 1, 0],
            },
          },
        },
      },
    ];

    const analytics = await invoiceRepository.aggregate(pipeline);
    const result = analytics[0] || {
      totalInvoices: 0,
      totalPublishedInvoices: 0,
      totalUnpaidPublishedInvoices: 0,
      totalAmount: 0,
      totalSubtotal: 0,
      publishedPaidSubtotal: 0,
      publishedUnpaidSubtotal: 0,
      totalPublishedSubtotal: 0,
      allPaidSubtotal: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      whatsappShares: 0,
    };

    // Calculate margin as percentage of published invoices that have been paid
    result.margin =
      result.totalPublishedSubtotal > 0
        ? (result.publishedPaidSubtotal / result.totalPublishedSubtotal) * 100
        : 0;
    result.marginAmount =
      result.publishedPaidSubtotal - result.publishedUnpaidSubtotal; // Keep the raw amount for reference

    // Calculate month-on-month percentage increase for allPaidSubtotal
    const currentMonthPaidSubtotal = await this.getMonthlyPaidSubtotal(
      entityId,
      currentMonthStart,
      currentMonthEnd
    );
    const previousMonthPaidSubtotal = await this.getMonthlyPaidSubtotal(
      entityId,
      previousMonthStart,
      previousMonthEnd
    );

    result.monthOnMonthIncrease =
      previousMonthPaidSubtotal > 0
        ? ((currentMonthPaidSubtotal - previousMonthPaidSubtotal) /
            previousMonthPaidSubtotal) *
          100
        : currentMonthPaidSubtotal > 0
        ? 100
        : 0;
    result.currentMonthPaidSubtotal = currentMonthPaidSubtotal;
    result.previousMonthPaidSubtotal = previousMonthPaidSubtotal;

    // Calculate percentages for backward compatibility
    result.paidPercentage =
      result.totalAmount > 0
        ? (result.paidAmount / result.totalAmount) * 100
        : 0;
    result.pendingPercentage =
      result.totalAmount > 0
        ? (result.pendingAmount / result.totalAmount) * 100
        : 0;
    result.overduePercentage =
      result.totalAmount > 0
        ? (result.overdueAmount / result.totalAmount) * 100
        : 0;

    return result;
  }

  /**
   * Get monthly paid subtotal for a specific date range
   * @param {string} entityId - Business entity ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<number>} Monthly paid subtotal
   */
  static async getMonthlyPaidSubtotal(entityId, startDate, endDate) {
    const pipeline = [
      {
        $match: {
          entity: new mongoose.Types.ObjectId(entityId),
          paymentStatus: "paid",
          updatedAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalPaidSubtotal: { $sum: "$subtotal" },
        },
      },
    ];

    const result = await invoiceRepository.aggregate(pipeline);
    return result[0]?.totalPaidSubtotal || 0;
  }

  /**
   * Get payment analytics
   * @param {string} entityId - Business entity ID
   * @param {Object} filters - Date filters
   * @returns {Promise<Object>} Payment analytics
   */
  static async getPaymentAnalytics(entityId, filters = {}) {
    const { startDate, endDate } = filters;

    const matchStage = {
      entity: new mongoose.Types.ObjectId(entityId),
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) {
        matchStage.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = end;
      }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          successfulAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "SUCCESS"] }, "$amount", 0],
            },
          },
          failedAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "FAILED"] }, "$amount", 0],
            },
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "PENDING"] }, "$amount", 0],
            },
          },
        },
      },
    ];

    const analytics = await transactionRepo.aggregate(pipeline);
    const result = analytics[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      successfulAmount: 0,
      failedAmount: 0,
      pendingAmount: 0,
    };

    // Calculate success rate
    result.successRate =
      result.totalTransactions > 0
        ? (result.successfulAmount / result.totalAmount) * 100
        : 0;

    return result;
  }

  /**
   * Get WhatsApp share analytics
   * @param {string} entityId - Business entity ID
   * @param {Object} filters - Date filters
   * @returns {Promise<Object>} WhatsApp analytics
   */
  static async getWhatsAppAnalytics(entityId, filters = {}) {
    const { startDate, endDate } = filters;

    const matchStage = {
      entity: new mongoose.Types.ObjectId(entityId),
      whatsappShared: true,
    };

    if (startDate || endDate) {
      matchStage.whatsappShareDate = {};
      if (startDate) {
        matchStage.whatsappShareDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.whatsappShareDate.$lte = end;
      }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalShares: { $sum: 1 },
          totalSharedAmount: { $sum: "$total" },
          paidAfterShare: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0],
            },
          },
        },
      },
    ];

    const analytics = await invoiceRepository.aggregate(pipeline);
    const result = analytics[0] || {
      totalShares: 0,
      totalSharedAmount: 0,
      paidAfterShare: 0,
    };

    // Calculate conversion rate
    result.conversionRate =
      result.totalShares > 0
        ? (result.paidAfterShare / result.totalShares) * 100
        : 0;

    return result;
  }

  /**
   * Get business dashboard summary
   * @param {string} entityId - Business entity ID
   * @returns {Promise<Object>} Dashboard summary
   */
  static async getDashboardSummary(entityId) {
    const [invoiceAnalytics, paymentAnalytics, whatsappAnalytics] =
      await Promise.all([
        this.getInvoiceAnalytics(entityId),
        this.getPaymentAnalytics(entityId),
        this.getWhatsAppAnalytics(entityId),
      ]);

    return {
      invoices: invoiceAnalytics,
      payments: paymentAnalytics,
      whatsapp: whatsappAnalytics,
      summary: {
        totalRevenue: invoiceAnalytics.paidAmount,
        totalInvoices: invoiceAnalytics.totalInvoices,
        paymentSuccessRate: paymentAnalytics.successRate,
        whatsappConversionRate: whatsappAnalytics.conversionRate,
      },
    };
  }

  /**
   * Get recent activity
   * @param {string} entityId - Business entity ID
   * @param {number} limit - Number of recent items
   * @returns {Promise<Array>} Recent activity
   */
  static async getRecentActivity(entityId, limit = 10) {
    const recentInvoices = await invoiceRepository.find({
      query: { entity: entityId },
      sort: { createdAt: -1 },
      limit: limit,
    });

    const recentTransactions = await transactionRepo.find({
      query: { entity: entityId },
      sort: { createdAt: -1 },
      limit: limit,
    });

    return {
      recentInvoices,
      recentTransactions,
    };
  }
}

module.exports = AnalyticsService;
