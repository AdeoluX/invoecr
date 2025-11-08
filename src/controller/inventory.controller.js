const catchAsync = require("../utils/catchAsync");
const { InventoryService } = require("../services/inventory.service");
const { successResponse } = require("../utils/responder");
const httpStatus = require("http-status");

class InventoryController {
  static createInventory = catchAsync(async (req, res, next) => {
    const file = req.files?.image;
    const { id } = req.user;
    const data = req.body;
    const inventory = await InventoryService.createInventory({
      data,
      entityId: id,
      file,
    });
    return successResponse(
      req,
      res,
      inventory,
      "Inventory item created successfully"
    );
  });

  static getInventories = catchAsync(async (req, res, next) => {
    const { id } = req.user;
    const { page = 1, limit = 10, search } = req.query;
    const result = await InventoryService.getInventories({
      entityId: id,
      page,
      limit,
      search,
    });
    return successResponse(
      req,
      res,
      result,
      "Inventories retrieved successfully"
    );
  });

  static getInventoryById = catchAsync(async (req, res, next) => {
    const { id } = req.user;
    const { inventoryId } = req.params;
    const inventory = await InventoryService.getInventoryById({
      inventoryId,
      entityId: id,
    });
    return successResponse(
      req,
      res,
      inventory,
      "Inventory retrieved successfully"
    );
  });

  static updateInventory = catchAsync(async (req, res, next) => {
    const { id } = req.user;
    const { inventoryId } = req.params;
    const file = req.files?.image;
    const data = req.body;
    const inventory = await InventoryService.updateInventory({
      inventoryId,
      entityId: id,
      data,
      file,
    });
    return successResponse(
      req,
      res,
      inventory,
      "Inventory updated successfully"
    );
  });

  static deleteInventory = catchAsync(async (req, res, next) => {
    const { id } = req.user;
    const { inventoryId } = req.params;
    await InventoryService.deleteInventory({
      inventoryId,
      entityId: id,
    });
    return successResponse(req, res, {}, "Inventory deleted successfully");
  });
}

module.exports = {
  InventoryController,
};
