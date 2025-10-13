const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

class PDFServiceTemplate3 {
  static async generateInvoicePDF(invoice, entity, customer, subscriptionPlan) {
    if (!invoice || !entity || !customer) {
      throw new Error(
        "Missing required parameters: invoice, entity, or customer"
      );
    }

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 45,
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

        this.addWatermark(doc, subscriptionPlan);
        await this.generateInvoiceContent(doc, invoice, entity, customer);
        doc.end();
      } catch (error) {
        reject(new Error(`Failed to generate PDF: ${error.message}`));
      }
    });
  }

  static addWatermark(doc, subscriptionPlan) {
    if (!subscriptionPlan || subscriptionPlan.name?.toLowerCase() === "free") {
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;

      doc.save();
      doc.font("Helvetica").fontSize(70).fillColor("#E5E7EB").opacity(0.2);
      doc.rotate(-45, { origin: [centerX, centerY] });
      doc.text("TRIAL MODE", centerX, centerY, { align: "center" });
      doc.restore();
    }
  }

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

  static generateHeader(doc, invoice, entity) {
    doc.rect(0, 0, 595.28, 100).fill("#111827").stroke("#111827");
    doc
      .font("Helvetica-Bold")
      .fontSize(30)
      .fillColor("#FFFFFF")
      .text("INVOICE", 45, 35, { align: "center" });
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#D1D5DB")
      .text(`Currency: ${invoice.currency || "NGN"}`, 45, 70, {
        align: "center",
      });

    const detailsX = 400;
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#374151")
      .text(`Invoice #: ${invoice.invoiceNumber || "INV-0000"}`, detailsX, 120)
      .text(
        `Date: ${
          invoice.issueDate
            ? new Date(invoice.issueDate).toLocaleDateString("en-NG", {
                dateStyle: "medium",
              })
            : "N/A"
        }`,
        detailsX,
        140
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
        160
      );

    const lifecycleStatus = (invoice.status || "draft").toLowerCase();
    const paymentStatus = (invoice.paymentStatus || "unpaid").toLowerCase();
    const displayStatus =
      lifecycleStatus === "published" ? paymentStatus : lifecycleStatus;

    doc
      .roundedRect(detailsX, 180, 100, 25, 3)
      .fillAndStroke(this.getStatusColor(displayStatus), "#111827");
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#FFFFFF")
      .text(displayStatus.toUpperCase(), detailsX + 50, 188, {
        align: "center",
      });
  }

  static generateBusinessInfo(doc, entity) {
    if (!entity) {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#9CA3AF")
        .text("Business information not available", 45, 220);
      return;
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#111827")
      .text("From:", 45, 220)
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#374151")
      .text(entity.name || "Business Name", 45, 240)
      .text(entity.address || "Business Address", 45, 255)
      .text(`Phone: ${entity.phone || "N/A"}`, 45, 270)
      .text(`Email: ${entity.email || "N/A"}`, 45, 285);

    if (entity.logo) {
      doc.roundedRect(450, 120, 100, 70, 3).fillAndStroke("#F9FAFB", "#D1D5DB");
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#6B7280")
        .text("LOGO", 475, 150, { align: "center" });
    }
  }

  static generateCustomerInfo(doc, customer) {
    if (!customer) {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#9CA3AF")
        .text("Customer information not available", 300, 220);
      return;
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#111827")
      .text("Bill To:", 300, 220)
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#374151")
      .text(customer.name || "Customer Name", 300, 240)
      .text(customer.address || "Customer Address", 300, 255)
      .text(`Phone: ${customer.phone || "N/A"}`, 300, 270)
      .text(`Email: ${customer.email || "N/A"}`, 300, 285);
  }

  static generateInvoiceDetails(doc, invoice) {
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#111827")
      .text("Invoice Details", 45, 320)
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#374151")
      .text(`Payment Terms: ${invoice.paymentTerms || "Net 30"}`, 45, 340)
      .text(
        `Notes: ${invoice.notes || "Thank you for your business!"}`,
        45,
        355,
        { width: 500, align: "left" }
      );
  }

  static generateItemsTable(doc, invoice) {
    const startY = 400;
    const tableWidth = 505;
    const columnWidths = [150, 200, 30, 80, 55];
    const headers = ["Item", "Description", "Qty", "Unit Price", "Amount"];

    if (!invoice.items?.length) {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#9CA3AF")
        .text("No items found", 45, startY + 30, { align: "center" });
      return;
    }

    doc.roundedRect(45, startY, tableWidth, 25, 3).fill("#111827");
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#FFFFFF");
    headers.forEach((header, i) => {
      doc.text(
        header,
        47 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0),
        startY + 8
      );
    });

    let currentY = startY + 25;
    invoice.items.forEach((item, index) => {
      const itemName = item.name || "Item";
      const itemDescription = item.description || "-";
      const nameLines = Math.ceil(itemName.length / 25);
      const descLines = Math.ceil(itemDescription.length / 35);
      const maxLines = Math.max(nameLines, descLines, 1);
      const rowHeight = Math.max(25, maxLines * 15);

      if (index % 2 === 0) {
        doc.roundedRect(45, currentY, tableWidth, rowHeight, 3).fill("#F3F4F6");
      }

      doc.font("Helvetica").fontSize(9).fillColor("#111827");
      const col1X = 47;
      const col2X = 47 + columnWidths[0];
      const col3X = 47 + columnWidths[0] + columnWidths[1];
      const col4X = 47 + columnWidths[0] + columnWidths[1] + columnWidths[2];
      const col5X =
        47 +
        columnWidths[0] +
        columnWidths[1] +
        columnWidths[2] +
        columnWidths[3];

      doc.text(itemName, col1X, currentY + 8, {
        width: columnWidths[0] - 4,
        height: rowHeight - 8,
        ellipsis: true,
      });
      doc.text(itemDescription, col2X, currentY + 8, {
        width: columnWidths[1] - 4,
        height: rowHeight - 8,
        ellipsis: true,
      });
      doc.text(item.quantity?.toString() || "0", col3X, currentY + 8, {
        width: columnWidths[2] - 4,
        align: "right",
      });
      doc.text(
        (item.unitPrice || 0).toLocaleString("en-NG"),
        col4X,
        currentY + 8,
        { width: columnWidths[3] - 4, align: "right" }
      );
      doc.text(
        ((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString("en-NG"),
        col5X,
        currentY + 8,
        { width: columnWidths[4] - 4, align: "right" }
      );

      currentY += rowHeight;
    });

    doc
      .strokeColor("#D1D5DB")
      .lineWidth(0.5)
      .roundedRect(45, startY, tableWidth, currentY - startY, 3)
      .stroke();
    this.tableEndY = currentY;
  }

  static async generateTotals(doc, invoice) {
    const startY = this.tableEndY + 40;
    const rightAlign = 390;

    const subtotal =
      invoice.items?.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
        0
      ) || 0;
    const taxRate = invoice.taxRate / 100 || 0.075;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    doc.font("Helvetica").fontSize(11).fillColor("#374151");
    doc.text("Subtotal:", rightAlign, startY);
    doc.text(subtotal.toLocaleString("en-NG"), rightAlign + 90, startY);
    if (tax > 0) {
      doc.text(
        `VAT (${(taxRate * 100).toFixed(1)}%):`,
        rightAlign,
        startY + 20
      );
      doc.text(tax.toLocaleString("en-NG"), rightAlign + 90, startY + 20);
    }
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#111827");
    doc.text("Total:", rightAlign, startY + 40);
    doc.text(total.toLocaleString("en-NG"), rightAlign + 90, startY + 40);

    invoice.paymentLink = `${process.env.BACKEND_URL}/invoice/${invoice.invoiceNumber}/initiate-payment`;
    if (invoice.paymentLink) {
      try {
        const qrDataUrl = await QRCode.toDataURL(invoice.paymentLink, {
          width: 85,
          margin: 2,
          color: { dark: "#111827", light: "#FFFFFF" },
        });
        doc.image(qrDataUrl, 45, startY, { width: 85 });
        doc.font("Helvetica").fontSize(10).fillColor("#1D4ED8");
        const linkText = "Scan to Pay";
        const linkWidth = doc.widthOfString(linkText);
        const linkX = 45 + (85 - linkWidth) / 2;
        doc.text(linkText, linkX, startY + 90);
        doc.link(linkX, startY + 90, linkWidth, 12, invoice.paymentLink);
      } catch (qrError) {
        console.warn("QR code generation failed:", qrError.message);
        doc.font("Helvetica").fontSize(10).fillColor("#1D4ED8");
        doc.text("Payment Link:", 45, startY + 10);
        const paymentLinkText = invoice.paymentLink;
        const linkWidth = doc.widthOfString(paymentLinkText);
        doc.text(paymentLinkText, 45, startY + 25, {
          width: 200,
          align: "left",
        });
        doc.link(
          45,
          startY + 25,
          Math.min(linkWidth, 200),
          12,
          invoice.paymentLink
        );
      }
    }
  }

  static generateFooter(doc, entity, invoice) {
    const footerY = 750;
    doc.rect(0, footerY, 595.28, 70).fill("#111827").stroke("#111827");
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#D1D5DB")
      .text(
        `Thank you for your business! Contact us at ${entity.email || "N/A"}`,
        45,
        footerY + 20,
        { align: "center" }
      )
      .text(
        `Generated on ${new Date().toLocaleString("en-NG", {
          dateStyle: "medium",
          timeStyle: "short",
        })}`,
        45,
        footerY + 40,
        { align: "center" }
      );

    const pageCount = doc.bufferedPageRange().count;
    for (let i = 1; i <= pageCount; i++) {
      doc.switchToPage(i);
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#D1D5DB")
        .text(`Page ${i} of ${pageCount}`, 45, 800, { align: "center" });
    }
  }

  static getStatusColor(status) {
    const colors = {
      draft: "#6B7280",
      sent: "#3B82F6",
      published: "#2563EB",
      unpaid: "#6B7280",
      paid: "#10B981",
      overdue: "#EF4444",
      "partially-paid": "#F59E0B",
      cancelled: "#6B7280",
      partially_paid: "#F59E0B",
    };
    return colors[status.toLowerCase()] || "#6B7280";
  }

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

module.exports = PDFServiceTemplate3;
