const axios = require("axios");
const { abortIf } = require("../utils/responder");
const httpStatus = require("http-status").default;

class TermiiService {
  constructor() {
    this.apiKey = process.env.TERMII_API_KEY;
    this.baseUrl = "https://api.ng.termii.com";
    this.whatsappChannelId = process.env.TERMII_WHATSAPP_CHANNEL_ID;
  }

  /**
   * Send WhatsApp message via Termii
   * @param {string} phoneNumber - Recipient phone number (with country code)
   * @param {string} message - Message to send
   * @param {string} channelId - WhatsApp channel ID
   * @returns {Promise<Object>} Response from Termii
   */
  static async sendWhatsAppMessage(phoneNumber, message, channelId = null) {
    try {
      const apiKey = process.env.TERMII_API_KEY;
      const baseUrl = "https://api.ng.termii.com";
      const defaultChannelId = process.env.TERMII_WHATSAPP_CHANNEL_ID;

      if (!apiKey) {
        throw new Error("Termii API key not configured");
      }

      // Format phone number for Nigeria
      let formattedPhone = phoneNumber;
      if (!phoneNumber.startsWith("+234")) {
        if (phoneNumber.startsWith("0")) {
          formattedPhone = "+234" + phoneNumber.substring(1);
        } else if (phoneNumber.startsWith("234")) {
          formattedPhone = "+" + phoneNumber;
        } else {
          formattedPhone = "+234" + phoneNumber;
        }
      }

      const response = await axios.post(
        `${baseUrl}/api/send/whatsapp`,
        {
          api_key: apiKey,
          to: formattedPhone,
          from: channelId || defaultChannelId,
          type: "text",
          channel: "whatsapp",
          media: {
            url: "",
            caption: "",
          },
          sms: message,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.code === "ok") {
        return {
          success: true,
          messageId: response.data.message_id,
          message: "WhatsApp message sent successfully",
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: response.data.message || "Failed to send WhatsApp message",
          data: response.data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Send WhatsApp media message (PDF, Image, etc.) via Termii
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} mediaUrl - URL to the media file
   * @param {string} caption - Caption for the media
   * @param {string} mediaType - Type of media (document, image, video)
   * @param {string} channelId - WhatsApp channel ID
   * @returns {Promise<Object>} Response from Termii
   */
  static async sendWhatsAppMedia(
    phoneNumber,
    mediaUrl,
    caption,
    mediaType = "document",
    channelId = null
  ) {
    try {
      const apiKey = process.env.TERMII_API_KEY;
      const baseUrl = "https://api.ng.termii.com";
      const defaultChannelId = process.env.TERMII_WHATSAPP_CHANNEL_ID;

      if (!apiKey) {
        throw new Error("Termii API key not configured");
      }

      // Format phone number for Nigeria
      let formattedPhone = phoneNumber;
      if (!phoneNumber.startsWith("+234")) {
        if (phoneNumber.startsWith("0")) {
          formattedPhone = "+234" + phoneNumber.substring(1);
        } else if (phoneNumber.startsWith("234")) {
          formattedPhone = "+" + phoneNumber;
        } else {
          formattedPhone = "+234" + phoneNumber;
        }
      }

      const response = await axios.post(
        `${baseUrl}/api/send/whatsapp`,
        {
          api_key: apiKey,
          to: formattedPhone,
          from: channelId || defaultChannelId,
          type: mediaType,
          channel: "whatsapp",
          media: {
            url: mediaUrl,
            caption: caption,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.code === "ok") {
        return {
          success: true,
          messageId: response.data.message_id,
          message: "WhatsApp media message sent successfully",
          data: response.data,
        };
      } else {
        return {
          success: false,
          message:
            response.data.message || "Failed to send WhatsApp media message",
          data: response.data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Generate WhatsApp share link for invoice
   * @param {Object} invoice - Invoice object
   * @param {Object} entity - Business entity
   * @returns {string} WhatsApp share URL
   */
  static generateWhatsAppLink(invoice, entity) {
    const message = this.formatInvoiceMessage(invoice, entity);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/?text=${encodedMessage}`;
  }

  /**
   * Format invoice message for WhatsApp sharing
   * @param {Object} invoice - Invoice object
   * @param {Object} entity - Business entity
   * @returns {string} Formatted message
   */
  static formatInvoiceMessage(invoice, entity) {
    const currencySymbol = "₦";
    const total = this.formatCurrency(invoice.total, "NGN");

    let message = `📄 *INVOICE*\n\n`;
    message += `*${entity.name}*\n`;
    message += `Invoice: ${invoice.invoiceNumber}\n`;
    message += `Date: ${new Date(invoice.issueDate).toLocaleDateString(
      "en-NG"
    )}\n`;
    message += `Due: ${
      invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString("en-NG")
        : "N/A"
    }\n\n`;

    message += `*Items:*\n`;
    invoice.items.forEach((item, index) => {
      const itemTotal = this.formatCurrency(
        item.unitPrice * item.quantity,
        "NGN"
      );
      message += `${index + 1}. ${item.description} - ${
        item.quantity
      } × ${currencySymbol}${item.unitPrice.toLocaleString(
        "en-NG"
      )} = ${itemTotal}\n`;
    });

    message += `\n*Summary:*\n`;
    message += `Subtotal: ${this.formatCurrency(invoice.subtotal, "NGN")}\n`;
    if (invoice.tax > 0) {
      message += `VAT (${invoice.taxRate}%): ${this.formatCurrency(
        invoice.tax,
        "NGN"
      )}\n`;
    }
    message += `*Total: ${total}*\n\n`;

    if (invoice.paymentLink) {
      message += `💳 *Pay Online:* ${invoice.paymentLink}\n\n`;
    }

    message += `Thank you for your business! 🙏`;

    return message;
  }

  /**
   * Format currency with Nigerian formatting
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @returns {string} Formatted amount
   */
  static formatCurrency(amount, currency) {
    const symbol = currency === "NGN" ? "₦" : currency;
    return `${symbol}${amount.toLocaleString("en-NG")}`;
  }

  /**
   * Send invoice via WhatsApp using Termii
   * @param {Object} invoice - Invoice object
   * @param {Object} entity - Business entity
   * @param {string} customerPhone - Customer phone number
   * @returns {Promise<Object>} Send result
   */
  static async sendInvoiceViaWhatsApp(invoice, entity, customerPhone) {
    try {
      const message = this.formatInvoiceMessage(invoice, entity);
      const result = await this.sendWhatsAppMessage(customerPhone, message);

      return {
        success: result.success,
        messageId: result.messageId,
        whatsappLink: this.generateWhatsAppLink(invoice, entity),
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        whatsappLink: this.generateWhatsAppLink(invoice, entity),
      };
    }
  }

  /**
   * Send PDF invoice via WhatsApp using Termii
   * @param {Object} invoice - Invoice object
   * @param {Object} entity - Business entity
   * @param {string} customerPhone - Customer phone number
   * @param {string} pdfUrl - URL to the PDF file
   * @returns {Promise<Object>} Send result
   */
  static async sendPDFInvoiceViaWhatsApp(
    invoice,
    entity,
    customerPhone,
    pdfUrl
  ) {
    try {
      const caption = this.formatInvoiceMessage(invoice, entity);
      const result = await this.sendWhatsAppMedia(
        customerPhone,
        pdfUrl,
        caption,
        "document"
      );

      return {
        success: result.success,
        messageId: result.messageId,
        whatsappLink: this.generateWhatsAppLink(invoice, entity),
        message: result.message,
        pdfSent: true,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        whatsappLink: this.generateWhatsAppLink(invoice, entity),
        pdfSent: false,
      };
    }
  }
}

module.exports = TermiiService;
