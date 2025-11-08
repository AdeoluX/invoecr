const BaseRepository = require("./base.repo");
const Inventory = require("../models/inventory.model");

class InventoryRepository extends BaseRepository {
  constructor() {
    super(Inventory);
  }
}

module.exports = new InventoryRepository();
