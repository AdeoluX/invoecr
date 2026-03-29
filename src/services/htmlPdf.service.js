const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

class HTMLPDFService {
  /**
   * Generate PDF from HTML template using Playwright
   * @param {Object} data - Data object containing invoice, entity, customer, and templateId
   * @param {Object} subscriptionPlan - Subscription plan data
   * @param {boolean} isPreview - Flag to bypass premium template checks for preview
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async generateHTMLPDF(data, subscriptionPlan = null, isPreview = false) {
    try {
      const htmlContent = await this.generateHTMLInvoice(data, subscriptionPlan, isPreview);

      // Launch browser
      const browser = await chromium.launch({
        headless: true,
        executablePath:
          process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });
      const page = await browser.newPage();

      // Set viewport to A4 dimensions
      await page.setViewportSize({ width: 794, height: 1123 });

      // Set content and generate PDF
      await page.setContent(htmlContent, { waitUntil: "networkidle" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        width: "210mm",
        height: "297mm",
        margin: {
          top: "0mm",
          right: "0mm",
          bottom: "0mm",
          left: "0mm",
        },
        printBackground: true,
      });

      await browser.close();
      return pdfBuffer;
    } catch (error) {
      console.error("HTML PDF Generation Error:", error);
      throw new Error(`Failed to generate PDF from HTML: ${error.message}`);
    }
  }

  /**
   * Generate HTML content from template
   * @param {Object} data - Data object containing invoice, entity, customer, and templateId
   * @param {Object} subscriptionPlan - Subscription plan data
   * @param {boolean} isPreview - Flag to bypass premium template checks for preview
   * @returns {Promise<string>} HTML content
   */
  static async generateHTMLInvoice(data, subscriptionPlan = null, isPreview = false) {
    try {
      const { invoice, entity, customer } = data;
      const templateId = data.templateId || "invoice1";

      // Input validation
      if (!invoice || !entity || !customer) {
        throw new Error(
          "Missing required parameters: invoice, entity, or customer"
        );
      }

      // Authorization check for premium templates
      const premiumTemplateIds = [
        "invoice5",
        "invoice6",
        "invoice7",
        "invoice8",
        "invoice9",
        "invoice10",
      ];
      if (
        !isPreview &&
        premiumTemplateIds.includes(templateId) &&
        (!subscriptionPlan || !subscriptionPlan.features?.premiumTemplates)
      ) {
        throw new Error(
          "This template is only available on Basic or Premium plans. Please upgrade to access this design."
        );
      }

      // Get template path
      const templatePath = path.join(
        __dirname,
        "htmlTemplates",
        "invoices",
        `${templateId}.html`
      );

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Read template file
      let htmlContent = fs.readFileSync(templatePath, "utf8");

      // Replace template data with actual data
      htmlContent = this.replaceTemplateData(
        htmlContent,
        invoice,
        entity,
        customer,
        subscriptionPlan,
        templateId
      );

      return htmlContent;
    } catch (error) {
      console.error("HTML Generation Error:", error);
      throw error;
    }
  }

  /**
   * Replace template placeholders with actual data
   */
  static replaceTemplateData(
    htmlContent,
    invoice,
    entity,
    customer,
    subscriptionPlan,
    templateId
  ) {
    const subtotal =
      invoice.items?.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        0
      ) || 0;
    const taxRate = typeof invoice.taxRate === 'number' ? invoice.taxRate / 100 : 0.075;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: invoice.currency || "NGN",
      }).format(amount);
    };

    const formatDate = (date) => {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("en-NG", {
        dateStyle: "medium",
      });
    };

    const replacements = {
      "{{INVOICE_NUMBER}}": invoice.invoiceNumber || "INV-0000",
      "{{INVOICE_CODE}}": invoice.invoiceCode || "INV-0000",
      "{{INVOICE_DATE}}": formatDate(invoice.issueDate),
      "{{DUE_DATE}}": formatDate(invoice.dueDate),
      "{{PAYMENT_TERMS}}": invoice.paymentTerms || "Net 30",
      "{{NOTES}}": invoice.notes || "Thank you for your business!",
      "{{CURRENCY}}": invoice.currency || "NGN",
      "{{ENTITY_NAME}}": entity.name || "Business Name",
      "{{ENTITY_ADDRESS}}": entity.address || "Business Address",
      "{{ENTITY_PHONE}}": entity.phone || "N/A",
      "{{ENTITY_EMAIL}}": entity.email || "N/A",
      "{{ENTITY_LOGO}}": entity.logo?.secure_url || "",
      "{{ENTITY_LOGO_DISPLAY}}": entity.logo?.secure_url ? "block" : "none",
      "{{ENTITY_LOGO_STYLE}}": entity.logo?.secure_url ? "display: block;" : "display: none;",
      "{{ENTITY_SIGNATURE}}": entity.signature?.secure_url || "",
      "{{ENTITY_SIGNATURE_DISPLAY}}": entity.signature?.secure_url ? "block" : "none",
      "{{ENTITY_SIGNATURE_DISPLAY_NONE}}": entity.signature?.secure_url ? "none" : "block",
      "{{ENTITY_SIGNATURE_STYLE}}": entity.signature?.secure_url ? "display: block;" : "display: none;",
      "{{ENTITY_SIGNATURE_STYLE_NONE}}": entity.signature?.secure_url ? "display: none;" : "display: block;",
      "{{ENTITY_WEBSITE}}": entity.website || entity.email || "N/A",
      "{{CUSTOMER_NAME}}": customer.name || "Customer Name",
      "{{CUSTOMER_ADDRESS}}": customer.address || "Customer Address",
      "{{CUSTOMER_PHONE}}": customer.phone || "N/A",
      "{{CUSTOMER_EMAIL}}": customer.email || "N/A",
      "{{SUBTOTAL}}": formatCurrency(subtotal),
      "{{TAX_RATE}}": `${(taxRate * 100).toFixed(1)}%`,
      "{{TAX_AMOUNT}}": formatCurrency(tax),
      "{{TOTAL}}": formatCurrency(total),
      "{{PAYMENT_LINK}}": `${(process.env.BACKEND_URL || "http://localhost:3000").replace(/\/$/, '')}${ (process.env.BACKEND_URL || "").includes('/api/v1') ? '' : '/api/v1' }/invoice/${invoice.invoiceNumber}/initiate-payment`,
      "{{STATUS}}": (invoice.status || "draft").toUpperCase(),
      "{{PAYMENT_STATUS}}": (invoice.paymentStatus || "unpaid").toUpperCase(),
      "{{DOCUMENT_TITLE}}": invoice.type === "quote" ? "ESTIMATE" : "INVOICE",
      "{{BILL_TO_LABEL}}": invoice.type === "quote" ? "Estimate to:" : "Invoice to:",
      "{{DOCUMENT_NUMBER_LABEL}}": invoice.type === "quote" ? "Estimate#" : "Invoice#",
      "{{PAYMENT_INFO_DISPLAY}}": invoice.type === "quote" ? "none" : "block",
      "{{PAYMENT_INFO_STYLE}}": invoice.type === "quote" ? "display: none;" : "display: block;",
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      htmlContent = htmlContent.replace(new RegExp(placeholder, "g"), value);
    });

    const templateMethods = {
      invoice1: this.replaceInvoice1Data,
      invoice2: this.replaceInvoice2Data,
      invoice3: this.replaceInvoice3Data,
      invoice4: this.replaceInvoice4Data,
      invoice5: this.replaceInvoice5Data,
      invoice6: this.replaceInvoice6Data,
      invoice7: this.replaceInvoice7Data,
      invoice8: this.replaceInvoice8Data,
      invoice9: this.replaceInvoice9Data,
      invoice10: this.replaceInvoice10Data,
    };

    if (templateMethods[templateId]) {
      htmlContent = templateMethods[templateId](htmlContent, invoice, entity, customer);
    }

    htmlContent = this.replaceItemsTable(htmlContent, invoice, templateId);
    return htmlContent;
  }

  static replaceItemsTable(htmlContent, invoice, templateId) {
    if (!invoice.items || invoice.items.length === 0) {
      return htmlContent.replace("{{ITEMS_TABLE}}", `<tr><td colspan="5">No items found</td></tr>`);
    }

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: invoice.currency || "NGN",
      }).format(amount);
    };

    let itemsHtml = "";
    if (templateId === "invoice1") {
      invoice.items.forEach((item, index) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        itemsHtml += `<tr><td>${String(index + 1).padStart(2, "0")}</td><td>${item.name}</td><td>${formatCurrency(item.unitPrice)}</td><td>${item.quantity}</td><td>${formatCurrency(itemTotal)}</td></tr>`;
      });
    } else if (templateId === "invoice2") {
      invoice.items.forEach((item) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        itemsHtml += `<div class="table-row"><div class="item-description"><h4>${item.name}</h4><p>${item.description || ""}</p></div><div class="price">${formatCurrency(item.unitPrice)}</div><div class="qty">${item.quantity}</div><div class="total">${formatCurrency(itemTotal)}</div></div>`;
      });
    } else {
      // Default table format for 3-10
      invoice.items.forEach((item, index) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        itemsHtml += `<tr><td class="sl">${index + 1}</td><td class="description">${item.name}</td><td class="price">${formatCurrency(item.unitPrice)}</td><td class="qty">${item.quantity}</td><td class="total">${formatCurrency(itemTotal)}</td></tr>`;
      });
    }

    return htmlContent.replace("{{ITEMS_TABLE}}", itemsHtml);
  }

  static replaceInvoice1Data(h, i, e, c) { return h; }
  static replaceInvoice2Data(h, i, e, c) { return h; }
  static replaceInvoice3Data(h, i, e, c) { return h; }
  static replaceInvoice4Data(h, i, e, c) { return h; }
  static replaceInvoice5Data(h, i, e, c) { return h; }
  static replaceInvoice6Data(h, i, e, c) { return h; }
  static replaceInvoice7Data(h, i, e, c) { return h; }
  static replaceInvoice8Data(h, i, e, c) { return h; }
  static replaceInvoice9Data(h, i, e, c) { return h; }
  static replaceInvoice10Data(h, i, e, c) { return h; }

  static async generateInvoicePDFBuffer(invoiceId, entityId, templateId = "invoice1") {
    try {
      const Invoice = require("../models/invoice.model");
      const Entity = require("../models/entity.model");
      
      const invoice = await Invoice.findById(invoiceId).populate("customer").populate("entity").populate("items");
      if (!invoice) throw new Error("Invoice not found");

      const entity = await Entity.findById(entityId).populate("subscriptionPlan");
      if (!entity) throw new Error("Entity not found");

      // Use the proper HTML generation method
      const data = {
        invoice,
        entity,
        customer: invoice.customer,
        templateId
      };
      
      return await this.generateHTMLPDF(data, entity.subscriptionPlan, false);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }
}

module.exports = HTMLPDFService;
