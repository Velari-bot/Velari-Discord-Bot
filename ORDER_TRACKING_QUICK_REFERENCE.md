# Order Tracking Quick Reference

## 🚀 Quick Start Workflow

### 1. Customer Pays → 2. Admin Verifies → 3. Add Order → 4. Track Progress

---

## 📋 Commands

### For Customers
| Command | Usage | Description |
|---------|-------|-------------|
| `/trackorder` | `/trackorder` | Show your most recent order |
| `/trackorder` | `/trackorder order_id:ABC123` | Show specific order |

### For Admins
| Command | Usage | Description |
|---------|-------|-------------|
| `/addorder` | `/addorder user:@customer service:Bot payment_method:stripe amount:$150` | Add order after payment |
| `/updateorder` | `/updateorder order_id:ABC123 status:In Progress notes:Starting development` | Update order status |
| `/listorders` | `/listorders status:In Progress limit:10` | List orders with filters |

---

## 📊 Order Statuses

| Status | Emoji | Description |
|--------|-------|-------------|
| Payment Verified | 💳 | Payment confirmed, order processing |
| In Progress | 🔄 | Work actively being done |
| In Review | 🔍 | Quality review phase |
| Complete | ✅ | Order finished |
| On Hold | ⏸️ | Temporarily paused |
| Cancelled | ❌ | Order cancelled |

---

## 💳 Payment Integration

### Stripe/PayPal Workflow
1. **Customer pays** in ticket
2. **Admin verifies** payment
3. **Admin runs**: `/addorder user:@customer service:Website payment_method:stripe amount:$200 payment_id:pi_1234567890`
4. **System generates** unique order ID automatically
5. **Customer gets DM** with order ID
6. **Customer tracks**: `/trackorder order_id:ABC12345`

---

## 🔧 Common Admin Tasks

### Add New Order
```
/addorder user:@customer service:Bot Development payment_method:paypal amount:$300 payment_id:PAY-123456789 notes:Premium bot with API
```

### Update Order Status
```
/updateorder order_id:ABC12345 status:In Progress notes:Design approved, starting development assigned_staff:@developer
```

### List Active Orders
```
/listorders status:In Progress limit:25
```

### Find Specific Service Orders
```
/listorders service:Website
```

---

## 📱 Customer Experience

### Order Confirmation DM
- ✅ Payment verified
- 🆔 **Auto-generated** order ID provided
- 📋 Tracking instructions
- 📞 Support contact info

### Status Update DMs
- 📦 Status changes
- 📝 Progress notes
- 👨‍💼 Staff assignments
- 🔗 Tracking command reminder

---

## 🛡️ Security & Permissions

- **Admin Commands**: Require "Manage Server" permission
- **Auto-Generated IDs**: Unique order IDs prevent duplicates
- **Audit Trail**: Tracks who made changes
- **User Verification**: Ensures orders belong to correct user

---

## 🔗 Integration Points

- **Ticket System**: Automatic order IDs for ticket-created orders
- **Review System**: Completed orders qualify for reviews
- **Key System**: Orders can be linked to key generation
- **Role System**: Use `/assignrole` after order completion

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Order not found | Check order ID spelling |
| Permission denied | Ensure Manage Server permission |
| DM failed | User may have DMs disabled |
| Duplicate order | System prevents duplicates automatically |

---

## 📞 Support

- **For Admins**: Check `ORDER_TRACKING_GUIDE.md` for detailed documentation
- **For Customers**: Contact support in ticket or DM
- **Technical Issues**: Check bot logs and Firebase connection 