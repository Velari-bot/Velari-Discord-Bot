export const ALLOWED_ROLES = ["1381867004734210058", "1381867079690354730", "1381867136477167697"];
export const OVERRIDE_ROLES = ["1381867186058035271", "1381867249849208892"];
export const LOG_CHANNEL_ID = "1381867339515039794"; // Replace with your #embed-logs channel ID 

// Ticket System Configuration
export const TICKET_CONFIG = {
    // Support role name (will be created if it doesn't exist)
    SUPPORT_ROLE_NAME: "Support",
    
    // Ticket channel naming pattern
    CHANNEL_NAME_PATTERN: "ticket-{username}",
    
    // Embed colors (Velari style)
    COLORS: {
        PRIMARY: "#FF6B9D",    // Pink
        SUCCESS: "#4CAF50",    // Green
        WARNING: "#FF9800",    // Orange
        ERROR: "#F44336"       // Red
    },
    
    // Ticket close delay (in milliseconds)
    CLOSE_DELAY: 5000,
    
    // Default embed messages
    MESSAGES: {
        PANEL_TITLE: "🎫 **Support Tickets**",
        PANEL_DESCRIPTION: "**Need help? Create a ticket and our support team will assist you!**\n\n• **Quick Response** - Get help within minutes\n• **Private Channel** - Your conversation stays confidential\n• **Expert Support** - Our team is here to help\n\n**Click the button below to create a ticket!**",
        WELCOME_TITLE: "🎫 **Ticket Created**",
        WELCOME_DESCRIPTION: "**Welcome {user}!**\n\n**Your support ticket has been created.**\n\n• **Please describe your issue** in detail\n• **Be patient** - our support team will respond soon\n• **Stay on topic** - keep the conversation relevant\n\n**A support team member will assist you shortly!**",
        CLOSING_TITLE: "🔒 **Ticket Closing**",
        CLOSING_DESCRIPTION: "**This ticket will be closed in 5 seconds.**\n\n**Closed by:** {user}\n**Reason:** User requested closure\n\n**Thank you for using our support system!**"
    },
    
    // Button labels
    BUTTONS: {
        CREATE_TICKET: "🎫 Create Ticket",
        CLOSE_TICKET: "🔒 Close Ticket"
    }
}; 