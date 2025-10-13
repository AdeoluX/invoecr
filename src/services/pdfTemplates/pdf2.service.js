const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

class PDFServiceTemplate2 {
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
          margin: 60,
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
      doc.font("Courier-Bold").fontSize(50).fillColor("#D1D5DB").opacity(0.4);
      doc.rotate(-45, { origin: [centerX, centerY] });
      doc.text("FREE PLAN", centerX, centerY, { align: "center" });
      doc.restore();
    }
  }

  static async generateInvoiceContent(doc, invoice, entity, customer) {
    doc.registerFont("Courier", "Courier");
    doc.registerFont("Courier-Bold", "Courier-Bold");

    this.generateHeader(doc, invoice, entity);
    this.generateBusinessInfo(doc, entity);
    this.generateCustomerInfo(doc, customer);
    this.generateInvoiceDetails(doc, invoice);
    this.generateItemsTable(doc, invoice);
    await this.generateTotals(doc, invoice);
    this.generateFooter(doc, entity, invoice);
  }

  static generateHeader(doc, invoice, entity) {
    doc.rect(0, 0, 595.28, 80).fill("#1F2937");
    doc
      .font("Courier-Bold")
      .fontSize(28)
      .fillColor("#FFFFFF")
      .text("INVOICE", 60, 30, { align: "left" });
    doc
      .font("Courier")
      .fontSize(12)
      .fillColor("#E5E7EB")
      .text(`Currency: ${invoice.currency || "NGN"}`, 60, 60);

    const detailsX = 380;
    doc
      .font("Courier")
      .fontSize(12)
      .fillColor("#4B5563")
      .text(`Invoice #: ${invoice.invoiceNumber || "INV-0000"}`, detailsX, 100)
      .text(
        `Date: ${
          invoice.issueDate
            ? new Date(invoice.issueDate).toLocaleDateString("en-NG", {
                dateStyle: "medium",
              })
            : "N/A"
        }`,
        detailsX,
        120
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
        140
      );

    const lifecycleStatus = (invoice.status || "draft").toLowerCase();
    const paymentStatus = (invoice.paymentStatus || "unpaid").toLowerCase();
    const displayStatus =
      lifecycleStatus === "published" ? paymentStatus : lifecycleStatus;

    doc
      .roundedRect(detailsX, 160, 120, 30, 5)
      .fillAndStroke(this.getStatusColor(displayStatus), "#1F2937");
    doc
      .font("Courier-Bold")
      .fontSize(12)
      .fillColor("#FFFFFF")
      .text(displayStatus.toUpperCase(), detailsX + 60, 170, {
        align: "center",
      });
  }

  static generateBusinessInfo(doc, entity) {
    if (!entity) {
      doc
        .font("Courier")
        .fontSize(12)
        .fillColor("#9CA3AF")
        .text("Business information not available", 60, 220);
      return;
    }

    doc
      .font("Courier-Bold")
      .fontSize(14)
      .fillColor("#1F2937")
      .text("From:", 60, 220)
      .font("Courier")
      .fontSize(12)
      .fillColor("#4B5563")
      .text(entity.name || "Business Name", 60, 240)
      .text(entity.address || "Business Address", 60, 260)
      .text(`Phone: ${entity.phone || "N/A"}`, 60, 280)
      .text(`Email: ${entity.email || "N/A"}`, 60, 300);

    if (entity.logo) {
      doc.roundedRect(450, 100, 100, 80, 5).fillAndStroke("#F3F4F6", "#D1D5DB");
      doc
        .font("Courier")
        .fontSize(10)
        .fillColor("#6B7280")
        .text("LOGO", 475, 135, { align: "center" });
    }
  }

  static generateCustomerInfo(doc, customer) {
    if (!customer) {
      doc
        .font("Courier")
        .fontSize(12)
        .fillColor("#9CA3AF")
        .text("Customer information not available", 300, 220);
      return;
    }

    doc
      .font("Courier-Bold")
      .fontSize(14)
      .fillColor("#1F2937")
      .text("Bill To:", 300, 220)
      .font("Courier")
      .fontSize(12)
      .fillColor("#4B5563")
      .text(customer.name || "Customer Name", 300, 240)
      .text(customer.address || "Customer Address", 300, 260)
      .text(`Phone: ${customer.phone || "N/A"}`, 300, 280)
      .text(`Email: ${customer.email || "N/A"}`, 300, 300);
  }

  static generateInvoiceDetails(doc, invoice) {
    doc
      .font("Courier-Bold")
      .fontSize(14)
      .fillColor("#1F2937")
      .text("Invoice Details", 60, 340)
      .font("Courier")
      .fontSize(12)
      .fillColor("#4B5563")
      .text(`Payment Terms: ${invoice.paymentTerms || "Net 30"}`, 60, 360)
      .text(
        `Notes: ${invoice.notes || "Thank you for your business!"}`,
        60,
        380,
        { width: 475, align: "left" }
      );
  }

  static generateItemsTable(doc, invoice) {
    const startY = 420;
    const tableWidth = 475;
    const columnWidths = [140, 190, 30, 80, 55];
    const headers = ["Item", "Description", "Qty", "Unit Price", "Amount"];

    if (!invoice.items?.length) {
      doc
        .font("Courier")
        .fontSize(12)
        .fillColor("#9CA3AF")
        .text("No items found", 60, startY + 30, { align: "center" });
      return;
    }

    doc.roundedRect(60, startY, tableWidth, 30, 5).fill("#1F2937");
    doc.font("Courier-Bold").fontSize(11).fillColor("#FFFFFF");
    headers.forEach((header, i) => {
      doc.text(
        header,
        62 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0),
        startY + 10
      );
    });

    let currentY = startY + 30;
    invoice.items.forEach((item, index) => {
      const itemName = item.name || "Item";
      const itemDescription = item.description || "-";
      const nameLines = Math.ceil(itemName.length / 25);
      const descLines = Math.ceil(itemDescription.length / 35);
      const maxLines = Math.max(nameLines, descLines, 1);
      const rowHeight = Math.max(30, maxLines * 15);

      if (index % 2 === 0) {
        doc.roundedRect(60, currentY, tableWidth, rowHeight, 5).fill("#F9FAFB");
      }

      doc.font("Courier").fontSize(10).fillColor("#1F2937");
      const col1X = 62;
      const col2X = 62 + columnWidths[0];
      const col3X = 62 + columnWidths[0] + columnWidths[1];
      const col4X = 62 + columnWidths[0] + columnWidths[1] + columnWidths[2];
      const col5X =
        62 +
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
      .roundedRect(60, startY, tableWidth, currentY - startY, 5)
      .stroke();
    this.tableEndY = currentY;
  }

  static async generateTotals(doc, invoice) {
    const startY = this.tableEndY + 50;
    const rightAlign = 380;

    const subtotal =
      invoice.items?.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
        0
      ) || 0;
    const taxRate = invoice.taxRate / 100 || 0.075;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    doc.font("Courier").fontSize(12).fillColor("#4B5563");
    doc.text("Subtotal:", rightAlign, startY);
    doc.text(subtotal.toLocaleString("en-NG"), rightAlign + 100, startY);
    if (tax > 0) {
      doc.text(
        `VAT (${(taxRate * 100).toFixed(1)}%):`,
        rightAlign,
        startY + 30
      );
      doc.text(tax.toLocaleString("en-NG"), rightAlign + 100, startY + 30);
    }
    doc.font("Courier-Bold").fontSize(14).fillColor("#1F2937");
    doc.text("Total:", rightAlign, startY + 60);
    doc.text(total.toLocaleString("en-NG"), rightAlign + 100, startY + 60);

    invoice.paymentLink = `${process.env.BACKEND_URL}/invoice/${invoice.invoiceNumber}/initiate-payment`;
    if (invoice.paymentLink) {
      try {
        const qrDataUrl = await QRCode.toDataURL(invoice.paymentLink, {
          width: 90,
          margin: 2,
          color: { dark: "#1F2937", light: "#FFFFFF" },
        });
        doc.image(qrDataUrl, 60, startY, { width: 90 });
        doc.font("Courier").fontSize(10).fillColor("#2563EB");
        const linkText = "Scan to Pay";
        const linkWidth = doc.widthOfString(linkText);
        const linkX = 60 + (90 - linkWidth) / 2;
        doc.text(linkText, linkX, startY + 100);
        doc.link(linkX, startY + 100, linkWidth, 12, invoice.paymentLink);
      } catch (qrError) {
        console.warn("QR code generation failed:", qrError.message);
        doc.font("Courier").fontSize(10).fillColor("#2563EB");
        doc.text("Payment Link:", 60, startY + 10);
        const paymentLinkText = invoice.paymentLink;
        const linkWidth = doc.widthOfString(paymentLinkText);
        doc.text(paymentLinkText, 60, startY + 25, {
          width: 200,
          align: "left",
        });
        doc.link(
          60,
          startY + 25,
          Math.min(linkWidth, 200),
          12,
          invoice.paymentLink
        );
      }
    }
  }

  static generateFooter(doc, entity, invoice) {
    const footerY = 740;
    doc.rect(0, footerY, 595.28, 80).fill("#1F2937");
    doc
      .font("Courier")
      .fontSize(10)
      .fillColor("#E5E7EB")
      .text(
        `Thank you for your business! Contact us at ${entity.email || "N/A"}`,
        60,
        footerY + 20,
        { align: "center" }
      )
      .text(
        `Generated on ${new Date().toLocaleString("en-NG", {
          dateStyle: "medium",
          timeStyle: "short",
        })}`,
        60,
        footerY + 40,
        { align: "center" }
      );

    const pageCount = doc.bufferedPageRange().count;
    for (let i = 1; i <= pageCount; i++) {
      doc.switchToPage(i);
      doc
        .font("Courier")
        .fontSize(9)
        .fillColor("#E5E7EB")
        .text(`Page ${i} of ${pageCount}`, 60, 790, { align: "center" });
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

module.exports = PDFServiceTemplate2;
