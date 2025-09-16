const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Product, Inventory, InventoryHistory } = require("./../model");

// POST /api/products - Create new product with inventory
router.post("/", async (req, res) => {
  try {
    const { 
      name, 
      sku, 
      price, 
      warehouseId, 
      initialQuantity, 
      companyId, 
      supplierId,
      threshold 
    } = req.body;

    // Validate required fields
    if (!name || !sku || price === undefined || !warehouseId || 
        initialQuantity === undefined || !companyId) {
      return res.status(400).json({ 
        error: "Missing required fields: name, sku, price, warehouseId, initialQuantity, companyId" 
      });
    }

    // Validate data types
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ error: "Price must be a positive number" });
    }

    if (typeof initialQuantity !== "number" || initialQuantity < 0) {
      return res.status(400).json({ error: "Initial quantity must be a non-negative number" });
    }

    // Check SKU uniqueness within company
    const existingProduct = await Product.findOne({ companyId, sku });
    if (existingProduct) {
      return res.status(400).json({ error: "SKU already exists for this company" });
    }

    // Create product (without transaction for local development)
    const product = new Product({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      price,
      companyId,
      supplierId: supplierId || null,
      threshold: threshold || 10
    });
    await product.save();

    // Create inventory record
    const inventory = new Inventory({
      productId: product._id,
      warehouseId,
      quantity: initialQuantity
    });
    await inventory.save();

    // Create inventory history record
    const history = new InventoryHistory({
      productId: product._id,
      warehouseId,
      change: initialQuantity,
      reason: "initial_stock",
      previousQuantity: 0,
      newQuantity: initialQuantity
    });
    await history.save();

    res.status(201).json({ 
      message: "Product created successfully", 
      productId: product._id,
      sku: product.sku
    });

  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// GET /api/products - Get all products (optional - for testing)
router.get("/", async (req, res) => {
  try {
    const { companyId } = req.query;
    const filter = companyId ? { companyId } : {};
    
    const products = await Product.find(filter)
      .populate("supplierId", "name contactEmail")
      .select("name sku price threshold createdAt");
    
    res.json({ products, count: products.length });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// for simulates the sales 
router.post("/:productId/sell", async (req, res) => {
  try {
    const { productId } = req.params;
    const { warehouseId, quantity } = req.body;
    
    // Find current inventory
    const inventory = await Inventory.findOne({ productId, warehouseId });
    if (!inventory) {
      return res.status(404).json({ error: "Inventory not found" });
    }
    
    if (inventory.quantity < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }
    
    // Update inventory
    const previousQuantity = inventory.quantity;
    inventory.quantity -= quantity;
    await inventory.save();
    
    // Add sales history
    await InventoryHistory.create({
      productId,
      warehouseId, 
      change: -quantity,
      reason: "sale",
      previousQuantity,
      newQuantity: inventory.quantity
    });
    
    res.json({ message: "Sale recorded", newQuantity: inventory.quantity });
    
  } catch (err) {
    res.status(500).json({ error: "Failed to record sale" });
  }
});

module.exports = router;