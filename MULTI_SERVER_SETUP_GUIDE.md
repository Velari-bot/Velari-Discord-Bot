# 🚀 Multi-Server Bot Setup Guide

## Overview

The Velari bot has been updated to work with **any Discord server** without requiring manual configuration. Each server can now have its own admin, staff, and support roles that work independently.

## 🎯 Key Features

### **Multi-Server Support**
- ✅ **Any server can add the bot** and it will work immediately
- ✅ **Server-specific roles** - Each server has its own admin/staff roles
- ✅ **No manual configuration required** from the bot owner
- ✅ **Automatic setup process** - Servers configure themselves
- ✅ **Clean separation** - Each server's data is isolated

### **Role System**
- 👑 **Admin Role** - Full access to all bot features
- 👥 **Staff Role** - Access to view orders and help with support  
- 🎫 **Support Role** - Can manage tickets and provide support

## 🔧 Setup Process

### **For New Servers**

1. **Add the bot to your server** using the Discord OAuth2 link
2. **Bot automatically sends welcome message** with setup instructions
3. **Server admin runs `/setup`** to configure roles
4. **Bot is ready to use!**

### **Setup Command**

```
/setup admin_role:@Admin staff_role:@Staff support_role:@Support
```

**Required Options:**
- `admin_role` - Role that will have full admin permissions
- `staff_role` - Role that will have staff permissions

**Optional Options:**
- `support_role` - Role for support team members

**Permissions Required:**
- User must have "Manage Server" permission
- Bot must be able to manage the specified roles

## 📋 Available Commands

### **Setup & Configuration**
- `/setup` - Configure server roles and permissions
- `/serverinfo` - View current server configuration

### **Admin Commands** (Requires Admin Role)
- `/keys generate` - Generate premium keys
- `/keys dashboard` - View key management dashboard
- `/addorder` - Add new orders to the system
- `/updateorder` - Update order status
- `/listorders` - List all orders
- `/assignrole` - Assign purchased role to users
- `/embedbuilder` - Create custom embeds

### **Staff Commands** (Requires Staff Role)
- `/keys view` - View key statistics
- `/trackorder` - Track order status
- `/review view` - View customer reviews

### **Support Commands** (Requires Support Role)
- `/ticket setup` - Setup ticket system
- `/ticket close` - Close support tickets

### **User Commands** (Available to everyone)
- `/trackorder` - Track your own orders
- `/review make` - Leave reviews (if you have purchased role)
- `/review view` - View all reviews
- `/mykeys` - View your keys
- `/redeem` - Redeem a key

## 🔐 Permission System

### **Role Hierarchy**
```
Admin Role > Staff Role > Support Role > Regular Users
```

### **Permission Levels**

#### **Admin Role**
- ✅ Generate and manage keys
- ✅ Manage orders (add, update, list)
- ✅ Assign purchased roles
- ✅ Use embed builder
- ✅ Access all staff and support features

#### **Staff Role**
- ✅ View orders and keys
- ✅ Help with support
- ✅ Track orders
- ✅ View reviews
- ✅ Access support features

#### **Support Role**
- ✅ Manage tickets
- ✅ Close tickets
- ✅ Provide support
- ✅ View order information

#### **Regular Users**
- ✅ Track their own orders
- ✅ Leave reviews (if they have purchased role)
- ✅ Redeem keys
- ✅ View their own keys

## 🗄️ Database Structure

### **Server Configurations**
```javascript
// Collection: server_configs
{
  guildId: "server_id",
  guildName: "Server Name",
  adminRoleId: "role_id",
  adminRoleName: "Admin",
  staffRoleId: "role_id", 
  staffRoleName: "Staff",
  supportRoleId: "role_id", // optional
  supportRoleName: "Support", // optional
  setupBy: "user_id",
  setupByUsername: "username",
  setupAt: Timestamp,
  isActive: true
}
```

### **Data Isolation**
- Each server's data is stored separately
- Server configurations are isolated by guild ID
- Orders, keys, and reviews are server-specific
- No cross-server data sharing

## 🚨 Error Handling

### **Common Issues**

#### **"Server not configured"**
- **Cause**: Server hasn't run `/setup` yet
- **Solution**: Run `/setup` to configure roles

#### **"Role not found"**
- **Cause**: Configured role was deleted
- **Solution**: Run `/setup` again to reconfigure

#### **"Permission denied"**
- **Cause**: User doesn't have required role
- **Solution**: Ask admin to assign appropriate role

#### **"Bot cannot manage role"**
- **Cause**: Role is higher than bot's highest role
- **Solution**: Move bot's role above the target role

## 🔄 Migration from Single-Server

### **For Existing Servers**
1. **Bot continues to work** with existing hardcoded roles
2. **Run `/setup`** to migrate to new system
3. **Old configuration is replaced** with new server-specific config
4. **All existing data is preserved**

### **Backward Compatibility**
- ✅ Existing commands continue to work
- ✅ Existing data is preserved
- ✅ Gradual migration possible
- ✅ No data loss during transition

## 📊 Server Management

### **Bot Owner Commands**
- View all configured servers
- Monitor server usage
- Clean up inactive servers
- View server statistics

### **Server Monitoring**
- Track which servers are active
- Monitor command usage per server
- Identify inactive servers
- Generate usage reports

## 🛡️ Security Features

### **Role Validation**
- Bot checks if configured roles still exist
- Automatic fallback if roles are deleted
- Clear error messages for missing roles
- Secure role permission checking

### **Data Protection**
- Server data is isolated
- No cross-server data access
- Secure Firebase authentication
- Role-based access control

## 📈 Benefits

### **For Bot Owner**
- ✅ **No manual setup required** for new servers
- ✅ **Scalable** - works with unlimited servers
- ✅ **Maintenance-free** - servers configure themselves
- ✅ **Revenue potential** - can charge per server

### **For Server Admins**
- ✅ **Easy setup** - one command to configure
- ✅ **Flexible roles** - use existing server roles
- ✅ **Full control** - manage their own permissions
- ✅ **No dependencies** - works independently

### **For Users**
- ✅ **Consistent experience** across servers
- ✅ **Familiar commands** - same everywhere
- ✅ **Reliable service** - no manual intervention needed
- ✅ **Fast setup** - servers ready immediately

## 🎯 Best Practices

### **For Server Setup**
1. **Use existing roles** when possible
2. **Set up support role** for ticket management
3. **Test permissions** after setup
4. **Keep roles organized** and clearly named

### **For Role Management**
1. **Regular audits** of role assignments
2. **Clear role descriptions** for team members
3. **Consistent naming** conventions
4. **Backup role configurations**

### **For Bot Usage**
1. **Train staff** on available commands
2. **Document server-specific procedures**
3. **Monitor usage** and adjust as needed
4. **Regular maintenance** of configurations

## 🔮 Future Enhancements

### **Planned Features**
- **Web dashboard** for server management
- **Advanced analytics** per server
- **Custom command permissions**
- **Server-specific settings**
- **Bulk operations** for multiple servers
- **API access** for integrations

### **Scalability Improvements**
- **Caching** for faster role checks
- **Batch operations** for efficiency
- **Optimized queries** for large servers
- **Background processing** for heavy tasks

---

## ✅ Quick Start Checklist

### **For New Servers**
- [ ] Add bot to server
- [ ] Run `/setup` with admin and staff roles
- [ ] Test permissions with `/serverinfo`
- [ ] Train staff on available commands
- [ ] Set up support role (optional)

### **For Bot Owner**
- [ ] Deploy updated bot code
- [ ] Test with existing servers
- [ ] Monitor new server joins
- [ ] Update documentation
- [ ] Prepare support resources

---

**🎉 Your bot is now ready for multi-server deployment!** 