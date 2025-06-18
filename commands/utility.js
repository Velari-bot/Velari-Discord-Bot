import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { TICKET_CONFIG, CHANNEL_IDS } from '../config.js';
import { db } from '../firebase/firebase.js';

export const data = new SlashCommandBuilder()
    .setName('utility')
    .setDescription('Utility commands')
    .addSubcommand(subcommand =>
        subcommand
            .setName('serverinfo')
            .setDescription('Show server information')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('userinfo')
            .setDescription('Show user information')
            .addUserOption(option =>
                option.setName('user').setDescription('User to get info for').setRequired(false)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('botinfo')
            .setDescription('Show bot information')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('announce')
            .setDescription('Make an announcement')
            .addChannelOption(option =>
                option.setName('channel').setDescription('Channel to announce in').setRequired(true).addChannelTypes(ChannelType.GuildText)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('remindme')
            .setDescription('Set a reminder')
            .addStringOption(option =>
                option.setName('time').setDescription('When to remind (e.g., 1h, 30m, 1d)').setRequired(true)
            )
            .addStringOption(option =>
                option.setName('message').setDescription('Reminder message').setRequired(true)
            )
    );

export async function execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'serverinfo':
            await handleServerInfo(interaction, client);
            break;
        case 'userinfo':
            await handleUserInfo(interaction, client);
            break;
        case 'botinfo':
            await handleBotInfo(interaction, client);
            break;
        case 'announce':
            await handleAnnounce(interaction, client);
            break;
        case 'remindme':
            await handleRemindMe(interaction, client);
            break;
    }
}

async function handleServerInfo(interaction, client) {
    const guild = interaction.guild;
    const owner = await guild.fetchOwner();
    
    const embed = new EmbedBuilder()
        .setTitle('🏠 **Server Information**')
        .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
        .setColor(TICKET_CONFIG.COLORS.PRIMARY)
        .addFields(
            { name: '**Server Name**', value: guild.name, inline: true },
            { name: '**Server ID**', value: guild.id, inline: true },
            { name: '**Owner**', value: owner.user.tag, inline: true },
            { name: '**Created**', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '**Members**', value: `${guild.memberCount}`, inline: true },
            { name: '**Channels**', value: `${guild.channels.cache.size}`, inline: true },
            { name: '**Roles**', value: `${guild.roles.cache.size}`, inline: true },
            { name: '**Boost Level**', value: `${guild.premiumTier}`, inline: true },
            { name: '**Boosts**', value: `${guild.premiumSubscriptionCount || 0}`, inline: true }
        )
        .setFooter({ text: 'Velari Utility System', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleUserInfo(interaction, client) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id);
    
    const roles = member.roles.cache
        .filter(role => role.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(role => role.toString())
        .slice(0, 10)
        .join(', ') || 'None';

    const embed = new EmbedBuilder()
        .setTitle('👤 **User Information**')
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setColor(TICKET_CONFIG.COLORS.PRIMARY)
        .addFields(
            { name: '**Username**', value: user.tag, inline: true },
            { name: '**User ID**', value: user.id, inline: true },
            { name: '**Nickname**', value: member.nickname || 'None', inline: true },
            { name: '**Joined Server**', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
            { name: '**Account Created**', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '**Top Role**', value: member.roles.highest.toString(), inline: true },
            { name: '**Roles**', value: roles.length > 1024 ? roles.substring(0, 1021) + '...' : roles, inline: false }
        )
        .setFooter({ text: 'Velari Utility System', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleBotInfo(interaction, client) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const embed = new EmbedBuilder()
        .setTitle('🤖 **Bot Information**')
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setColor(TICKET_CONFIG.COLORS.PRIMARY)
        .addFields(
            { name: '**Bot Name**', value: client.user.tag, inline: true },
            { name: '**Bot ID**', value: client.user.id, inline: true },
            { name: '**Created**', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '**Uptime**', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
            { name: '**Servers**', value: `${client.guilds.cache.size}`, inline: true },
            { name: '**Users**', value: `${client.users.cache.size}`, inline: true },
            { name: '**Ping**', value: `${client.ws.ping}ms`, inline: true },
            { name: '**Node.js**', value: process.version, inline: true },
            { name: '**Discord.js**', value: 'v14.14.1', inline: true }
        )
        .setFooter({ text: 'Velari Bot System', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleAnnounce(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return await interaction.reply({
            content: '❌ **You need "Manage Messages" permission to make announcements.**',
            ephemeral: true
        });
    }

    const channel = interaction.options.getChannel('channel');

    // Create modal for announcement
    const modal = new ModalBuilder()
        .setCustomId('announcement_modal')
        .setTitle('📢 Create Announcement');

    const titleInput = new TextInputBuilder()
        .setCustomId('announcement_title')
        .setLabel('Announcement Title')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter the announcement title...')
        .setRequired(true)
        .setMaxLength(256);

    const messageInput = new TextInputBuilder()
        .setCustomId('announcement_message')
        .setLabel('Announcement Message')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Enter the announcement message...')
        .setRequired(true)
        .setMaxLength(2000);

    const pingInput = new TextInputBuilder()
        .setCustomId('announcement_ping')
        .setLabel('Ping Role (optional)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('@everyone, @here, or role name')
        .setRequired(false)
        .setMaxLength(100);

    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder().addComponents(messageInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(pingInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    // Store channel ID for modal submission
    if (!client.announcementData) client.announcementData = new Map();
    client.announcementData.set(interaction.user.id, { channelId: channel.id });

    await interaction.showModal(modal);
}

async function handleRemindMe(interaction, client) {
    const timeStr = interaction.options.getString('time');
    const message = interaction.options.getString('message');

    // Parse time
    const duration = parseDuration(timeStr);
    if (!duration) {
        return await interaction.reply({
            content: '❌ **Invalid time format. Use: 1s, 1m, 1h, 1d**',
            ephemeral: true
        });
    }

    if (duration < 60000) { // Less than 1 minute
        return await interaction.reply({
            content: '❌ **Reminder must be at least 1 minute in the future.**',
            ephemeral: true
        });
    }

    if (duration > 7 * 24 * 60 * 60 * 1000) { // More than 7 days
        return await interaction.reply({
            content: '❌ **Reminder cannot be more than 7 days in the future.**',
            ephemeral: true
        });
    }

    const reminderTime = Date.now() + duration;

    // Store reminder
    if (!client.reminders) client.reminders = new Map();
    const reminderId = Date.now().toString();
    client.reminders.set(reminderId, {
        userId: interaction.user.id,
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        message: message,
        time: reminderTime
    });

    // Set timeout
    setTimeout(async () => {
        await sendReminder(client, reminderId);
    }, duration);

    const embed = new EmbedBuilder()
        .setTitle('⏰ **Reminder Set**')
        .setDescription(`**I'll remind you in ${formatDuration(duration)}**\n\n**Message:** ${message}`)
        .setColor(TICKET_CONFIG.COLORS.SUCCESS)
        .setFooter({ text: 'Velari Reminder System', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Export functions for use in index.js
export async function handleAnnouncementModal(interaction, client) {
    const title = interaction.fields.getTextInputValue('announcement_title');
    const message = interaction.fields.getTextInputValue('announcement_message');
    const ping = interaction.fields.getTextInputValue('announcement_ping');

    const announcementData = client.announcementData?.get(interaction.user.id);
    if (!announcementData) {
        return await interaction.reply({
            content: '❌ **Announcement data not found. Please try again.**',
            ephemeral: true
        });
    }

    const channel = await interaction.guild.channels.fetch(announcementData.channelId);
    if (!channel) {
        return await interaction.reply({
            content: '❌ **Channel not found. Please try again.**',
            ephemeral: true
        });
    }

    let pingText = '';
    if (ping) {
        if (ping.toLowerCase() === '@everyone') {
            pingText = '@everyone ';
        } else if (ping.toLowerCase() === '@here') {
            pingText = '@here ';
        } else {
            const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === ping.toLowerCase());
            if (role) {
                pingText = `${role} `;
            }
        }
    }

    const embed = new EmbedBuilder()
        .setTitle(`📢 **${title}**`)
        .setDescription(message)
        .setColor(TICKET_CONFIG.COLORS.PRIMARY)
        .setFooter({ text: `Announced by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

    try {
        await channel.send({ content: pingText, embeds: [embed] });
        
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ **Announcement Sent**')
            .setDescription(`**Your announcement has been sent to ${channel.toString()}**`)
            .setColor(TICKET_CONFIG.COLORS.SUCCESS)
            .setFooter({ text: 'Velari Announcement System', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        
        // Clean up
        client.announcementData.delete(interaction.user.id);
        
    } catch (error) {
        console.error('Error sending announcement:', error);
        await interaction.reply({
            content: '❌ **Failed to send announcement. Please check my permissions in the channel.**',
            ephemeral: true
        });
    }
}

async function sendReminder(client, reminderId) {
    const reminder = client.reminders.get(reminderId);
    if (!reminder) return;

    try {
        const guild = await client.guilds.fetch(reminder.guildId);
        const channel = await guild.channels.fetch(reminder.channelId);
        const user = await client.users.fetch(reminder.userId);

        const embed = new EmbedBuilder()
            .setTitle('⏰ **Reminder**')
            .setDescription(`**Hey ${user}!**\n\n**You asked me to remind you:**\n${reminder.message}`)
            .setColor(TICKET_CONFIG.COLORS.PRIMARY)
            .setFooter({ text: 'Velari Reminder System', iconURL: guild.iconURL() })
            .setTimestamp();

        await channel.send({ content: `${user}`, embeds: [embed] });
        
        // Clean up
        client.reminders.delete(reminderId);
        
    } catch (error) {
        console.error('Error sending reminder:', error);
        client.reminders.delete(reminderId);
    }
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
