# StockFlow Assignment Solution


## Part 1: Code Review & Debugging (30 minutes)

### Original Flask Code Issues Identified

#### Issue 1: Missing Input Validation
**Problem**: No validation of required fields or data types
```python
# Original code directly accesses data without checking
name=data['name'],  # Could throw KeyError if missing
price=data['price']  # Could be invalid type
```
**Impact**: Application crashes with KeyError, invalid data in database


#### Issue 2: No Transaction Management
**Problem**: Product and inventory creation are separate commits
```python
db.session.add(product)
db.session.commit()    # First commit - product created

# ... inventory code ...
db.session.add(inventory)
db.session.commit()    # Second commit - could fail, leaving orphaned product
```
**Impact**: Orphaned products without inventory records, data inconsistency


#### Issue 3: No Error Handling
**Problem**: No try-catch blocks around database operations
**Impact**: Server crashes on database errors, poor user experience, no rollback


#### Issue 4: SKU Uniqueness Not Enforced
**Problem**: No check for duplicate SKUs before creation
**Impact**: Duplicate SKUs could cause business logic issues


#### Issue 5: No Response Status Codes
**Problem**: Always returns 200, even for errors
**Impact**: Clients can't properly handle errors


### Fixed Implementation (Node.js/Express)
```javascript
// See routes/products.js for complete implementation
```

## Part 2: Database Design (25 minutes)

### Schema Design

#### Core Tables/Collections
```
1. Companies
2. Warehouses
3. Products
```

### Design Decisions

#### 1. MongoDB vs SQL
**Choice**: MongoDB  
**Reason**: Flexible schema for evolving business needs, good for rapid development

#### 2. SKU Uniqueness
**Choice**: Compound index on (companyId, sku)  
**Reason**: SKUs should be unique per company, not globally

#### 3. Inventory History
**Choice**: Separate collection with references  
**Reason**: Audit trail without bloating main inventory records

### Missing Requirements / Questions for Product Team

1. **User Management**: How do users authenticate and access company data?
2. **Permissions**: What role-based access controls are needed?
3. **Multi-tenancy**: How is data isolated between companies?
4. **Product Categories**: Do products belong to categories/types?
5. **Pricing**: Is there historical pricing or just current price?

## Part 3: API Implementation (35 minutes)

### Endpoint Implementation

```javascript
// GET /companies/:companyId/alerts/low-stock
// Implementation in routes/alert.js
```

### Business Rules Implemented

1. **Low Stock Threshold**: Per-product threshold comparison
2. **Recent Sales Activity**: Check inventory history for sales in last 30 days
3. **Multiple Warehouses**: Aggregate alerts across all company warehouses
4. **Supplier Information**: Include supplier details for reordering

### Assumptions Made

1. **Recent Sales**: Defined as sales activity in the last 30 days
2. **Stockout Calculation**: Based on average daily consumption
3. **Threshold Default**: 10 units if not specified per product
4. **Company Validation**: Assuming company ID exists (would add validation in production)

### Edge Cases Handled

1. **No Supplier**: Returns null supplier info
2. **Zero Stock**: Handles division by zero in calculations
3. **No Sales History**: Defaults to conservative estimates
4. **Invalid Company**: Returns appropriate error



## Additional Considerations

### Scalability
- Implement database connection pooling
- Add caching layer (Redis) for frequent queries


### Security
- Rate limiting
- Authentication/authorization middleware
- Data encryption at rest



