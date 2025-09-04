const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

class PDFService {
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
          margin: 40,
          autoFirstPage: true,
          info: {
            Title: `Invoice ${invoice.invoiceCode || "N/A"}`,
            Author: entity.name || "Unknown",
            CreationDate: new Date("2025-09-05T00:16:00Z"), // Updated to 12:16 AM WAT, September 05, 2025
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
      doc.font("Helvetica-Bold").fontSize(48).fillColor("#FFCCCC");
      doc.rotate(-45, centerX, centerY);
      doc.text("FREE TRIAL", centerX, centerY, { align: "center" });
      doc.restore();
    }
  }

  static async generateInvoiceContent(doc, invoice, entity, customer) {
    doc.registerFont("Helvetica", "Helvetica");
    doc.registerFont("Helvetica-Bold", "Helvetica-Bold");

    this.generateModernHeader(doc, invoice, entity);
    this.generateModernCustomerInfo(doc, customer);
    this.generateModernInvoiceDetails(doc, invoice);
    this.generateModernItemsTable(doc, invoice);
    await this.generateModernTotals(doc, invoice);
    this.generateModernFooter(doc, entity, invoice);
  }

  static generateModernHeader(doc, invoice, entity) {
    const logoX = 250;
    const logoY = 40;
    const logoSize = 40;

    doc.circle(logoX, logoY + logoSize / 2, logoSize / 2).fill("#F5F5DC");
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#4A4A4A")
      .text((entity.name || "C")[0].toUpperCase(), logoX - 5, logoY + 10, {
        align: "center",
      });
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#4A4A4A")
      .text(
        (entity.name || "THE CIRCLE").toUpperCase(),
        logoX - 60,
        logoY + 50,
        { align: "center" }
      );
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#999999")
      .text(entity.businessType || "DESIGN STUDIO", logoX - 60, logoY + 70, {
        align: "center",
      });
  }

  static generateModernCustomerInfo(doc, customer) {
    const startY = 140;
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#4A4A4A")
      .text("ISSUED TO:", 40, startY);
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#4A4A4A")
      .text(customer.name || "Olivia Smith", 40, startY + 20)
      .text(customer.companyName || "Really Great Company", 40, startY + 35)
      .text(customer.email || "hello@reallygreatsite.com", 40, startY + 50);
  }

  static generateModernInvoiceDetails(doc, invoice) {
    const startY = 140;
    const rightX = 350;
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#4A4A4A")
      .text("INVOICE NO:", rightX, startY)
      .text("DATE:", rightX, startY + 20);
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#4A4A4A")
      .text(invoice.invoiceCode || "#012345", rightX + 80, startY)
      .text(
        invoice.issueDate
          ? new Date(invoice.issueDate)
              .toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })
              .replace(/\//g, ".")
          : "12.06.2024",
        rightX + 80,
        startY + 20
      );
  }

  static generateModernItemsTable(doc, invoice) {
    const startY = 220;
    const tableWidth = 515;
    const columnWidths = [200, 100, 30, 100];
    const headers = ["DESCRIPTION", "UNIT PRICE", "QTY", "TOTAL"];

    if (!invoice.items?.length) {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#999999")
        .text("No items found", 40, startY + 30, { align: "center" });
      return;
    }

    // Header row
    doc.rect(40, startY, tableWidth, 25).fill("#F5F5DC");
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#4A4A4A");
    headers.forEach((header, i) => {
      const x = 40 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
      if (i === 0) {
        doc.text(header, x + 10, startY + 8);
      } else {
        doc.text(header, x + 10, startY + 8, { align: "right" });
      }
    });

    // Items
    let currentY = startY + 25;
    invoice.items.forEach((item) => {
      const rowHeight = 25;
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#4A4A4A")
        .text(item.name || "Item", 50, currentY + 8);
      doc.text(
        (item.unitPrice || 100).toLocaleString("en-US", {
          minimumFractionDigits: 0,
        }),
        250,
        currentY + 8,
        { align: "right" }
      );
      doc.text((item.quantity || 1).toString(), 350, currentY + 8, {
        align: "right",
      });
      const total = (item.quantity || 1) * (item.unitPrice || 100);
      doc.text(
        `$${total.toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
        450,
        currentY + 8,
        { align: "right" }
      );
      currentY += rowHeight;
    });

    // Border (removed total row since it's handled in generateModernTotals)
    doc
      .strokeColor("#CCCCCC")
      .lineWidth(0.5)
      .rect(40, startY, tableWidth, currentY - startY)
      .stroke();

    this.tableEndY = currentY;
  }

  static async generateModernTotals(doc, invoice) {
    const startY = this.tableEndY + 30;
    const rightAlign = 350;
    const subtotal =
      invoice.items?.reduce(
        (sum, item) => sum + (item.quantity || 1) * (item.unitPrice || 0),
        0
      ) || 0;
    const tax = subtotal * 0.1; // 10% tax as per image
    const total = subtotal + tax;

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#4A4A4A")
      .text("Total", rightAlign, startY)
      .text(
        `$${subtotal.toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
        rightAlign + 100,
        startY,
        { align: "right" }
      );
    doc
      .text("Tax", rightAlign, startY + 20)
      .text("10%", rightAlign + 100, startY + 20, { align: "right" });
    doc
      .text("Amount due", rightAlign, startY + 40)
      .text(
        `$${total.toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
        rightAlign + 100,
        startY + 40,
        { align: "right" }
      );
  }

  static generateModernFooter(doc, entity, invoice) {
    const footerY = 650;
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#4A4A4A")
      .text("BANK DETAILS", 40, footerY);
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#4A4A4A")
      .text("Borcele Bank", 40, footerY + 20)
      .text(`Account Name: ${entity.name || "Avery Davis"}`, 40, footerY + 35)
      .text(
        `Account No.: ${entity.bankAccount || "123-456-7890"}`,
        40,
        footerY + 50
      )
      .text(
        `Pay by: ${
          invoice.dueDate
            ? new Date(invoice.dueDate)
                .toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })
                .replace(/\//g, ".")
            : "05.07.2025"
        }`,
        40,
        footerY + 65
      );

    const rightX = 350;
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#4A4A4A")
      .text("THANK YOU", rightX, footerY);
    doc
      .font("Helvetica")
      .fontSize(24)
      .fillColor("#4A4A4A")
      .text("Thank You", rightX, footerY + 20, { align: "right" });
    // Simulate signature line
    doc
      .moveTo(rightX, footerY + 45)
      .lineTo(rightX + 100, footerY + 45)
      .stroke();
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
      const Entity = require("../models/entity.model");
      const entity = await Entity.findById(entityId).populate(
        "subscriptionPlan"
      );

      if (!invoice || !entity) {
        throw new Error("Invoice or entity not found");
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
      });
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }
}

module.exports = PDFService;
