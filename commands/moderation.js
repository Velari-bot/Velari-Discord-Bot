import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { TICKET_CONFIG } from '../config.js';
import { db } from '../firebase/firebase.js';

export const data = new SlashCommandBuilder()
    .setName('moderation')
    .setDescription('Moderation commands')
    .addSubcommand(subcommand =>
        subcommand
            .setName('ban')
            .setDescription('Ban a user from the server')
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('User to ban')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('Reason for ban')
                    .setRequired(false)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('kick')
            .setDescription('Kick a user from the server')
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('User to kick')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('Reason for kick')
                    .setRequired(false)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('timeout')
            .setDescription('Timeout a user')
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('User to timeout')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('duration')
                    .setDescription('Duration (e.g., 1h, 30m, 1d)')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('Reason for timeout')
                    .setRequired(false)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('warn')
            .setDescription('Warn a user')
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('User to warn')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('Reason for warning')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('modlogs')
            .setDescription('View moderation logs for a user')
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('User to check logs for')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('purge')
            .setDescription('Delete multiple messages')
            .addIntegerOption(option =>
                option
                    .setName('amount')
                    .setDescription('Number of messages to delete (1-100)')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(100)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('snipe')
            .setDescription('Show the last deleted message')
    );

export async function execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'ban':
            await handleBan(interaction, client);
            break;
        case 'kick':
            await handleKick(interaction, client);
            break;
        case 'timeout':
            await handleTimeout(interaction, client);
            break;
        case 'warn':
            await handleWarn(interaction, client);
            break;
        case 'modlogs':
            await handleModlogs(interaction, client);
            break;
        case 'purge':
            await handlePurge(interaction, client);
            break;
        case 'snipe':
            await handleSnipe(interaction, client);
            break;
    }
}

async function handleBan(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return await interaction.reply({
            content: '❌ **You need "Ban Members" permission to use this command.**',
            flags: 64
        });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id);

    if (!member.bannable) {
        return await interaction.reply({
            content: '❌ **I cannot ban this user. They may have higher permissions than me.**',
            flags: 64
        });
    }

    try {
        await member.ban({ reason: `Banned by ${interaction.user.tag}: ${reason}` });
        
        const embed = new EmbedBuilder()
            .setTitle('🔨 **User Banned**')
            .setDescription(`**User:** ${user.tag} (${user.id})\n**Reason:** ${reason}\n**Banned by:** ${interaction.user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setColor(TICKET_CONFIG.COLORS.ERROR)
            .setFooter({ text: 'Velari Moderation System', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        
        // Store in modlogs
        await storeModAction(client, interaction.guild.id, user.id, 'ban', reason, interaction.user.id);
        
    } catch (error) {
        console.error('Error banning user:', error);
        await interaction.reply({
            content: '❌ **Failed to ban the user. Please try again.**',
            flags: 64
        });
    }
}

async function handleKick(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return await interaction.reply({
            content: '❌ **You need "Kick Members" permission to use this command.**',
            flags: 64
        });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id);

    if (!member.kickable) {
        return await interaction.reply({
            content: '❌ **I cannot kick this user. They may have higher permissions than me.**',
            flags: 64
        });
    }

    try {
        await member.kick(`Kicked by ${interaction.user.tag}: ${reason}`);
        
        const embed = new EmbedBuilder()
            .setTitle('👢 **User Kicked**')
            .setDescription(`**User:** ${user.tag} (${user.id})\n**Reason:** ${reason}\n**Kicked by:** ${interaction.user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setColor(TICKET_CONFIG.COLORS.WARNING)
            .setFooter({ text: 'Velari Moderation System', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        
        // Store in modlogs
        await storeModAction(client, interaction.guild.id, user.id, 'kick', reason, interaction.user.id);
        
    } catch (error) {
        console.error('Error kicking user:', error);
        await interaction.reply({
            content: '❌ **Failed to kick the user. Please try again.**',
            flags: 64
        });
    }
}

async function handleTimeout(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return await interaction.reply({
            content: '❌ **You need "Moderate Members" permission to use this command.**',
            flags: 64
        });
    }

    const user = interaction.options.getUser('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id);

    // Parse duration
    const duration = parseDuration(durationStr);
    if (!duration) {
        return await interaction.reply({
            content: '❌ **Invalid duration format. Use: 1s, 1m, 1h, 1d (max 28 days)**',
            flags: 64
        });
    }

    if (duration > 28 * 24 * 60 * 60 * 1000) { // 28 days in ms
        return await interaction.reply({
            content: '❌ **Timeout duration cannot exceed 28 days.**',
            flags: 64
        });
    }

    try {
        await member.timeout(duration, `Timed out by ${interaction.user.tag}: ${reason}`);
        
        const embed = new EmbedBuilder()
            .setTitle('⏰ **User Timed Out**')
            .setDescription(`**User:** ${user.tag} (${user.id})\n**Duration:** ${formatDuration(duration)}\n**Reason:** ${reason}\n**Timed out by:** ${interaction.user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setColor(TICKET_CONFIG.COLORS.WARNING)
            .setFooter({ text: 'Velari Moderation System', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        
        // Store in modlogs
        await storeModAction(client, interaction.guild.id, user.id, 'timeout', reason, interaction.user.id);
        
    } catch (error) {
        console.error('Error timing out user:', error);
        await interaction.reply({
            content: '❌ **Failed to timeout the user. Please try again.**',
            flags: 64
        });
    }
}

async function handleWarn(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return await interaction.reply({
            content: '❌ **You need "Moderate Members" permission to use this command.**',
            flags: 64
        });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    try {
        const embed = new EmbedBuilder()
            .setTitle('⚠️ **User Warned**')
            .setDescription(`**User:** ${user.tag} (${user.id})\n**Reason:** ${reason}\n**Warned by:** ${interaction.user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setColor(TICKET_CONFIG.COLORS.WARNING)
            .setFooter({ text: 'Velari Moderation System', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        
        // Store in modlogs
        await storeModAction(client, interaction.guild.id, user.id, 'warn', reason, interaction.user.id);
        
    } catch (error) {
        console.error('Error warning user:', error);
        await interaction.reply({
            content: '❌ **Failed to warn the user. Please try again.**',
            flags: 64
        });
    }
}

async function handleModlogs(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return await interaction.reply({
            content: '❌ **You need "Moderate Members" permission to use this command.**',
            flags: 64
        });
    }

    const user = interaction.options.getUser('user');
    const logs = await getModLogs(client, interaction.guild.id, user.id);

    if (!logs || logs.length === 0) {
        return await interaction.reply({
            content: `📋 **No moderation logs found for ${user.tag}.**`,
            flags: 64
        });
    }

    const embed = new EmbedBuilder()
        .setTitle('📋 **Moderation Logs**')
        .setDescription(`**User:** ${user.tag} (${user.id})`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setColor(TICKET_CONFIG.COLORS.PRIMARY)
        .setFooter({ text: 'Velari Moderation System', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

    // Add logs to embed (limit to 10 most recent)
    const recentLogs = logs.slice(-10);
    for (const log of recentLogs) {
        const moderator = await interaction.client.users.fetch(log.moderatorId).catch(() => ({ tag: 'Unknown' }));
        embed.addFields({
            name: `${getActionEmoji(log.action)} ${log.action.toUpperCase()}`,
            value: `**Reason:** ${log.reason}\n**Moderator:** ${moderator.tag}\n**Date:** <t:${Math.floor(log.timestamp / 1000)}:R>`,
            inline: false
        });
    }

    await interaction.reply({ embeds: [embed], flags: 64 });
}

async function handlePurge(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return await interaction.reply({
            content: '❌ **You need "Manage Messages" permission to use this command.**',
            flags: 64
        });
    }

    const amount = interaction.options.getInteger('amount');

    try {
        const messages = await interaction.channel.messages.fetch({ limit: amount });
        const filteredMessages = messages.filter(msg => !msg.pinned);
        
        if (filteredMessages.size === 0) {
            return await interaction.reply({
                content: '❌ **No messages found to delete.**',
                flags: 64
            });
        }

        await interaction.channel.bulkDelete(filteredMessages);
        
        const embed = new EmbedBuilder()
            .setTitle('🧹 **Messages Purged**')
            .setDescription(`**Deleted ${filteredMessages.size} messages**\n**Channel:** ${interaction.channel.toString()}\n**Purged by:** ${interaction.user.tag}`)
            .setColor(TICKET_CONFIG.COLORS.SUCCESS)
            .setFooter({ text: 'Velari Moderation System', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
        
    } catch (error) {
        console.error('Error purging messages:', error);
        await interaction.reply({
            content: '❌ **Failed to delete messages. Messages older than 14 days cannot be bulk deleted.**',
            flags: 64
        });
    }
}

async function handleSnipe(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return await interaction.reply({
            content: '❌ **You need "Manage Messages" permission to use this command.**',
            flags: 64
        });
    }

    const channelId = interaction.channel.id;
    const lastDeletedMessage = client.snipedMessages?.get(channelId);

    if (!lastDeletedMessage) {
        return await interaction.reply({
            content: '❌ **No recently deleted messages found in this channel.**',
            flags: 64
        });
    }

    const embed = new EmbedBuilder()
        .setTitle('🎯 **Last Deleted Message**')
        .setDescription(`**Author:** ${lastDeletedMessage.author.tag}\n**Content:** ${lastDeletedMessage.content || '*No content*'}`)
        .setThumbnail(lastDeletedMessage.author.displayAvatarURL({ dynamic: true }))
        .setColor(TICKET_CONFIG.COLORS.PRIMARY)
        .setFooter({ text: 'Velari Moderation System', iconURL: interaction.guild.iconURL() })
        .setTimestamp(lastDeletedMessage.timestamp);

    await interaction.reply({ embeds: [embed], flags: 64 });
}

// Utility functions
function parseDuration(durationStr) {
    const match = durationStr.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day(s)`;
    if (hours > 0) return `${hours} hour(s)`;
    if (minutes > 0) return `${minutes} minute(s)`;
    return `${seconds} second(s)`;
}

function getActionEmoji(action) {
    switch (action) {
        case 'ban': return '🔨';
        case 'kick': return '👢';
        case 'timeout': return '⏰';
        case 'warn': return '⚠️';
        default: return '📝';
    }
}

// Store moderation action in memory
async function storeModAction(client, guildId, userId, action, reason, moderatorId) {
    if (!client.modLogs) client.modLogs = new Map();
    if (!client.modLogs.has(guildId)) {
        client.modLogs.set(guildId, new Map());
    }
    
    const guildLogs = client.modLogs.get(guildId);
    if (!guildLogs.has(userId)) {
        guildLogs.set(userId, []);
    }
    
    const userLogs = guildLogs.get(userId);
    userLogs.push({
        action,
        reason,
        moderatorId,
        timestamp: Date.now()
    });
    
    // Keep only last 50 logs per user
    if (userLogs.length > 50) {
        userLogs.splice(0, userLogs.length - 50);
    }
}

// Get moderation logs for a user
async function getModLogs(client, guildId, userId) {
    if (!client.modLogs) return [];
    const guildLogs = client.modLogs.get(guildId);
    if (!guildLogs) return [];
    return guildLogs.get(userId) || [];
}

// Export for use in index.js
export function storeDeletedMessage(client, channelId, message) {
    if (!client.snipedMessages) client.snipedMessages = new Map();
    client.snipedMessages.set(channelId, {
        content: message.content,
        author: message.author,
        timestamp: message.createdTimestamp
    });
} 