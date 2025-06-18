export const ALLOWED_ROLES = ["1381867186058035271", "1381867004734210058", "1299135105524043850", "1384641055244419133"]
export const OVERRIDE_ROLES = ["1381851604109623369", "1381794416586391675"];
export const CHANNEL_IDS = {
  welcome: '1369435023899496498',
  rules: '1369435178971172984',
  announcements: '1369435271002591232',
  pricing: '1382467465572913172',
  faq: '1382467481733435486',
  status: '1382467501622821076',
  orderHere: '1382467920063496232',
  showcase: '1382467953789894677',
  packageAddon: '1382467968826478592',
  reviews: '1382467982004846632',
  generalChat: '1369436802837905458',
  ticket: '1370521751456317531',
  orderTracking: '1382468168509034647',
  logs: '1369444382390091927'
};

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

export const ROLES = {
  admin: '1299135105524043850',
  staff: '1369475244712001607',
  owner: '1369500147280773180',
  verifiedClient: '1382471978388164729'
}; 