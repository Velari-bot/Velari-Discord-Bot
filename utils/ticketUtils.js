import { PermissionFlagsBits, ChannelType } from 'discord.js';

/**
 * Check if a user already has an open ticket
 * @param {Guild} guild - The Discord guild
 * @param {User} user - The user to check
 * @returns {TextChannel|null} - The existing ticket channel or null
 */
export function getUserTicket(guild, user) {
    return guild.channels.cache.find(channel => 
        channel.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}` &&
        channel.type === ChannelType.GuildText
    );
}

/**
 * Generate a safe channel name for tickets
 * @param {string} username - The username to convert
 * @returns {string} - Safe channel name
 */
export function generateTicketChannelName(username) {
    return `ticket-${username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

/**
 * Get or create the Support role
 * @param {Guild} guild - The Discord guild
 * @returns {Promise<Role>} - The Support role
 */
export async function getOrCreateSupportRole(guild) {
    let supportRole = guild.roles.cache.find(role => role.name === 'Support');
    
    if (!supportRole) {
        supportRole = await guild.roles.create({
            name: 'Support',
            color: '#FF6B9D',
            reason: 'Ticket system support role'
        });
    }
    
    return supportRole;
}

/**
 * Create permission overwrites for a ticket channel
 * @param {Guild} guild - The Discord guild
 * @param {User} user - The ticket creator
 * @param {Role} supportRole - The support role
 * @returns {Array} - Array of permission overwrites
 */
export function createTicketPermissions(guild, user, supportRole) {
    return [
        {
            id: guild.id, // @everyone role
            deny: [PermissionFlagsBits.ViewChannel]
        },
        {
            id: user.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
            ]
        },
        {
            id: supportRole.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages
            ]
        }
    ];
}

/**
 * Check if a user has permission to manage tickets
 * @param {GuildMember} member - The guild member
 * @param {Role} supportRole - The support role
 * @returns {boolean} - Whether the user has permission
 */
export function hasTicketPermission(member, supportRole) {
    return member.permissions.has(PermissionFlagsBits.ManageChannels) || 
           (supportRole && member.roles.cache.has(supportRole.id));
}

/**
 * Validate ticket channel name
 * @param {string} channelName - The channel name to validate
 * @returns {boolean} - Whether it's a valid ticket channel
 */
export function isValidTicketChannel(channelName) {
    return channelName.startsWith('ticket-');
}

/**
 * Extract username from ticket channel name
 * @param {string} channelName - The ticket channel name
 * @returns {string|null} - The username or null if invalid
 */
export function extractUsernameFromTicket(channelName) {
    if (!isValidTicketChannel(channelName)) {
        return null;
    }
    
    return channelName.replace('ticket-', '');
} 