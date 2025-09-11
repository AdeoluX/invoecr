const mongoose = require("mongoose");
require("dotenv").config();

// Import the invoice model
const Invoice = require("../models/invoice.model");

/**
 * Migration script to split invoice status into two separate fields:
 * - status: lifecycle status (draft, sent, published)
 * - paymentStatus: payment status (unpaid, paid, overdue, partially-paid)
 */
async function migrateInvoiceStatus() {
  try {
    console.log("🔄 Starting invoice status migration...");

    // Connect to database
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/invoice-generator"
    );
    console.log("✅ Connected to database");

    // Get all invoices with the old status structure
    const invoices = await Invoice.find({});
    console.log(`📊 Found ${invoices.length} invoices to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const invoice of invoices) {
      try {
        const oldStatus = invoice.status;
        let newStatus = oldStatus;
        let newPaymentStatus = "unpaid";

        // Map old status to new status structure
        switch (oldStatus) {
          case "draft":
          case "sent":
          case "published":
            newStatus = oldStatus;
            newPaymentStatus = "unpaid";
            break;
          case "paid":
            newStatus = "published"; // Assume paid invoices were published
            newPaymentStatus = "paid";
            break;
          case "overdue":
            newStatus = "published"; // Assume overdue invoices were published
            newPaymentStatus = "overdue";
            break;
          case "partially-paid":
            newStatus = "published"; // Assume partially paid invoices were published
            newPaymentStatus = "partially-paid";
            break;
          default:
            console.log(
              `⚠️ Unknown status: ${oldStatus} for invoice ${invoice.invoiceNumber}`
            );
            skippedCount++;
            continue;
        }

        // Update the invoice with new status structure
        await Invoice.findByIdAndUpdate(invoice._id, {
          status: newStatus,
          paymentStatus: newPaymentStatus,
        });

        migratedCount++;

        if (migratedCount % 100 === 0) {
          console.log(`📈 Migrated ${migratedCount} invoices...`);
        }
      } catch (error) {
        console.error(
          `❌ Error migrating invoice ${invoice.invoiceNumber}:`,
          error.message
        );
        skippedCount++;
      }
    }

    console.log("\n🎉 Migration completed!");
    console.log(`✅ Successfully migrated: ${migratedCount} invoices`);
    console.log(`⚠️ Skipped: ${skippedCount} invoices`);

    // Verify migration
    const verification = await Invoice.aggregate([
      {
        $group: {
          _id: {
            status: "$status",
            paymentStatus: "$paymentStatus",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.status": 1, "_id.paymentStatus": 1 } },
    ]);

    console.log("\n📊 Migration verification:");
    verification.forEach((item) => {
      console.log(
        `  ${item._id.status} + ${item._id.paymentStatus}: ${item.count} invoices`
      );
    });
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateInvoiceStatus()
    .then(() => {
      console.log("✅ Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateInvoiceStatus };
