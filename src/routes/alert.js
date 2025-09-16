const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Inventory, InventoryHistory } = require("./../model");

// GET /companies/:companyId/alerts/low-stock
router.get("/:companyId/alerts/low-stock", async (req, res) => {
  try {
    const { companyId } = req.params;

    // Validate companyId format
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ error: "Invalid company ID format" });
    }

    // Get current date for recent sales calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find products with recent sales activity
    const recentSales = await InventoryHistory.find({
      reason: "sale",
      createdAt: { $gte: thirtyDaysAgo }
    }).distinct("productId");

    // Aggregation pipeline to get low stock alerts
    const pipeline = [
      // Match inventory records
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      // Filter by company
      {
        $match: {
          "product.companyId": new mongoose.Types.ObjectId(companyId),
          "productId": { $in: recentSales } // Only products with recent sales
        }
      },
      // Add warehouse info
      {
        $lookup: {
          from: "warehouses",
          localField: "warehouseId",
          foreignField: "_id",
          as: "warehouse"
        }
      },
      {
        $unwind: "$warehouse"
      },
      // Add supplier info
      {
        $lookup: {
          from: "suppliers",
          localField: "product.supplierId",
          foreignField: "_id",
          as: "supplier"
        }
      },
      // Filter for low stock (quantity < threshold)
      {
        $match: {
          $expr: {
            $lt: ["$quantity", "$product.threshold"]
          }
        }
      },
      // Project final structure
      {
        $project: {
          product_id: "$product._id",
          product_name: "$product.name",
          sku: "$product.sku",
          warehouse_id: "$warehouse._id",
          warehouse_name: "$warehouse.name",
          current_stock: "$quantity",
          threshold: "$product.threshold",
          supplier: {
            $cond: {
              if: { $gt: [{ $size: "$supplier" }, 0] },
              then: {
                id: { $arrayElemAt: ["$supplier._id", 0] },
                name: { $arrayElemAt: ["$supplier.name", 0] },
                contact_email: { $arrayElemAt: ["$supplier.contactEmail", 0] }
              },
              else: null
            }
          },
          productId: "$productId",
          warehouseId: "$warehouseId"
        }
      }
    ];

    const lowStockItems = await Inventory.aggregate(pipeline);

    // Calculate days until stockout for each item
    const alerts = await Promise.all(lowStockItems.map(async (item) => {
      const daysUntilStockout = await calculateDaysUntilStockout(
        item.productId, 
        item.warehouseId, 
        item.current_stock
      );

      return {
        ...item,
        days_until_stockout: daysUntilStockout,
        productId: undefined, // Remove internal field
        warehouseId: undefined // Remove internal field
      };
    }));

    res.json({
      alerts,
      total_alerts: alerts.length
    });

  } catch (err) {
    console.error("Error fetching low stock alerts:", err);
    res.status(500).json({ error: "Failed to fetch low stock alerts" });
  }
});

// Helper function to calculate days until stockout
async function calculateDaysUntilStockout(productId, warehouseId, currentStock) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get sales history for the last 30 days
    const salesHistory = await InventoryHistory.find({
      productId,
      warehouseId,
      reason: "sale",
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });

    if (salesHistory.length === 0) {
      // No recent sales - assume slow-moving inventory
      return currentStock > 0 ? Math.floor(currentStock / 0.1) : 0; // Very conservative
    }

    // Calculate total units sold in the period
    const totalSold = salesHistory.reduce((sum, record) => sum + Math.abs(record.change), 0);
    const daysInPeriod = Math.min(30, 
      Math.ceil((new Date() - salesHistory[0].createdAt) / (1000 * 60 * 60 * 24))
    );

    // Calculate average daily consumption
    const averageDailySales = totalSold / daysInPeriod;

    if (averageDailySales <= 0) {
      return currentStock > 0 ? 999 : 0; // Very long time if no consumption
    }

    // Calculate days until stockout
    const daysUntilStockout = Math.floor(currentStock / averageDailySales);
    
    return Math.max(0, daysUntilStockout);

  } catch (err) {
    console.error("Error calculating days until stockout:", err);
    return 0; // Conservative estimate on error
  }
}

module.exports = router;