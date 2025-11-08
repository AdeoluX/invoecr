var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var inventorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: Object, // Cloudinary object with url, public_id, etc.
    },
    entity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Entity",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
inventorySchema.index({ entity: 1, name: 1 });

var Inventory = mongoose.model("Inventory", inventorySchema);

module.exports = Inventory;
