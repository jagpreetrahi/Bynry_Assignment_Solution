const mongoose = require("mongoose");

// Company Schema
const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Warehouse Schema
const WarehouseSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  name: { type: String, required: true },
  location: String,
  createdAt: { type: Date, default: Date.now }
});

// Supplier Schema
const SupplierSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  name: { type: String, required: true },
  contactEmail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Product Schema
const ProductSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  isBundle: { type: Boolean, default: false },
  threshold: { type: Number, default: 10, min: 0 },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  createdAt: { type: Date, default: Date.now }
});

// Compound unique index for SKU per company
ProductSchema.index({ companyId: 1, sku: 1 }, { unique: true });

// Inventory Schema
const InventorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
  quantity: { type: Number, default: 0, min: 0 },
  updatedAt: { type: Date, default: Date.now }
});

// Compound unique index for product per warehouse
InventorySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });

// Inventory History Schema
const InventoryHistorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
  change: { type: Number, required: true },
  reason: { 
    type: String, 
    enum: ["sale", "restock", "initial_stock"], 
    required: true 
  },
  previousQuantity: { type: Number, required: true },
  newQuantity: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Product Bundle Schema (for products that contain other products)
const ProductBundleSchema = new mongoose.Schema({
  bundleId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  componentId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1 }
});

// Create Models
const Company = mongoose.model("Company", CompanySchema);
const Warehouse = mongoose.model("Warehouse", WarehouseSchema);
const Supplier = mongoose.model("Supplier", SupplierSchema);
const Product = mongoose.model("Product", ProductSchema);
const Inventory = mongoose.model("Inventory", InventorySchema);
const InventoryHistory = mongoose.model("InventoryHistory", InventoryHistorySchema);
const ProductBundle = mongoose.model("ProductBundle", ProductBundleSchema);

module.exports = {
  Company,
  Warehouse,
  Supplier,
  Product,
  Inventory,
  InventoryHistory,
  ProductBundle
};