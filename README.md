# StockFlow Assignment Solution

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start MongoDB locally

3. Run the application:
```bash
npm run dev
```

4. Test endpoints:
```bash
# Create a product
POST http://localhost:3000/api/products

# Get low stock alerts  
GET http://localhost:3000/api/companies/{companyId}/alerts/low-stock
```

## Assignment Solution

**See SOLUTION.md for detailed answers to all three parts of the assignment.**

## API Endpoints

- `POST /api/products` - Create product with inventory
- `GET /api/companies/:companyId/alerts/low-stock` - Get low stock alerts

## Database

Uses MongoDB with collections: Companies, Warehouses, Products, Suppliers, Inventory, InventoryHistory