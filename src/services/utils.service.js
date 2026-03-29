const { listBanks, verifyBankAccount } = require("../utils/bank.utils");
const { abortIf } = require("../utils/responder");
const httpStatus = require("http-status");
const {
  PaymentGateway,
  PaystackPaymentGateway,
  PaymentResponse,
} = require("../utils/paystack.utils");
const transactionRepo = require("../repo/transaction.repo");
const invoiceRepo = require("../repo/invoice.repo");
const CardService = require("./card.service");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class UtilsService {
  static listAllBanks = async () => {
    const getBanks = await listBanks();
    return getBanks;
  };

  static verifyBankNumber = async (accountNumber, bankCode) => {
    const verifyBank = await verifyBankAccount(accountNumber, bankCode);
    abortIf(!verifyBank.status, httpStatus.BAD_REQUEST, verifyBank.message);
    return verifyBank.data;
  };

  static callbackWebhook = async (data) => {
    console.log("🔄 Callback webhook received:", data);
    const paystack = new PaystackPaymentGateway();
    const verification = await paystack.verifyTransaction(data.reference);
    if (!verification.success) {
      console.error("Payment verification failed:", verification.message);
      return {};
    }

    let metadata = verification.data.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        console.error("Error parsing metadata string:", e);
      }
    }

    // Handle invoice payment if type is invoice_payment
    if (metadata?.type === 'invoice_payment') {
      console.log("💰 Processing invoice payment via callback");
      await this.handleInvoicePayment(verification.data);
    }
    
    // Handle card save (which might also happen during payment)
    if (metadata?.type === 'card_save' || metadata?.purpose === 'card_verification') {
      const cardSaveResult = await CardService.saveCardFromWebhook(
        metadata?.entityId,
        verification.data.authorization
      );
      if (!cardSaveResult.success && cardSaveResult.message !== 'Card already saved') {
        console.error("Card save failed:", cardSaveResult.message);
      }
    }

    return {
      success: true,
      message: "Callback processed successfully",
      data: verification.data,
    };
  };

  static webhook = async (object, signature) => {
    try {
      const paystack = new PaystackPaymentGateway();
      const dataReq = object;

      // Verify Paystack webhook signature
      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      if (!secretKey) {
        throw new Error("Paystack Secret Key is not defined");
      }

      // Verify webhook signature for security
      if (signature) {
        const hash = crypto
          .createHmac("sha512", secretKey)
          .update(JSON.stringify(dataReq))
          .digest("hex");

        if (hash !== signature) {
          console.error("❌ Webhook signature verification failed");
          throw new Error("Invalid webhook signature");
        }
        console.log("✅ Webhook signature verified");
      }

      const event = dataReq.event;
      const data = dataReq.data;

      console.log(`🔄 Processing webhook event: ${event}`);

      // Handle different webhook events
      switch (event) {
        case "charge.success":
          return await this.handleChargeSuccess(data);

        case "transfer.success":
          return await this.handleTransferSuccess(data);

        case "subscription.create":
          return await this.handleSubscriptionCreate(data);

        case "subscription.disable":
          return await this.handleSubscriptionDisable(data);

        default:
          console.log(`⚠️ Unhandled webhook event: ${event}`);
          return {};
      }
    } catch (error) {
      console.error("Webhook service error:", error);
      return {};
    }
  };

  // Handle successful charge (invoice payment or card save)
  static async handleChargeSuccess(data) {
    try {
      const paystack = new PaystackPaymentGateway();
      const verification = await paystack.verifyTransaction(data.reference);
      if (!verification.success) {
        console.error("Payment verification failed:", verification.message);
        return {};
      }

      let metadata = data.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error("Error parsing metadata string:", e);
        }
      }
      const purpose = metadata?.purpose;

      // Handle card saving
      if (purpose === "card_verification") {
        console.log("💳 Processing card save webhook");
        return await this.handleCardSave(data);
      }

      // Handle invoice payment
      if (metadata?.type === "invoice_payment") {
        console.log("💰 Processing invoice payment webhook");
        return await this.handleInvoicePayment(data);
      }

      // Handle subscription payment
      if (metadata?.type === "subscription_upgrade") {
        console.log("📅 Processing subscription payment webhook");
        return await this.handleSubscriptionPayment(data);
      }

      console.log("⚠️ Unknown charge purpose:", purpose);
      return {};
    } catch (error) {
      console.error("Charge success handling error:", error);
      return {};
    }
  }

  // Handle card saving
  static async handleCardSave(data) {
    try {
      let metadata = data.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error("Error parsing metadata string:", e);
        }
      }
      const entityId = metadata?.entityId;
      const authorization = data.authorization;

      if (!authorization || !authorization.authorization_code) {
        console.error("No authorization code in webhook data");
        return {};
      }

      // Save the card using CardService
      const cardSaveResult = await CardService.saveCardFromWebhook(
        entityId,
        authorization
      );

      if (cardSaveResult.success) {
        console.log("✅ Card saved successfully via webhook");
      } else {
        console.error("❌ Card save failed:", cardSaveResult.message);
      }

      return cardSaveResult;
    } catch (error) {
      console.error("Card save webhook error:", error);
      return { success: false, message: error.message };
    }
  }

  // Handle invoice payment
  static async handleInvoicePayment(data) {
    try {
      const transaction = await transactionRepo.findOne({
        query: { reference: data.reference },
      });

      if (!transaction) {
        console.error("Transaction not found for reference:", data.reference);
        return {};
      }

      await transactionRepo.update(transaction._id, {
        status: "SUCCESS",
      });

      const _in = await invoiceRepo.findById(transaction.invoice);
      let paymentStatus;
      if (_in.total > transaction.amount) paymentStatus = "partially-paid";
      if (_in.total === transaction.amount) paymentStatus = "paid";

      const invoice = await invoiceRepo.update(transaction.invoice, {
        paymentStatus,
      });

      console.log("✅ Invoice payment processed successfully");
      return {};
    } catch (error) {
      console.error("Invoice payment webhook error:", error);
      return {};
    }
  }

  // Handle subscription payment
  static async handleSubscriptionPayment(data) {
    try {
      let metadata = data.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error("Error parsing metadata string:", e);
        }
      }
      const entityId = metadata?.entityId;
      const planName = metadata?.planName;

      // Update subscription status after successful payment
      const subscriptionService = require("./subscription.service");
      const updatedEntity = await subscriptionService.upgradeSubscription(
        entityId,
        planName
      );

      console.log(
        "📅 Subscription upgraded successfully for entity:",
        entityId,
        "to plan:",
        planName
      );
      return {
        success: true,
        message: "Subscription upgraded via webhook",
        entityId,
        planName,
        status: updatedEntity.subscriptionStatus,
      };
    } catch (error) {
      console.error("Subscription payment webhook error:", error);
      return {};
    }
  }

  // Handle transfer success
  static async handleTransferSuccess(data) {
    console.log("💸 Transfer successful:", data.reference);
    return {};
  }

  // Handle subscription creation
  static async handleSubscriptionCreate(data) {
    console.log("📅 Subscription created:", data.reference);
    return {};
  }

  // Handle subscription disable
  static async handleSubscriptionDisable(data) {
    console.log("📅 Subscription disabled:", data.reference);
    return {};
  }

  static cloudinaryUpload = async (file, folder) => {
    try {
      const result = await cloudinary.uploader.upload(file, {
        folder,
        resource_type: "image",
      });
      return result;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return null;
    }
  };
}

module.exports = {
  UtilsService,
};
