const PDFDocument = require('pdfkit');
const fs = require('fs');

// Sample data for 3 invoices
const invoices = [
    {
        businessName: "TechCorp Solutions",
        logoPath: "logo.png", // Path to your logo file
        address: "123 Anywhere St., Any City",
        phone: "123-456-7890",
        invoiceNumber: "INV-001",
        date: "April 10, 2025",
        customer: {
            name: "John Doe",
            address: "123 Anywhere St., Any City, ST 12345",
            email: "john.doe@example.com"
        },
        items: [
            { description: "Wireless Mouse", quantity: 2, price: 25.00 },
            { description: "Mechanical Keyboard", quantity: 1, price: 75.00 }
        ],
        vatRate: 0.20,
        paymentLink: "https://techcorp.com/pay/INV-001"
    },
    {
        businessName: "GreenLeaf Retail",
        logoPath: "logo.png",
        address: "456 Oak Ave, Green Town",
        phone: "123-456-7890",
        invoiceNumber: "INV-002",
        date: "April 10, 2025",
        customer: {
            name: "Jane Smith",
            address: "456 Oak Ave, Green Town, GT 67890",
            email: "jane.smith@example.com"
        },
        items: [
            { description: "Organic T-Shirt", quantity: 3, price: 15.00 },
            { description: "Eco Backpack", quantity: 1, price: 45.00 }
        ],
        vatRate: 0.20,
        paymentLink: "https://greenleaf.com/pay/INV-002"
    },
    {
        businessName: "BlueWave Services",
        logoPath: "logo.png",
        address: "789 Pine Rd, Blue City",
        phone: "123-456-7890",
        invoiceNumber: "INV-003",
        date: "April 10, 2025",
        customer: {
            name: "Mike Johnson",
            address: "789 Pine Rd, Blue City, BC 24680",
            email: "mike.johnson@example.com"
        },
        items: [
            { description: "Consulting Hour", quantity: 5, price: 50.00 },
            { description: "Software License", quantity: 1, price: 150.00 }
        ],
        vatRate: 0.20,
        paymentLink: "https://bluewave.com/pay/INV-003"
    }
];

function generateInvoice(invoice, filename) {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(fs.createWriteStream(filename));

    // Add a page border
    doc.lineWidth(1)
       .strokeColor('#ddd')
       .rect(30, 30, 535, 782) // A4 dimensions (595x842) minus margins
       .stroke();

    // Add a subtle watermark (e.g., "DRAFT")
    doc.font('Helvetica')
       .fontSize(50)
       .fillColor('#000')
       .fillOpacity(0.1) // Make it semi-transparent
       .rotate(-45, { origin: [297.5, 421] }) // Rotate 45 degrees, centered on A4 page
       .text('DRAFT', 297.5, 421, { align: 'center' })
       .rotate(45, { origin: [297.5, 421] }); // Rotate back to normal

    // Header: INVOICE on the left, Logo on the right
    doc.font('Helvetica-Bold')
       .fontSize(36)
       .fillColor('#2F4F4F') // Dark slate gray
       .fillOpacity(1) // Reset opacity for the rest of the document
       .text('INVOICE', 40, 40);

    // Add the logo in the top-right corner
    if (fs.existsSync(invoice.logoPath)) {
        doc.image(invoice.logoPath, 450, 40, { width: 50 });
    } else {
        doc.font('Helvetica')
           .fontSize(12)
           .fillColor('red')
           .text('Logo Not Found', 450, 40, { align: 'right' });
    }

    // Business Name below "INVOICE"
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor('#666')
       .text(invoice.businessName, 40, 80);

    // Details Section: Issued To and Invoice Info
    doc.fontSize(12)
       .fillColor('#333');

    // Issued To
    doc.font('Helvetica-Bold')
       .text('ISSUED TO', 40, 120);

    doc.font('Helvetica')
       .text(invoice.customer.name, 40, 140)
       .font('Helvetica-Bold')
       .text(invoice.customer.email, 40, 160)
       .font('Helvetica')
       .text(invoice.customer.address, 40, 180);

    // Invoice Info (right-aligned)
    doc.font('Helvetica')
       .text(`INVOICE ${invoice.invoiceNumber}`, 0, 120, { align: 'right' })
       .text(`DATE ISSUED ${invoice.date}`, 0, 140, { align: 'right' });

    // Items Section: Description and Fees
    let yPosition = 230;
    doc.font('Helvetica-Bold')
       .text('DESCRIPTION', 40, yPosition);

    doc.moveTo(40, yPosition + 15)
       .lineTo(555, yPosition + 15)
       .stroke();

    yPosition += 30;

    let subtotal = 0;
    invoice.items.forEach(item => {
        const total = item.quantity * item.unitPrice;
        subtotal += total;

        doc.font('Helvetica')
           .text(item.description, 40, yPosition)
           .text(`$${total.toFixed(2)}`, 0, yPosition, { align: 'right' });

        yPosition += 20;

        doc.moveTo(40, yPosition)
           .lineTo(555, yPosition)
           .stroke();

        yPosition += 10;
    });

    // Total Section
    doc.fontSize(12)
       .font('Helvetica')
       .text(`SUB TOTAL $${subtotal.toFixed(2)}`, 0, yPosition + 20, { align: 'right' });

    const vat = subtotal * invoice.vatRate;
    doc.text(`TAX $${vat.toFixed(2)}`, 0, yPosition + 40, { align: 'right' });

    const grandTotal = subtotal + vat;
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .text(`TOTAL $${grandTotal.toFixed(2)}`, 0, yPosition + 60, { align: 'right' });

    // Payment Details Section
    yPosition += 100;
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .text('PAYMENT DETAILS :', 40, yPosition);

    doc.moveTo(40, yPosition + 15)
       .lineTo(555, yPosition + 15)
       .stroke();

    yPosition += 30;
    doc.font('Helvetica')
       .fontSize(12)
       .text(invoice.address, 40, yPosition)
       .text(`Bank Code: ${invoice.phone}`, 40, yPosition + 20)
       .text('Bank Name: Salford & Co', 40, yPosition + 40)
       .text(`www.${invoice.businessName.toLowerCase().replace(/\s/g, '')}.com`, 40, yPosition + 60)
       .text(`+${invoice.phone}`, 40, yPosition + 80)
       .fillColor('blue')
       .text('Pay Now', 40, yPosition + 100, { link: invoice.paymentLink, underline: true });

    doc.end();
}

// Generate all three invoices

module.exports = { generateInvoice };