# 📝 Review System Guide

A comprehensive review system that only allows users with the purchased role to leave reviews about their purchase experience.

## 🔑 **Role-Based Access Control**

### **Purchased Role ID**: `1382076356170354688`

Only users with this role can:
- ✅ Write reviews using `/review make`
- ✅ Access exclusive review features
- ✅ Get notified about new review capabilities

## 📋 **Commands**

### **For Users with Purchased Role**

#### `/review make`
Create a new review about your purchase experience.

**Required Options:**
- `rating`: 1-5 stars (⭐ to ⭐⭐⭐⭐⭐)
- `product`: What product you purchased
- `title`: Brief title for your review (max 100 characters)

**Optional Options:**
- `comment`: Detailed review (max 1000 characters)

**Example:**
```
/review make rating:5 product:premium_tweak title:"Amazing experience!" comment:"The premium features are incredible and the support is top-notch!"
```

#### `/review view`
View all reviews with optional filtering.

**Optional Options:**
- `product`: Filter by specific product

**Example:**
```
/review view product:premium_tweak
```

#### `/review myreviews`
View your own reviews.

**Example:**
```
/review myreviews
```

### **For Admins**

#### `/assignrole`
Assign the purchased role to a user who has made a purchase.

**Required Options:**
- `user`: The user to assign the role to

**Optional Options:**
- `reason`: Reason for assigning the role

**Example:**
```
/assignrole user:@username reason:Purchased Premium Tweak App
```

## 🎯 **How It Works**

### **1. Purchase Process**
1. User makes a purchase
2. Admin verifies the purchase
3. Admin uses `/assignrole` to give the user the purchased role
4. User receives DM notification about new features

### **2. Review Process**
1. User with purchased role can use `/review make`
2. Review is stored in Firebase
3. Review appears in public review channel
4. Other users can view reviews with `/review view`

### **3. Role Verification**
- System checks for role `1382076356170354688` before allowing reviews
- Users without the role get helpful error message
- Admins can easily assign roles with `/assignrole`

## 📊 **Database Structure**

### **Reviews Collection**
```javascript
{
  id: "auto-generated",
  userId: "user_id",
  username: "username",
  rating: 5,
  product: "premium_tweak",
  title: "Amazing experience!",
  comment: "The premium features are incredible...",
  createdAt: Timestamp
}
```

## 🚀 **Features**

### **Review System**
- ⭐ **Star Ratings**: 1-5 star rating system
- 📦 **Product Filtering**: Filter reviews by product type
- 📋 **Title & Comments**: Structured review format
- 📊 **Statistics**: Average ratings and review counts
- 🔄 **Real-time Updates**: Instant review posting

### **Role Management**
- 🎯 **Automatic Role Assignment**: Easy role assignment for admins
- 📱 **DM Notifications**: Users get notified when role is assigned
- 🔒 **Access Control**: Only purchased users can review
- 📋 **Audit Trail**: Track who assigned roles and when

### **User Experience**
- 🎨 **Beautiful Embeds**: Rich, formatted review displays
- 🔘 **Interactive Buttons**: Easy navigation between features
- 📱 **Mobile Friendly**: Works great on all devices
- 🚀 **Fast Performance**: Quick response times

## 🛠️ **Setup Instructions**

### **1. Role Setup**
Ensure the role with ID `1382076356170354688` exists in your server.

### **2. Channel Setup**
Update the review channel ID in `commands/review.js`:
```javascript
const reviewChannelId = 'YOUR_REVIEW_CHANNEL_ID';
```

### **3. Deploy Commands**
```bash
node deploy-commands.js
```

### **4. Test the System**
1. Assign role to a test user: `/assignrole user:@testuser`
2. Have them try: `/review make`
3. View reviews: `/review view`

## 📈 **Usage Examples**

### **Scenario 1: New Purchase**
1. User purchases Premium Tweak App
2. Admin verifies payment
3. Admin runs: `/assignrole user:@customer reason:Purchased Premium Tweak App`
4. User gets DM with new features unlocked
5. User can now use `/review make`

### **Scenario 2: Customer Review**
1. User with purchased role uses `/review make`
2. Selects 5 stars, Premium Tweak App, writes review
3. Review appears in review channel
4. Other users can see it with `/review view`

### **Scenario 3: Review Management**
1. Admin wants to see all reviews: `/review view`
2. Filter by product: `/review view product:premium_tweak`
3. Check user's reviews: `/review myreviews`

## 🔒 **Security Features**

- **Role Verification**: Only purchased users can review
- **Admin Controls**: Only admins can assign roles
- **Input Validation**: Review length and format limits
- **Audit Trail**: Track all role assignments and reviews

## 📊 **Analytics**

### **Review Statistics**
- Total number of reviews
- Average rating across all products
- Rating distribution (1-5 stars)
- Reviews per product
- Recent review activity

### **Role Statistics**
- Number of users with purchased role
- Role assignment history
- User engagement metrics

## 🎨 **Customization**

### **Review Channel**
Update the channel ID where reviews are posted:
```javascript
const reviewChannelId = 'YOUR_CHANNEL_ID';
```

### **Role ID**
If you need to change the purchased role ID:
```javascript
const purchasedRoleId = 'YOUR_ROLE_ID';
```

### **Product Options**
Add or modify product choices in the command options.

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"You need to purchase a product first"**
- User doesn't have the purchased role
- Use `/assignrole` to give them the role

#### **"Role not found"**
- Check that role ID `1382076356170354688` exists
- Verify bot has permission to manage roles

#### **"Cannot send DM"**
- User has DMs disabled
- This is normal and won't break functionality

#### **Reviews not appearing**
- Check Firebase connection
- Verify review channel permissions
- Check console for errors

## 📞 **Support**

### **For Users**
- Contact admin if you can't leave reviews
- Use `/ticket` for technical support
- Check if you have the purchased role

### **For Admins**
- Use `/assignrole` to give users the role
- Monitor review channel for spam
- Check Firebase for review data

---

## ✅ **Quick Start Checklist**

- [ ] Role `1382076356170354688` exists in server
- [ ] Bot has "Manage Roles" permission
- [ ] Review channel is set up
- [ ] Commands are deployed
- [ ] Test with `/assignrole` and `/review make`
- [ ] Verify reviews appear in channel

**Your review system is ready to go!** 🚀 