# 🚀 Velari Discord Bot - Comprehensive Feature Set

A feature-rich Discord.js v14+ bot with multiple systems including tickets, moderation, welcome/goodbye, reaction roles, suggestions, and more. All systems feature Velari-style design with no database requirements.

## ✨ **Complete Feature List**

### 🎫 **1. Ticket System**
- **Slash Commands:** `/ticket setup`, `/ticket close`
- **Features:**
  - Modal-based ticket creation with issue description
  - Private channels with proper permissions
  - Duplicate ticket prevention
  - Auto-cleanup after 5 seconds
  - Support role management
  - Velari-style embeds and buttons

### 🚪 **2. Welcome & Goodbye System**
- **Slash Commands:** `/welcome setchannel`, `/welcome toggle`, `/welcome test`
- **Features:**
  - Configurable welcome channel
  - Optional DM welcome messages
  - Member count tracking
  - Customizable welcome/goodbye messages
  - Toggle individual features on/off

### 🔨 **3. Moderation System**
- **Slash Commands:** `/moderation ban`, `/moderation kick`, `/moderation timeout`, `/moderation warn`, `/moderation purge`, `/moderation snipe`
- **Features:**
  - Full moderation suite with permission checks
  - Duration parsing (1s, 1m, 1h, 1d)
  - Bulk message deletion (1-100 messages)
  - Last deleted message tracking
  - Comprehensive error handling

### 🎭 **4. Reaction Role System**
- **Slash Commands:** `/reactionrole create`
- **Features:**
  - Up to 5 roles per message
  - Button-based role assignment
  - Toggle roles on/off
  - Permission validation
  - Color-coded buttons with emojis

### 💡 **5. Suggestion System**
- **Slash Commands:** `/suggest setup`, `/suggest create`, `/suggest anonymous`
- **Features:**
  - Modal-based suggestion creation
  - Anonymous suggestions
  - Voting system with upvote/downvote
  - Status tracking (Under Review, Popular, Unpopular)
  - Unique suggestion IDs

### 📢 **6. Announcement System**
- **Slash Commands:** `/utility announce`
- **Features:**
  - Modal-based announcement creation
  - Title, message, and ping options
  - Role and @everyone/@here support
  - Styled embeds with branding

### ⏰ **7. Reminder System**
- **Slash Commands:** `/utility remindme`
- **Features:**
  - Time-based reminders (1m to 7 days)
  - DM or channel notifications
  - Duration parsing (1s, 1m, 1h, 1d)
  - Memory-based storage

### 📊 **8. Information Commands**
- **Slash Commands:** `/utility serverinfo`, `/utility userinfo`, `/utility botinfo`
- **Features:**
  - Detailed server statistics
  - User information with roles and badges
  - Bot information with uptime and version

### 🛡️ **9. Anti-Spam & Anti-Raid**
- **Features:**
  - Message cooldown system (3 seconds)
  - Join rate monitoring
  - Automatic spam detection
  - Raid detection alerts
  - Configurable thresholds

## 🛠️ **Setup Instructions**

### 1. **Installation**
```bash
npm install
```

### 2. **Environment Variables**
Create a `.env` file:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
```

### 3. **Deploy Commands**
```bash
node deploy-commands.js
```

### 4. **Start the Bot**
```bash
npm start
```

## 📁 **File Structure**

```
embed builder/
├── commands/
│   ├── ticket.js              # Ticket system
│   ├── welcome.js             # Welcome/goodbye system
│   ├── moderation.js          # Moderation commands
│   ├── utility.js             # Utility commands
│   ├── reactionrole.js        # Reaction role system
│   ├── suggest.js             # Suggestion system
│   ├── embedbuilder.js        # Embed builder (existing)
│   └── embed.js               # Embed commands (existing)
├── utils/
│   └── ticketUtils.js         # Ticket utility functions
├── config.js                  # Configuration file
├── index.js                   # Main bot file
├── deploy-commands.js         # Command deployment
└── README files
```

## 🎨 **Velari Design System**

### **Color Palette**
- **Primary:** #FF6B9D (Pink)
- **Success:** #4CAF50 (Green)
- **Warning:** #FF9800 (Orange)
- **Error:** #F44336 (Red)

### **Design Elements**
- **Bold Text:** All important text uses Discord's bold formatting
- **Modern Emojis:** Contextual emojis for each feature
- **Clean Layout:** Minimal, modern design with clear hierarchy
- **Professional Footers:** "Velari [System Name]" branding

## 🔧 **Configuration**

All systems are configurable through `config.js`:

```javascript
export const TICKET_CONFIG = {
    SUPPORT_ROLE_NAME: "Support",
    COLORS: {
        PRIMARY: "#FF6B9D",
        SUCCESS: "#4CAF50",
        WARNING: "#FF9800",
        ERROR: "#F44336"
    },
    CLOSE_DELAY: 5000,
    // ... more configuration
};
```

## 📋 **Command Reference**

### **Ticket System**
```
/ticket setup #channel    - Setup ticket panel
/ticket close            - Close current ticket
```

### **Welcome System**
```
/welcome setchannel #channel  - Set welcome channel
/welcome toggle feature on/off - Toggle features
/welcome test                - Test welcome message
```

### **Moderation**
```
/moderation ban user [reason]     - Ban a user
/moderation kick user [reason]    - Kick a user
/moderation timeout user duration [reason] - Timeout a user
/moderation warn user reason      - Warn a user
/moderation purge amount          - Delete messages
/moderation snipe                 - Show last deleted message
```

### **Utility**
```
/utility serverinfo              - Server information
/utility userinfo [user]         - User information
/utility botinfo                 - Bot information
/utility announce #channel       - Create announcement
/utility remindme time message   - Set reminder
```

### **Reaction Roles**
```
/reactionrole create title description role1 [role2-5] - Create reaction role message
```

### **Suggestions**
```
/suggest setup #channel          - Setup suggestion channel
/suggest create                  - Create suggestion
/suggest anonymous               - Create anonymous suggestion
```

## 🛡️ **Security Features**

- **Permission Checks:** All commands verify user permissions
- **Role Validation:** Ensures bot can manage specified roles
- **Input Validation:** Sanitizes and validates all user input
- **Error Handling:** Comprehensive error handling with user-friendly messages
- **Anti-Spam:** Built-in spam detection and prevention
- **Anti-Raid:** Basic raid detection and monitoring

## 🔄 **Memory Management**

All systems use in-memory storage for:
- Welcome configurations
- Ticket tracking
- Suggestion data
- Reminder storage
- Deleted message tracking
- Anti-spam cooldowns

## 🚨 **Troubleshooting**

### **Common Issues**

**"Missing Permissions"**
- Ensure bot has required permissions in the server
- Check role hierarchy for moderation commands

**"Commands Not Working"**
- Run `node deploy-commands.js` to register commands
- Check bot token and client ID in `.env`

**"Welcome System Not Working"**
- Use `/welcome setchannel` to configure the channel
- Check bot permissions in the welcome channel

**"Ticket System Issues"**
- Ensure bot has "Manage Channels" and "Manage Roles" permissions
- Check if Support role exists or can be created

## 🔄 **Updates and Maintenance**

The bot is designed to be:
- **Lightweight:** No database dependencies
- **Maintainable:** Modular code structure
- **Extensible:** Easy to add new features
- **Reliable:** Comprehensive error handling

## 📞 **Support**

For issues or questions:
1. Check the troubleshooting section
2. Verify bot permissions
3. Check console logs for detailed error messages
4. Ensure all required files are present

## 🎉 **Features Summary**

✅ **10 Complete Systems** - All requested features implemented
✅ **Velari Design** - Consistent branding and styling
✅ **No Database** - Lightweight memory-based storage
✅ **Permission System** - Role-based access control
✅ **Error Handling** - Comprehensive error management
✅ **Anti-Spam/Raid** - Basic protection systems
✅ **Modal Support** - Interactive forms for better UX
✅ **Button Interactions** - Modern Discord UI components
✅ **Event Handling** - Welcome/goodbye and message tracking
✅ **Utility Commands** - Server info, user info, bot info

The bot is now fully functional with all requested features implemented and ready for use in your Discord server! 