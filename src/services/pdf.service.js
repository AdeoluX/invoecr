const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const { SubscriptionService } = require("./subscription.service");

class PDFService {
  /**
   * Generate invoice PDF with watermark based on subscription plan
   * @param {Object} invoice - Invoice data
   * @param {Object} entity - Entity data
   * @param {Object} customer - Customer data
   * @param {Object} subscriptionPlan - Subscription plan data
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async generateInvoicePDF(invoice, entity, customer, subscriptionPlan) {
    // Input validation
    if (!invoice || !entity || !customer) {
      throw new Error(
        "Missing required parameters: invoice, entity, or customer"
      );
    }

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 40,
          autoFirstPage: true,
          info: {
            Title: `Invoice ${invoice.invoiceCode || "N/A"}`,
            Author: entity.name || "Unknown",
            CreationDate: new Date(),
          },
        });

        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (error) => reject(error));

        // Add watermark based on subscription plan
        this.addWatermark(doc, subscriptionPlan);

        // Generate invoice content
        await this.generateInvoiceContent(doc, invoice, entity, customer);

        doc.end();
      } catch (error) {
        reject(new Error(`Failed to generate PDF: ${error.message}`));
      }
    });
  }

  /**
   * Add watermark based on subscription plan
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} subscriptionPlan - Subscription plan data
   */
  static addWatermark(doc, subscriptionPlan) {
    if (!subscriptionPlan || subscriptionPlan.name?.toLowerCase() === "free") {
      const pageWidth = 595.28; // A4 width in points
      const pageHeight = 841.89; // A4 height in points
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;

      // Save current state
      doc.save();

      // Set watermark properties
      doc.font("Helvetica-Bold");
      doc.fontSize(48);
      doc.fillColor("#FF0000");

      // Create semi-transparent effect by using a lighter color
      doc.fillColor("#FFCCCC");

      // Rotate and position watermark
      doc.rotate(-45, centerX, centerY);

      // Add "FREE TRIAL" watermark
      doc.text("FREE TRIAL", centerX, centerY, {
        align: "center",
      });

      // Restore state
      doc.restore();
    }
  }

  /**
   * Generate the main invoice content
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} invoice - Invoice data
   * @param {Object} entity - Entity data
   * @param {Object} customer - Customer data
   */
  static async generateInvoiceContent(doc, invoice, entity, customer) {
    doc.registerFont("Helvetica", "Helvetica");
    doc.registerFont("Helvetica-Bold", "Helvetica-Bold");

    this.generateHeader(doc, invoice, entity);
    this.generateBusinessInfo(doc, entity);
    this.generateCustomerInfo(doc, customer);
    this.generateInvoiceDetails(doc, invoice);
    this.generateItemsTable(doc, invoice);
    await this.generateTotals(doc, invoice);
    this.generateFooter(doc, entity, invoice);
  }

  /**
   * Generate invoice header with logo and title
   */
  static generateHeader(doc, invoice, entity) {
    doc
      .font("Helvetica-Bold")
      .fontSize(28)
      .fillColor("#1A3C34")
      .text("INVOICE", 40, 40, { align: "left" });

    // Currency indicator
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#666666")
      .text(`Currency: ${invoice.currency || "NGN"}`, 40, 70);

    // Invoice details
    const detailsX = 370;
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#4A4A4A")
      .text(`Invoice #: ${invoice.invoiceNumber || "INV-0000"}`, detailsX, 40)
      .text(
        `Date: ${
          invoice.issueDate
            ? new Date(invoice.issueDate).toLocaleDateString("en-NG", {
                dateStyle: "medium",
              })
            : "N/A"
        }`,
        detailsX,
        60
      )
      .text(
        `Due Date: ${
          invoice.dueDate
            ? new Date(invoice.dueDate).toLocaleDateString("en-NG", {
                dateStyle: "medium",
              })
            : "N/A"
        }`,
        detailsX,
        80
      );

    // Status badge
    const status = (invoice.status || "draft").toLowerCase();

    // Draw status badge background
    doc.rect(detailsX, 100, 80, 25);
    doc.fillAndStroke(this.getStatusColor(status), "#333333");

    // Add status text
    doc.font("Helvetica-Bold");
    doc.fontSize(11);
    doc.fillColor("#FFFFFF");
    doc.text(status.toUpperCase(), detailsX + 40, 108, { align: "center" });
  }

  /**
   * Generate business information section
   */
  static generateBusinessInfo(doc, entity) {
    if (!entity) {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#999999")
        .text("Business information not available", 40, 160);
      return;
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#1A3C34")
      .text("From:", 40, 160)
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#4A4A4A")
      .text(entity.name || "Business Name", 40, 180)
      .text(entity.address || "Business Address", 40, 195)
      .text(`Phone: ${entity.phone || "N/A"}`, 40, 210)
      .text(`Email: ${entity.email || "N/A"}`, 40, 225);

    // Add logo placeholder
    if (entity.logo) {
      // Draw logo background
      doc.rect(450, 40, 100, 60);
      doc.fillAndStroke("#F0F0F0", "#CCCCCC");

      // Add logo text
      doc.font("Helvetica");
      doc.fontSize(10);
      doc.fillColor("#666666");
      doc.text("LOGO", 475, 65, { align: "center" });
    }
  }

  /**
   * Generate customer information section
   */
  static generateCustomerInfo(doc, customer) {
    if (!customer) {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#999999")
        .text("Customer information not available", 300, 160);
      return;
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#1A3C34")
      .text("Bill To:", 400, 160)
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#4A4A4A")
      .text(customer.name || "Customer Name", 400, 180)
      .text(customer.address || "Customer Address", 400, 195)
      .text(`Phone: ${customer.phone || "N/A"}`, 400, 210)
      .text(`Email: ${customer.email || "N/A"}`, 400, 225);
  }

  /**
   * Generate invoice details section
   */
  static generateInvoiceDetails(doc, invoice) {
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#1A3C34")
      .text("Invoice Details", 40, 300)
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#4A4A4A")
      .text(`Payment Terms: ${invoice.paymentTerms || "Net 30"}`, 40, 320)
      .text(
        `Notes: ${invoice.notes || "Thank you for your business!"}`,
        40,
        335,
        { width: 500, align: "left" }
      );
  }

  /**
   * Generate items table with improved styling
   */
  static generateItemsTable(doc, invoice) {
    const startY = 380;
    const tableWidth = 515;
    const columnWidths = [150, 200, 30, 80, 55]; // Qty: 30, Unit Price: 80
    const headers = ["Item", "Description", "Qty", "Unit Price", "Amount"];

    // Check for valid items
    if (!invoice.items?.length) {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#999999")
        .text("No items found", 40, startY + 30, { align: "center" });
      return;
    }

    // Table header
    doc.rect(40, startY, tableWidth, 25);
    doc.fill("#1A3C34");
    doc.font("Helvetica-Bold");
    doc.fontSize(10);
    doc.fillColor("#FFFFFF");

    headers.forEach((header, i) => {
      doc.text(
        header,
        42 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0),
        startY + 8
      );
    });

    // Table rows with dynamic height and text wrapping
    let currentY = startY + 25;
    invoice.items.forEach((item, index) => {
      // Calculate dynamic row height based on content
      const itemName = item.name || "Item";
      const itemDescription = item.description || "-";

      // Estimate row height based on text length (rough calculation)
      const nameLines = Math.ceil(itemName.length / 25); // ~25 chars per line
      const descLines = Math.ceil(itemDescription.length / 35); // ~35 chars per line
      const maxLines = Math.max(nameLines, descLines, 1);
      const rowHeight = Math.max(25, maxLines * 15); // Minimum 25, 15 per line

      // Alternate row colors
      if (index % 2 === 0) {
        doc.rect(40, currentY, tableWidth, rowHeight);
        doc.fill("#F5F6F5");
      }

      // Set text properties
      doc.font("Helvetica");
      doc.fontSize(9);
      doc.fillColor("#333333");

      // Calculate column positions to match headers exactly
      const col1X = 42; // Item column (matches header position)
      const col2X = 42 + columnWidths[0]; // Description column
      const col3X = 42 + columnWidths[0] + columnWidths[1]; // Qty column
      const col4X = 42 + columnWidths[0] + columnWidths[1] + columnWidths[2]; // Unit Price column
      const col5X =
        42 +
        columnWidths[0] +
        columnWidths[1] +
        columnWidths[2] +
        columnWidths[3]; // Amount column

      // Item name with wrapping
      doc.text(itemName, col1X, currentY + 8, {
        width: columnWidths[0] - 4,
        height: rowHeight - 8,
        ellipsis: true,
      });

      // Description with wrapping
      doc.text(itemDescription, col2X, currentY + 8, {
        width: columnWidths[1] - 4,
        height: rowHeight - 8,
        ellipsis: true,
      });

      // Quantity (right-aligned)
      doc.text(item.quantity?.toString() || "0", col3X, currentY + 8, {
        width: columnWidths[2] - 4,
        align: "right",
      });

      // Unit Price (right-aligned)
      doc.text(
        (item.unitPrice || 0).toLocaleString("en-NG"),
        col4X,
        currentY + 8,
        { width: columnWidths[3] - 4, align: "right" }
      );

      // Total Amount (right-aligned)
      doc.text(
        ((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString("en-NG"),
        col5X,
        currentY + 8,
        { width: columnWidths[4] - 4, align: "right" }
      );

      currentY += rowHeight;
    });

    // Table border
    doc.strokeColor("#CCCCCC");
    doc.lineWidth(0.5);
    doc.rect(40, startY, tableWidth, currentY - startY);
    doc.stroke();

    // Store table end position for totals section
    this.tableEndY = currentY;
  }

  /**
   * Generate totals section with payment QR code
   */
  static async generateTotals(doc, invoice) {
    const startY = this.tableEndY + 40; // Increased spacing from table
    const rightAlign = 400;

    const subtotal =
      invoice.items?.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
        0
      ) || 0;
    const taxRate = invoice.taxRate / 100 || 0.075; // Default 7.5% VAT
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    doc.font("Helvetica");
    doc.fontSize(11);
    doc.fillColor("#4A4A4A");
    doc.text("Subtotal:", rightAlign, startY);
    doc.text(subtotal.toLocaleString("en-NG"), rightAlign + 80, startY); // Increased spacing

    if (tax > 0) {
      doc.text(
        `VAT (${(taxRate * 100).toFixed(1)}%):`,
        rightAlign,
        startY + 25 // Increased spacing
      );
      doc.text(tax.toLocaleString("en-NG"), rightAlign + 80, startY + 25); // Increased spacing
    }

    doc.font("Helvetica-Bold");
    doc.fontSize(13);
    doc.fillColor("#1A3C34");
    doc.text("Total:", rightAlign, startY + 50); // Increased spacing
    doc.text(total.toLocaleString("en-NG"), rightAlign + 80, startY + 50); // Increased spacing

    invoice.paymentLink = `${process.env.BACKEND_URL}/invoice/${invoice.invoiceNumber}/initiate-payment`;

    // Add payment QR code if link exists
    if (invoice.paymentLink) {
      try {
        // Generate QR code synchronously to avoid callback issues
        const qrDataUrl = await QRCode.toDataURL(invoice.paymentLink, {
          width: 80,
          margin: 2,
          color: {
            dark: "#1A3C34",
            light: "#FFFFFF",
          },
        });

        doc.image(qrDataUrl, 40, startY, { width: 80 });
        doc.font("Helvetica");
        doc.fontSize(10);
        doc.fillColor("#0066CC");

        // Add clickable link
        const linkText = "Scan to Pay";
        const linkWidth = doc.widthOfString(linkText);
        const linkX = 40 + (80 - linkWidth) / 2; // Center the text under QR code

        doc.text(linkText, linkX, startY + 85);

        // Add clickable link annotation
        doc.link(linkX, startY + 85, linkWidth, 12, invoice.paymentLink);
      } catch (qrError) {
        console.warn("QR code generation failed:", qrError.message);
        // Fallback: just show the payment link text as clickable
        doc.font("Helvetica");
        doc.fontSize(10);
        doc.fillColor("#0066CC");
        doc.text("Payment Link:", 40, startY + 10);

        // Make the payment URL clickable
        const paymentLinkText = invoice.paymentLink;
        const linkWidth = doc.widthOfString(paymentLinkText);
        doc.text(paymentLinkText, 40, startY + 25, {
          width: 200,
          align: "left",
        });

        // Add clickable link annotation
        doc.link(
          40,
          startY + 25,
          Math.min(linkWidth, 200),
          12,
          invoice.paymentLink
        );
      }
    }
  }

  /**
   * Generate footer with contact info and page numbers
   */
  static generateFooter(doc, entity, invoice) {
    const footerY = 750;
    doc.font("Helvetica");
    doc.fontSize(10);
    doc.fillColor("#999999");
    doc.text(
      `Thank you for your business! Contact us at ${entity.email || "N/A"}`,
      40,
      footerY,
      { align: "center" }
    );
    doc.text(
      `Generated on ${new Date().toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
      })}`,
      40,
      footerY + 15,
      { align: "center" }
    );

    // Add page numbers
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#999999")
        .text(`Page ${i + 1} of ${pageCount}`, 40, 800, { align: "center" });
    }
  }

  /**
   * Get status color for invoice status
   * @param {string} status - Invoice status
   * @returns {string} Color hex code
   */
  static getStatusColor(status) {
    const colors = {
      draft: "#6B7280",
      sent: "#0EA5E9",
      paid: "#22C55E",
      overdue: "#EF4444",
      cancelled: "#6B7280",
      partially_paid: "#F59E0B",
    };
    return colors[status.toLowerCase()] || "#6B7280";
  }

  /**
   * Generate invoice PDF buffer for download
   * @param {string} invoiceId - Invoice ID
   * @param {string} entityId - Entity ID
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async generateInvoicePDFBuffer(invoiceId, entityId) {
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

      // Generate PDF
      const pdfBuffer = await this.generateInvoicePDF(
        invoice,
        entity,
        invoice.customer,
        entity.subscriptionPlan
      );

      return pdfBuffer;
    } catch (error) {
      console.error("PDF Generation Error:", {
        invoiceId,
        entityId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }
}

module.exports = PDFService;
