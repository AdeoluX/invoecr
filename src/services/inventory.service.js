const inventoryRepository = require("../repo/inventory.repo");
const entityRepository = require("../repo/entity.repo");
const { abortIf } = require("../utils/responder");
const httpStatus = require("http-status").default;
const { UtilsService } = require("./utils.service");
const { deleteImage } = require("../utils/cloudinary.util");

class InventoryService {
  static createInventory = async ({ data, entityId, file }) => {
    const entity = await entityRepository.findOne({ query: { _id: entityId } });
    abortIf(!entity, httpStatus.BAD_REQUEST, "Entity does not exist");

    const { name, description, tags, amount } = data;

    // Upload image if provided
    let image = null;
    if (file) {
      abortIf(
        !["image/png", "image/jpg", "image/jpeg", "image/webp"].includes(
          file.mimetype
        ),
        httpStatus.BAD_REQUEST,
        "Invalid file type. Only images are allowed"
      );
      image = await UtilsService.cloudinaryUpload(
        file.tempFilePath,
        `inventory/${entity.name.toLowerCase().split(" ").join("-")}`
      );
      abortIf(!image, httpStatus.BAD_REQUEST, "Unable to upload image");
    }

    // Parse tags if it's a string
    let parsedTags = [];
    if (tags) {
      if (typeof tags === "string") {
        parsedTags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    const inventory = await inventoryRepository.create({
      name,
      description,
      tags: parsedTags,
      amount: parseFloat(amount),
      image,
      entity: entityId,
    });

    return inventory;
  };

  static getInventories = async ({
    entityId,
    page = 1,
    limit = 10,
    search,
  }) => {
    const entity = await entityRepository.findOne({ query: { _id: entityId } });
    abortIf(!entity, httpStatus.BAD_REQUEST, "Entity does not exist");

    const query = { entity: entityId };

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const result = await inventoryRepository.paginate({
      query,
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    });

    return result;
  };

  static getInventoryById = async ({ inventoryId, entityId }) => {
    const inventory = await inventoryRepository.findOne({
      query: { _id: inventoryId, entity: entityId },
    });
    abortIf(!inventory, httpStatus.NOT_FOUND, "Inventory not found");
    return inventory;
  };

  static updateInventory = async ({ inventoryId, entityId, data, file }) => {
    const inventory = await inventoryRepository.findOne({
      query: { _id: inventoryId, entity: entityId },
    });
    abortIf(!inventory, httpStatus.NOT_FOUND, "Inventory not found");

    const { name, description, tags, amount } = data;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = parseFloat(amount);

    // Parse tags if provided
    if (tags !== undefined) {
      if (typeof tags === "string") {
        updateData.tags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
      } else if (Array.isArray(tags)) {
        updateData.tags = tags;
      }
    }

    // Handle image upload if provided
    if (file) {
      abortIf(
        !["image/png", "image/jpg", "image/jpeg", "image/webp"].includes(
          file.mimetype
        ),
        httpStatus.BAD_REQUEST,
        "Invalid file type. Only images are allowed"
      );

      // Delete old image if exists
      if (inventory.image && inventory.image.public_id) {
        try {
          await deleteImage(inventory.image.public_id);
        } catch (error) {
          console.error("Error deleting old image:", error);
        }
      }

      // Upload new image
      const entity = await entityRepository.findOne({
        query: { _id: entityId },
      });
      const image = await UtilsService.cloudinaryUpload(
        file.tempFilePath,
        `inventory/${entity.name.toLowerCase().split(" ").join("-")}`
      );
      abortIf(!image, httpStatus.BAD_REQUEST, "Unable to upload image");
      updateData.image = image;
    }

    const updatedInventory = await inventoryRepository.update(
      inventoryId,
      updateData
    );

    return updatedInventory;
  };

  static deleteInventory = async ({ inventoryId, entityId }) => {
    const inventory = await inventoryRepository.findOne({
      query: { _id: inventoryId, entity: entityId },
    });
    abortIf(!inventory, httpStatus.NOT_FOUND, "Inventory not found");

    // Delete image from Cloudinary if exists
    if (inventory.image && inventory.image.public_id) {
      try {
        await deleteImage(inventory.image.public_id);
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }

    await inventoryRepository.delete(inventoryId);
    return {};
  };
}

module.exports = {
  InventoryService,
};
