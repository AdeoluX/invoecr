const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

class HTMLPDFService {
  /**
   * Generate PDF from HTML template using Playwright
   * @param {Object} invoice - Invoice data
   * @param {Object} entity - Entity data
   * @param {Object} customer - Customer data
   * @param {Object} subscriptionPlan - Subscription plan data
   * @param {string} templateId - Template ID (invoice1, invoice2, invoice3, invoice4)
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async generateInvoicePdfFromHtml(
    invoice,
    entity,
    customer,
    subscriptionPlan,
    templateId = "invoice2"
  ) {
    try {
      // Input validation
      if (!invoice || !entity || !customer) {
        throw new Error(
          "Missing required parameters: invoice, entity, or customer"
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

      // Launch browser - use system Chromium if available
      const launchOptions = {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--single-process", // Required for some Docker environments
        ],
      };

      // Use system Chromium if environment variable is set and file exists
      // Otherwise, Playwright will use its own installed browser
      const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
      if (chromiumPath) {
        const fs = require("fs");
        try {
          // Verify the path exists before using it
          if (fs.existsSync(chromiumPath)) {
            launchOptions.executablePath = chromiumPath;
            console.log(`Using system Chromium at ${chromiumPath}`);
          } else {
            console.warn(
              `Chromium not found at ${chromiumPath}, using Playwright's browser`
            );
          }
        } catch (error) {
          console.warn(
            `Error checking Chromium path: ${error.message}, using Playwright's browser`
          );
        }
      }

      const browser = await chromium.launch(launchOptions);
      const page = await browser.newPage();

      // Set viewport to A4 dimensions (210mm x 297mm)
      await page.setViewportSize({ width: 794, height: 1123 }); // A4 at 96 DPI

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
        preferCSSPageSize: false,
        displayHeaderFooter: false,
      });

      await browser.close();
      return pdfBuffer;
    } catch (error) {
      console.error("HTML PDF Generation Error:", error);
      throw new Error(`Failed to generate PDF from HTML: ${error.message}`);
    }
  }

  /**
   * Replace template placeholders with actual data
   * @param {string} htmlContent - HTML template content
   * @param {Object} invoice - Invoice data
   * @param {Object} entity - Entity data
   * @param {Object} customer - Customer data
   * @param {Object} subscriptionPlan - Subscription plan data
   * @param {string} templateId - Template ID
   * @returns {string} Processed HTML content
   */
  static replaceTemplateData(
    htmlContent,
    invoice,
    entity,
    customer,
    subscriptionPlan,
    templateId
  ) {
    // Calculate totals
    const subtotal =
      invoice.items?.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
        0
      ) || 0;
    const taxRate = invoice.taxRate / 100 || 0.075; // Default 7.5% VAT
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: invoice.currency || "NGN",
      }).format(amount);
    };

    // Format date
    const formatDate = (date) => {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("en-NG", {
        dateStyle: "medium",
      });
    };

    // Common replacements
    const replacements = {
      // Invoice data
      "{{INVOICE_NUMBER}}": invoice.invoiceNumber || "INV-0000",
      "{{INVOICE_CODE}}": invoice.invoiceCode || "INV-0000",
      "{{INVOICE_DATE}}": formatDate(invoice.issueDate),
      "{{DUE_DATE}}": formatDate(invoice.dueDate),
      "{{PAYMENT_TERMS}}": invoice.paymentTerms || "Net 30",
      "{{NOTES}}": invoice.notes || "Thank you for your business!",
      "{{CURRENCY}}": invoice.currency || "NGN",

      // Entity data
      "{{ENTITY_NAME}}": entity.name || "Business Name",
      "{{ENTITY_ADDRESS}}": entity.address || "Business Address",
      "{{ENTITY_PHONE}}": entity.phone || "N/A",
      "{{ENTITY_EMAIL}}": entity.email || "N/A",
      "{{ENTITY_LOGO}}": entity.logo?.secure_url || "",
      "{{ENTITY_LOGO_DISPLAY}}": entity.logo?.secure_url ? "block" : "none",
      "{{ENTITY_SIGNATURE}}": entity.signature?.secure_url || "",
      "{{ENTITY_SIGNATURE_DISPLAY}}": entity.signature?.secure_url
        ? "block"
        : "none",
      "{{ENTITY_SIGNATURE_DISPLAY_NONE}}": entity.signature?.secure_url
        ? "none"
        : "block",
      "{{ENTITY_WEBSITE}}": entity.website || entity.email || "N/A",

      // Customer data
      "{{CUSTOMER_NAME}}": customer.name || "Customer Name",
      "{{CUSTOMER_ADDRESS}}": customer.address || "Customer Address",
      "{{CUSTOMER_PHONE}}": customer.phone || "N/A",
      "{{CUSTOMER_EMAIL}}": customer.email || "N/A",

      // Financial data
      "{{SUBTOTAL}}": formatCurrency(subtotal),
      "{{TAX_RATE}}": `${(taxRate * 100).toFixed(1)}%`,
      "{{TAX_AMOUNT}}": formatCurrency(tax),
      "{{TOTAL}}": formatCurrency(total),

      // Payment link
      "{{PAYMENT_LINK}}": `${
        process.env.BACKEND_URL || "http://localhost:3000"
      }/invoice/${invoice.invoiceNumber}/initiate-payment`,

      // Status
      "{{STATUS}}": (invoice.status || "draft").toUpperCase(),
      "{{PAYMENT_STATUS}}": (invoice.paymentStatus || "unpaid").toUpperCase(),
    };

    // Apply common replacements
    Object.entries(replacements).forEach(([placeholder, value]) => {
      htmlContent = htmlContent.replace(new RegExp(placeholder, "g"), value);
    });

    // Template-specific replacements
    if (templateId === "invoice1") {
      htmlContent = this.replaceInvoice1Data(
        htmlContent,
        invoice,
        entity,
        customer
      );
    } else if (templateId === "invoice2") {
      htmlContent = this.replaceInvoice2Data(
        htmlContent,
        invoice,
        entity,
        customer
      );
    } else if (templateId === "invoice3") {
      htmlContent = this.replaceInvoice3Data(
        htmlContent,
        invoice,
        entity,
        customer
      );
    } else if (templateId === "invoice4") {
      htmlContent = this.replaceInvoice4Data(
        htmlContent,
        invoice,
        entity,
        customer
      );
    }

    // Replace items table
    htmlContent = this.replaceItemsTable(htmlContent, invoice, templateId);

    return htmlContent;
  }

  /**
   * Replace items table in HTML
   * @param {string} htmlContent - HTML content
   * @param {Object} invoice - Invoice data
   * @param {string} templateId - Template ID
   * @returns {string} HTML with replaced items table
   */
  static replaceItemsTable(htmlContent, invoice, templateId) {
    if (!invoice.items || invoice.items.length === 0) {
      const colspan = templateId === "invoice1" ? "5" : "4";
      return htmlContent.replace(
        "{{ITEMS_TABLE}}",
        `<tr><td colspan="${colspan}">No items found</td></tr>`
      );
    }

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: invoice.currency || "NGN",
      }).format(amount);
    };

    let itemsHtml = "";

    if (templateId === "invoice1") {
      // Table format for invoice1 with new structure
      invoice.items.forEach((item, index) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        itemsHtml += `
          <tr>
            <td>${String(index + 1).padStart(2, "0")}</td>
            <td>${item.name || "Item"}</td>
            <td>${formatCurrency(item.unitPrice || 0)}</td>
            <td>${item.quantity || 0}</td>
            <td>${formatCurrency(itemTotal)}</td>
          </tr>
        `;
      });
    } else if (templateId === "invoice2") {
      // Flex format for invoice2
      invoice.items.forEach((item, index) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        itemsHtml += `
          <div class="table-row">
            <div class="item-description">
              <h4>${item.name || "Item"}</h4>
              <p>${item.description || ""}</p>
            </div>
            <div class="price">${formatCurrency(item.unitPrice || 0)}</div>
            <div class="qty">${item.quantity || 0}</div>
            <div class="total">${formatCurrency(itemTotal)}</div>
          </div>
        `;
      });
    } else if (templateId === "invoice3") {
      // Table format for invoice3
      invoice.items.forEach((item, index) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        itemsHtml += `
          <tr>
            <td class="sl">${index + 1}</td>
            <td class="description">${item.name || "Item"}</td>
            <td class="price">${formatCurrency(item.unitPrice || 0)}</td>
            <td class="qty">${item.quantity || 0}</td>
            <td class="total">${formatCurrency(itemTotal)}</td>
          </tr>
        `;
      });
    }

    return htmlContent.replace("{{ITEMS_TABLE}}", itemsHtml);
  }

  /**
   * Template-specific replacements for invoice1
   */
  static replaceInvoice1Data(htmlContent, invoice, entity, customer) {
    // Add any template-specific replacements for invoice1
    return htmlContent;
  }

  /**
   * Template-specific replacements for invoice2
   */
  static replaceInvoice2Data(htmlContent, invoice, entity, customer) {
    // Add any template-specific replacements for invoice2
    return htmlContent;
  }

  /**
   * Template-specific replacements for invoice3
   */
  static replaceInvoice3Data(htmlContent, invoice, entity, customer) {
    // Add any template-specific replacements for invoice3
    return htmlContent;
  }

  /**
   * Template-specific replacements for invoice4
   */
  static replaceInvoice4Data(htmlContent, invoice, entity, customer) {
    // Add any template-specific replacements for invoice4
    return htmlContent;
  }

  /**
   * Generate invoice PDF buffer for download using HTML templates
   * @param {string} invoiceId - Invoice ID
   * @param {string} entityId - Entity ID
   * @param {string} templateId - Template ID (invoice1, invoice2, invoice3, invoice4)
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async generateInvoicePDFBuffer(
    invoiceId,
    entityId,
    templateId = "invoice1"
  ) {
    try {
      if (!invoiceId || !entityId) {
        throw new Error("Missing invoiceId or entityId");
      }

      const Invoice = require("../models/invoice.model");
      const invoice = await Invoice.findById(invoiceId)
        .populate("customer")
        .populate("entity")
        .populate("items");

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const Entity = require("../models/entity.model");
      const entity = await Entity.findById(entityId).populate(
        "subscriptionPlan"
      );

      if (!entity) {
        throw new Error("Entity not found");
      }

      // Generate PDF with HTML template
      const pdfBuffer = await this.generateInvoicePdfFromHtml(
        invoice,
        entity,
        invoice.customer,
        entity.subscriptionPlan,
        templateId
      );

      return pdfBuffer;
    } catch (error) {
      console.error("HTML PDF Generation Error:", {
        invoiceId,
        entityId,
        templateId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }
}

module.exports = HTMLPDFService;
