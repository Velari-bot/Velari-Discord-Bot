# Order Tracking System Guide

## Overview

The Order Tracking System allows you to manage orders from payment verification through completion. It integrates with Stripe and PayPal payments and provides comprehensive tracking for both users and staff.

## Commands

### For Users

#### `/trackorder [order_id]`
- **Purpose**: Track the status of your order
- **Usage**: 
  - `/trackorder` - Shows your most recent order
  - `/trackorder order_id:ABC123` - Shows specific order
- **Features**:
  - Shows payment method and amount
  - Displays progress bar for standard statuses
  - Shows assigned staff and notes
  - Color-coded status indicators

### For Admins

#### `/addorder`
- **Purpose**: Add an order to the system after payment verification
- **Required Permissions**: Manage Server
- **Usage**: `/addorder user:@customer order_id:ABC123 service:Bot Development payment_method:stripe amount:$150.00 notes:Premium bot with dashboard`
- **Features**:
  - Validates order ID uniqueness
  - Sends confirmation DM to customer
  - Logs payment information
  - Automatically sets status to "Payment Verified"

#### `/updateorder`
- **Purpose**: Update order status and add notes
- **Required Permissions**: Manage Server
- **Usage**: `/updateorder order_id:ABC123 status:In Progress notes:Starting development phase assigned_staff:@developer`
- **Features**:
  - Updates order status
  - Sends status update DM to customer
  - Assigns staff members
  - Tracks who made the update

#### `/listorders`
- **Purpose**: List all orders with filtering
- **Required Permissions**: Manage Server
- **Usage**: 
  - `/listorders` - Shows 10 most recent orders
  - `/listorders status:In Progress limit:25` - Shows 25 in-progress orders
  - `/listorders service:Bot` - Shows bot-related orders
- **Features**:
  - Filter by status, service, or both
  - Configurable limit (max 25)
  - Shows key order information
  - Status emoji indicators

## Order Status Flow

```
Payment Verified → In Progress → In Review → Complete
       ↓              ↓            ↓          ↓
    💳 Payment    🔄 Work in    🔍 Under    ✅ Order
    Confirmed     Progress     Review      Complete
```

### Additional Statuses
- **On Hold** ⏸️ - Order temporarily paused
- **Cancelled** ❌ - Order cancelled

## Payment Integration Workflow

### 1. Customer Makes Payment
Customer completes payment through Stripe or PayPal in a ticket.

### 2. Admin Verifies Payment
Admin receives payment confirmation and uses `/addorder`:
```
/addorder user:@customer order_id:STRIPE_123456 service:Website Development payment_method:stripe amount:$200.00 notes:Landing page with contact form
```

### 3. Customer Gets Confirmation
Customer receives DM with:
- Order confirmation
- Order ID for tracking
- Instructions to use `/trackorder`

### 4. Order Progress Updates
Admin updates order status as work progresses:
```
/updateorder order_id:STRIPE_123456 status:In Progress notes:Design phase complete, starting development
```

### 5. Customer Tracks Progress
Customer uses `/trackorder order_id:STRIPE_123456` to see:
- Current status
- Progress bar
- Staff assignments
- Latest notes

## Database Structure

Orders are stored in Firebase with the following fields:

```javascript
{
  orderId: "STRIPE_123456",
  userId: "123456789",
  username: "customer#1234",
  service: "Website Development",
  paymentMethod: "stripe",
  amount: "$200.00",
  notes: "Landing page with contact form",
  status: "Payment Verified",
  timestamp: Date,
  addedBy: "admin_id",
  addedByUsername: "admin#5678",
  lastUpdated: Date,
  updatedBy: "admin_id",
  updatedByUsername: "admin#5678",
  staff: "developer_id",
  staffUsername: "developer#9012"
}
```

## Best Practices

### For Admins
1. **Always verify payments** before adding orders
2. **Use descriptive notes** when updating status
3. **Assign staff** to orders for accountability
4. **Update status promptly** as work progresses
5. **Use consistent order IDs** from payment systems

### For Customers
1. **Save your order ID** from the confirmation DM
2. **Use `/trackorder`** to check progress
3. **Contact support** if you have questions
4. **Provide feedback** when order is complete

## Integration with Existing Systems

### Ticket System
- Orders created through tickets get automatic order IDs
- Ticket channels include order ID in topic
- Support can reference order IDs in ticket discussions

### Review System
- Completed orders qualify users for review system
- Use `/assignrole` to give purchased role after order completion

### Key System
- Orders can be linked to key generation
- Use order IDs to track key deliveries

## Troubleshooting

### Common Issues

**Order not found**
- Check order ID spelling
- Verify user has the order
- Check if order was properly added

**Permission denied**
- Ensure user has Manage Server permission
- Check bot permissions in channel

**DM failed**
- User may have DMs disabled
- Check bot permissions for DMs

### Error Messages

- `❌ Order ID not found` - Order doesn't exist
- `❌ Permission denied` - Insufficient permissions
- `❌ Failed to update order` - Database error

## Security Features

- **Admin-only commands** require Manage Server permission
- **Order ID validation** prevents duplicates
- **Audit trail** tracks who made changes
- **User verification** ensures orders belong to correct user

## Future Enhancements

- **Automated payment webhooks** for Stripe/PayPal
- **Order templates** for common services
- **Bulk order management** for multiple orders
- **Order analytics** and reporting
- **Integration with external project management tools** 