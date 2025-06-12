# 🔑 Key Generation and Management System

A comprehensive Discord bot system for managing premium keys, subscriptions, and access control. This system allows admins to generate, distribute, and track premium keys while users can redeem them to access premium features.

## 🚀 Features

### For Admins
- **Key Generation**: Generate keys automatically or create custom keys
- **Bulk Operations**: Generate multiple keys at once (1-50 keys)
- **Key Management**: View, deactivate, and reactivate keys
- **Excel-like Dashboard**: Comprehensive view with filtering and sorting
- **Statistics**: Detailed analytics and reporting
- **Automatic Delivery**: Send keys directly to users via DM

### For Users
- **Key Redemption**: Easy key redemption with `/redeem` command
- **Key Management**: View all redeemed keys and subscription status
- **Expiry Tracking**: Automatic notifications for expiring keys
- **Support Integration**: Seamless integration with ticket system

## 📋 Commands

### Admin Commands

#### `/keys generate`
Generate new premium keys with specified parameters.

**Options:**
- `model`: Premium Tweak App, Premium Discord Bot, Premium API Access, or Custom
- `custom_model`: Custom model name (if custom is selected)
- `duration`: 1 Day, 7 Days, 30 Days, 90 Days, 1 Year, or Lifetime
- `count`: Number of keys to generate (1-50)

**Example:**
```
/keys generate model:premium_tweak duration:30d count:5
```

#### `/keys view`
View key status and statistics with optional filtering.

**Options:**
- `model`: Filter by specific model (All Models, Premium Tweak App, etc.)

#### `/keys dashboard`
View comprehensive Excel-like dashboard with advanced filtering and sorting.

**Options:**
- `filter`: All Keys, Active Only, Redeemed Only, Expired Only
- `model`: Filter by specific model
- `sort`: Newest First, Oldest First, Model A-Z, Model Z-A, Status

#### `/keys deactivate`
Deactivate a specific key by ID.

**Options:**
- `key_id`: The key ID to deactivate

#### `/keys reactivate`
Reactivate a deactivated key by ID.

**Options:**
- `key_id`: The key ID to reactivate

#### `/keys custom`
Create a custom key with specific details.

**Options:**
- `key`: Custom key value
- `model`: The model/subscription type
- `duration`: Key duration
- `description`: Additional description (optional)

### User Commands

#### `/redeem`
Redeem a premium key to access premium features.

**Options:**
- `key`: The premium key to redeem

**Example:**
```
/redeem key:PRE-XXXX-XXXX-XXXX
```

#### `/mykeys`
View your redeemed premium keys and subscription status.

## 🗄️ Database Structure

The system uses Firebase Firestore with the following collection structure:

### Keys Collection
```javascript
{
  id: "auto-generated",
  key: "PRE-XXXX-XXXX-XXXX",
  model: "premium_tweak",
  duration: "30d",
  expiresAt: Timestamp,
  isActive: true,
  createdAt: Timestamp,
  createdBy: "user_id",
  createdByUsername: "username",
  redeemedBy: "user_id", // null if not redeemed
  redeemedByUsername: "username", // null if not redeemed
  redeemedAt: Timestamp, // null if not redeemed
  description: "Custom description", // optional
  isCustom: true // for custom keys
}
```

## 🔧 Key Generation

### Automatic Key Generation
Keys are automatically generated with the following format:
- **Premium Tweak App**: `PRE-XXXX-XXXX-XXXX`
- **Premium Discord Bot**: `PRE-XXXX-XXXX-XXXX`
- **Premium API Access**: `PRE-XXXX-XXXX-XXXX`
- **Custom Models**: `{PREFIX}-XXXX-XXXX-XXXX`

### Key Validation
- Keys must follow the format: `XXX-XXXX-XXXX-XXXX`
- Keys are automatically formatted for consistency
- Duplicate keys are prevented at the database level

## 📊 Dashboard Features

### Excel-like Functionality
- **Filtering**: By status, model, and date range
- **Sorting**: By creation date, model, status, and more
- **Export**: CSV export functionality (simulated)
- **Statistics**: Real-time analytics and reporting

### Key Statistics
- Total keys generated
- Active vs redeemed keys
- Expired keys count
- Breakdown by model
- Time remaining calculations

## 🚀 Key Delivery System

### Automatic DM Delivery
When keys are generated for specific users, they are automatically sent via DM with:
- Key details and instructions
- Model-specific activation steps
- Support information
- Expiry warnings

### Delivery Notifications
- Key delivery confirmations
- Expiry warnings (7 days before)
- Expired key notifications
- Bulk key delivery support

## 🔄 Integration Features

### Support System Integration
- Seamless integration with existing ticket system
- Support buttons in key management interfaces
- Automatic support ticket creation for key issues

### Permission System
- Role-based access control
- Admin-only key generation and management
- User-friendly redemption process

## 📱 Model-Specific Features

### Premium Tweak App
- App download instructions
- Discord account integration
- Premium feature unlock process

### Premium Discord Bot
- Server setup instructions
- Admin configuration guidance
- Enhanced feature access

### Premium API Access
- API credential delivery
- Documentation access
- Rate limit information

## 🛠️ Setup and Configuration

### 1. Firebase Configuration
Ensure your Firebase configuration is properly set up in `firebase/firebase.js`.

### 2. Permission Roles
Configure admin roles in `config.js`:
```javascript
export const ALLOWED_ROLES = ["role_id_1", "role_id_2"];
export const OVERRIDE_ROLES = ["admin_role_id"];
```

### 3. Deploy Commands
Run the command deployment script:
```bash
node deploy-commands.js
```

### 4. Start the Bot
```bash
npm start
```

## 📈 Usage Examples

### Generating Keys for a Purchase
1. Admin receives payment notification
2. Use `/keys generate` to create keys
3. Keys are automatically sent to user via DM
4. User redeems keys with `/redeem`

### Bulk Key Generation
1. Use `/keys generate` with count parameter
2. Generate 1-50 keys at once
3. Keys are stored in database
4. Distribute as needed

### Key Management
1. Use `/keys dashboard` for overview
2. Filter and sort as needed
3. Deactivate/reactivate keys as required
4. Export data for external analysis

## 🔒 Security Features

- **Key Validation**: Prevents invalid key formats
- **Permission Checks**: Role-based access control
- **Duplicate Prevention**: Database-level uniqueness
- **Expiry Management**: Automatic expiry tracking
- **Audit Trail**: Complete key history tracking

## 📞 Support

### For Users
- Use `/ticket` to create support tickets
- Contact server admins directly
- Check `/mykeys` for key status

### For Admins
- Use `/keys dashboard` for comprehensive management
- Monitor key statistics and usage
- Handle support tickets for key issues

## 🔄 Future Enhancements

- **Scheduled Key Generation**: Automated key creation
- **Payment Integration**: Direct payment-to-key generation
- **Advanced Analytics**: Detailed usage reports
- **API Integration**: External system integration
- **Mobile App Support**: Enhanced mobile experience

## 📝 Notes

- Keys are case-insensitive but stored in uppercase
- Expired keys cannot be redeemed but remain in database
- Custom keys can be created with any valid format
- Bulk operations are limited to 50 keys per request
- All key operations are logged for audit purposes

---

**Need help?** Create a support ticket or contact an admin! 