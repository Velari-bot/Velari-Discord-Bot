# 🎫 Discord Ticket System

A comprehensive Discord.js v14+ ticket system with slash commands and button interactions, featuring Velari-style design with no database requirements.

## ✨ Features

- **🎫 Ticket Panel Setup** - Create beautiful ticket panels with `/ticket setup`
- **🔒 Private Channels** - Each ticket creates a private channel visible only to the user and support team
- **🛡️ Duplicate Prevention** - Users can only have one open ticket at a time
- **⚡ Quick Response** - Instant ticket creation with button interactions
- **🎨 Velari Design** - Modern, bold design with pink/orange color scheme
- **🔧 No Database** - Uses channel names and permissions for tracking
- **🛡️ Permission System** - Role-based access control for support team
- **⏰ Auto Cleanup** - Tickets automatically close after 5 seconds when requested

## 🚀 Quick Start

### 1. Setup the Ticket Panel

Use the slash command to create a ticket panel:

```
/ticket setup #channel: #support-tickets
```

This will post a beautiful embed with a "🎫 Create Ticket" button in the specified channel.

### 2. User Creates a Ticket

When a user clicks the "🎫 Create Ticket" button:
- ✅ Checks if they already have an open ticket
- ✅ Creates a private channel named `ticket-username`
- ✅ Sets up proper permissions (user + Support role only)
- ✅ Sends a welcome message with close button

### 3. Support Team Responds

Support team members (with "Support" role) can:
- ✅ View and respond to tickets
- ✅ Manage messages in ticket channels
- ✅ Close tickets when resolved

### 4. Closing Tickets

When the "🔒 Close Ticket" button is clicked:
- ✅ Shows confirmation message
- ✅ Deletes the channel after 5 seconds
- ✅ Only works in ticket channels
- ✅ Requires proper permissions

## 🛠️ Configuration

The ticket system is fully configurable through `config.js`:

```javascript
export const TICKET_CONFIG = {
    SUPPORT_ROLE_NAME: "Support",
    CHANNEL_NAME_PATTERN: "ticket-{username}",
    COLORS: {
        PRIMARY: "#FF6B9D",    // Pink
        SUCCESS: "#4CAF50",    // Green
        WARNING: "#FF9800",    // Orange
        ERROR: "#F44336"       // Red
    },
    CLOSE_DELAY: 5000,
    // ... more configuration options
};
```

## 📁 File Structure

```
embed builder/
├── commands/
│   └── ticket.js              # Main ticket command
├── utils/
│   └── ticketUtils.js         # Utility functions
├── config.js                  # Configuration (updated)
├── index.js                   # Main bot file (updated)
└── deploy-commands.js         # Command deployment
```

## 🔧 Required Permissions

The bot needs these permissions:
- **Manage Channels** - To create and delete ticket channels
- **Manage Roles** - To create the Support role if it doesn't exist
- **Send Messages** - To send embeds and buttons
- **Use Slash Commands** - To register and use slash commands
- **View Channels** - To access channels for ticket creation

## 🎨 Velari Design Features

- **Bold Text** - All important text uses Discord's bold formatting
- **Modern Emojis** - 🎫 for tickets, 🔒 for closing, ✅ for success, ❌ for errors
- **Pink/Orange Colors** - Primary color #FF6B9D (pink) for consistency
- **Clean Layout** - Minimal, modern design with clear hierarchy
- **Professional Footer** - "Velari Support System" branding

## 🛡️ Security Features

- **Permission Checks** - All actions verify user permissions
- **Channel Validation** - Close button only works in ticket channels
- **Role-Based Access** - Support team access controlled by role
- **Duplicate Prevention** - Users can't create multiple tickets
- **Ephemeral Responses** - Sensitive messages are ephemeral

## 🔄 Error Handling

The system includes comprehensive error handling:
- ✅ Permission denied messages
- ✅ Channel creation failures
- ✅ Role creation failures
- ✅ Invalid channel operations
- ✅ Network/API errors

## 📝 Usage Examples

### For Administrators:
```
/ticket setup #support-tickets
```
Creates a ticket panel in the #support-tickets channel.

### For Users:
1. Click "🎫 Create Ticket" button
2. Describe your issue in the private channel
3. Wait for support team response
4. Click "🔒 Close Ticket" when resolved

### For Support Team:
1. Get assigned the "Support" role
2. View and respond to tickets
3. Use "🔒 Close Ticket" button to close resolved tickets

## 🚨 Troubleshooting

### Common Issues:

**"You already have an open ticket"**
- User already has a ticket channel open
- Solution: Use existing ticket or wait for it to be closed

**"Failed to create Support role"**
- Bot lacks "Manage Roles" permission
- Solution: Grant the bot "Manage Roles" permission

**"Failed to create ticket channel"**
- Bot lacks "Manage Channels" permission
- Solution: Grant the bot "Manage Channels" permission

**"You do not have permission to close tickets"**
- User doesn't have Support role or Manage Channels permission
- Solution: Assign Support role or grant Manage Channels permission

## 🔄 Updates and Maintenance

The ticket system is designed to be:
- **Lightweight** - No database dependencies
- **Maintainable** - Modular code structure
- **Extensible** - Easy to add new features
- **Reliable** - Comprehensive error handling

## 📞 Support

For issues or questions about the ticket system:
1. Check the troubleshooting section above
2. Verify bot permissions
3. Check console logs for detailed error messages
4. Ensure all required files are present and properly configured 