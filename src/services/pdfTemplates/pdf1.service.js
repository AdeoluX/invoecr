const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

class PDFServiceTemplate1 {
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
          margin: 50,
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
      doc.font("Times-Bold").fontSize(60).fillColor("#E6E6E6").opacity(0.3);
      doc.rotate(-45, { origin: [centerX, centerY] });
      doc.text("TRIAL VERSION", centerX, centerY, { align: "center" });
      doc.restore();
    }
  }

  static async generateInvoiceContent(doc, invoice, entity, customer) {
    doc.registerFont("Times-Roman", "Times-Roman");
    doc.registerFont("Times-Bold", "Times-Bold");

    this.generateHeader(doc, invoice, entity);
    this.generateBusinessInfo(doc, entity);
    this.generateCustomerInfo(doc, customer);
    this.generateInvoiceDetails(doc, invoice);
    this.generateItemsTable(doc, invoice);
    await this.generateTotals(doc, invoice);
    this.generateFooter(doc, entity, invoice);
  }

  static generateHeader(doc, invoice, entity) {
    doc
      .font("Times-Bold")
      .fontSize(32)
      .fillColor("#2D3748")
      .text("INVOICE", 50, 30, { align: "center" });
    doc
      .font("Times-Roman")
      .fontSize(12)
      .fillColor("#4A5568")
      .text(`Currency: ${invoice.currency || "NGN"}`, 50, 70, {
        align: "center",
      });

    const detailsX = 400;
    doc
      .font("Times-Roman")
      .fontSize(12)
      .fillColor("#4A5568")
      .text(`Invoice #: ${invoice.invoiceNumber || "INV-0000"}`, detailsX, 30)
      .text(
        `Date: ${
          invoice.issueDate
            ? new Date(invoice.issueDate).toLocaleDateString("en-NG", {
                dateStyle: "medium",
              })
            : "N/A"
        }`,
        detailsX,
        50
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
        70
      );

    const lifecycleStatus = (invoice.status || "draft").toLowerCase();
    const paymentStatus = (invoice.paymentStatus || "unpaid").toLowerCase();
    const displayStatus =
      lifecycleStatus === "published" ? paymentStatus : lifecycleStatus;

    doc
      .rect(detailsX, 90, 100, 30)
      .fillAndStroke(this.getStatusColor(displayStatus), "#2D3748");
    doc
      .font("Times-Bold")
      .fontSize(12)
      .fillColor("#FFFFFF")
      .text(displayStatus.toUpperCase(), detailsX + 50, 100, {
        align: "center",
      });
  }

  static generateBusinessInfo(doc, entity) {
    if (!entity) {
      doc
        .font("Times-Roman")
        .fontSize(12)
        .fillColor("#A0AEC0")
        .text("Business information not available", 50, 140);
      return;
    }

    doc
      .font("Times-Bold")
      .fontSize(16)
      .fillColor("#2D3748")
      .text("From:", 50, 140)
      .font("Times-Roman")
      .fontSize(12)
      .fillColor("#4A5568")
      .text(entity.name || "Business Name", 50, 160)
      .text(entity.address || "Business Address", 50, 180)
      .text(`Phone: ${entity.phone || "N/A"}`, 50, 200)
      .text(`Email: ${entity.email || "N/A"}`, 50, 220);

    if (entity.logo) {
      doc.rect(450, 30, 100, 80).fillAndStroke("#EDF2F7", "#CBD5E0");
      doc
        .font("Times-Roman")
        .fontSize(10)
        .fillColor("#718096")
        .text("LOGO", 475, 65, { align: "center" });
    }
  }

  static generateCustomerInfo(doc, customer) {
    if (!customer) {
      doc
        .font("Times-Roman")
        .fontSize(12)
        .fillColor("#A0AEC0")
        .text("Customer information not available", 300, 140);
      return;
    }

    doc
      .font("Times-Bold")
      .fontSize(16)
      .fillColor("#2D3748")
      .text("Bill To:", 300, 140)
      .font("Times-Roman")
      .fontSize(12)
      .fillColor("#4A5568")
      .text(customer.name || "Customer Name", 300, 160)
      .text(customer.address || "Customer Address", 300, 180)
      .text(`Phone: ${customer.phone || "N/A"}`, 300, 200)
      .text(`Email: ${customer.email || "N/A"}`, 300, 220);
  }

  static generateInvoiceDetails(doc, invoice) {
    doc
      .font("Times-Bold")
      .fontSize(16)
      .fillColor("#2D3748")
      .text("Invoice Details", 50, 280)
      .font("Times-Roman")
      .fontSize(12)
      .fillColor("#4A5568")
      .text(`Payment Terms: ${invoice.paymentTerms || "Net 30"}`, 50, 300)
      .text(
        `Notes: ${invoice.notes || "Thank you for your business!"}`,
        50,
        320,
        { width: 500, align: "left" }
      );
  }

  static generateItemsTable(doc, invoice) {
    const startY = 360;
    const tableWidth = 495;
    const columnWidths = [150, 200, 30, 80, 55];
    const headers = ["Item", "Description", "Qty", "Unit Price", "Amount"];

    if (!invoice.items?.length) {
      doc
        .font("Times-Roman")
        .fontSize(12)
        .fillColor("#A0AEC0")
        .text("No items found", 50, startY + 30, { align: "center" });
      return;
    }

    doc.rect(50, startY, tableWidth, 30).fill("#2D3748");
    doc.font("Times-Bold").fontSize(11).fillColor("#FFFFFF");
    headers.forEach((header, i) => {
      doc.text(
        header,
        52 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0),
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
        doc.rect(50, currentY, tableWidth, rowHeight).fill("#EDF2F7");
      }

      doc.font("Times-Roman").fontSize(10).fillColor("#2D3748");
      const col1X = 52;
      const col2X = 52 + columnWidths[0];
      const col3X = 52 + columnWidths[0] + columnWidths[1];
      const col4X = 52 + columnWidths[0] + columnWidths[1] + columnWidths[2];
      const col5X =
        52 +
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
      .strokeColor("#CBD5E0")
      .lineWidth(0.5)
      .rect(50, startY, tableWidth, currentY - startY)
      .stroke();
    this.tableEndY = currentY;
  }

  static async generateTotals(doc, invoice) {
    const startY = this.tableEndY + 50;
    const rightAlign = 400;

    const subtotal =
      invoice.items?.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
        0
      ) || 0;
    const taxRate = invoice.taxRate / 100 || 0.075;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    doc.font("Times-Roman").fontSize(12).fillColor("#4A5568");
    doc.text("Subtotal:", rightAlign, startY);
    doc.text(subtotal.toLocaleString("en-NG"), rightAlign + 100, startY);
    if (tax > 0) {
      doc.text(
        `VAT (${(taxRate * 100).toFixed(1)}%):`,
        rightAlign,
        startY + 25
      );
      doc.text(tax.toLocaleString("en-NG"), rightAlign + 100, startY + 25);
    }
    doc.font("Times-Bold").fontSize(14).fillColor("#2D3748");
    doc.text("Total:", rightAlign, startY + 50);
    doc.text(total.toLocaleString("en-NG"), rightAlign + 100, startY + 50);

    invoice.paymentLink = `${process.env.BACKEND_URL}/invoice/${invoice.invoiceNumber}/initiate-payment`;
    if (invoice.paymentLink) {
      try {
        const qrDataUrl = await QRCode.toDataURL(invoice.paymentLink, {
          width: 100,
          margin: 2,
          color: { dark: "#2D3748", light: "#FFFFFF" },
        });
        doc.image(qrDataUrl, 50, startY, { width: 100 });
        doc.font("Times-Roman").fontSize(10).fillColor("#3182CE");
        const linkText = "Scan to Pay";
        const linkWidth = doc.widthOfString(linkText);
        const linkX = 50 + (100 - linkWidth) / 2;
        doc.text(linkText, linkX, startY + 110);
        doc.link(linkX, startY + 110, linkWidth, 12, invoice.paymentLink);
      } catch (qrError) {
        console.warn("QR code generation failed:", qrError.message);
        doc.font("Times-Roman").fontSize(10).fillColor("#3182CE");
        doc.text("Payment Link:", 50, startY + 10);
        const paymentLinkText = invoice.paymentLink;
        const linkWidth = doc.widthOfString(paymentLinkText);
        doc.text(paymentLinkText, 50, startY + 25, {
          width: 200,
          align: "left",
        });
        doc.link(
          50,
          startY + 25,
          Math.min(linkWidth, 200),
          12,
          invoice.paymentLink
        );
      }
    }
  }

  static generateFooter(doc, entity, invoice) {
    const footerY = 760;
    doc
      .font("Times-Roman")
      .fontSize(10)
      .fillColor("#A0AEC0")
      .text(
        `Thank you for your business! Contact us at ${entity.email || "N/A"}`,
        50,
        footerY,
        { align: "center" }
      )
      .text(
        `Generated on ${new Date().toLocaleString("en-NG", {
          dateStyle: "medium",
          timeStyle: "short",
        })}`,
        50,
        footerY + 15,
        { align: "center" }
      );

    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc
        .font("Times-Roman")
        .fontSize(9)
        .fillColor("#A0AEC0")
        .text(`Page ${i + 1} of ${pageCount}`, 50, 810, { align: "center" });
    }
  }

  static getStatusColor(status) {
    const colors = {
      draft: "#718096",
      sent: "#63B3ED",
      published: "#4299E1",
      unpaid: "#718096",
      paid: "#48BB78",
      overdue: "#F56565",
      "partially-paid": "#ED8936",
      cancelled: "#718096",
      partially_paid: "#ED8936",
    };
    return colors[status.toLowerCase()] || "#718096";
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

module.exports = PDFServiceTemplate1;
