import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } from 'discord.js';
import { TICKET_CONFIG, CHANNEL_IDS, ALLOWED_ROLES, OVERRIDE_ROLES, ROLES } from '../config.js';
import { getUserTicket, generateTicketChannelName, getOrCreateSupportRole, createTicketPermissions, hasTicketPermission, isValidTicketChannel } from '../utils/ticketUtils.js';
import { db } from '../firebase/firebase.js';
import { hasSupportPermission, getSupportRole, isServerConfigured } from '../utils/serverRoles.js';

// Helper to load ticket config from Firestore
async function loadTicketConfig(guildId, client) {
    if (!client.ticketConfig) client.ticketConfig = {};
    if (client.ticketConfig[guildId]) return client.ticketConfig[guildId];
    const doc = await db.collection('ticketConfig').doc(guildId).get();
    if (doc.exists) {
        client.ticketConfig[guildId] = doc.data();
        return doc.data();
    } else {
        // Default config
        const def = {
            ticketLogChannelId: null
        };
        client.ticketConfig[guildId] = def;
        return def;
    }
}

function generateOrderId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const SUPPORT_ROLE_NAME = 'Support Team'; // Default, can be made configurable

export const data = new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Manage the ticket system')
    .addSubcommand(subcommand =>
        subcommand
            .setName('setup')
            .setDescription('Setup the ticket panel')
            .addChannelOption(option =>
                option
                    .setName('channel')
                    .setDescription('Channel to post the ticket panel')
                    .setRequired(true)
                    .addChannelTypes(ChannelType.GuildText)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('close')
            .setDescription('Close the current ticket')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('panel')
            .setDescription('Send the ticket creation panel for users to open a ticket.')
    );

export async function execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'setup') {
        await handleTicketSetup(interaction, client);
    } else if (subcommand === 'close') {
        await handleCloseTicket(interaction, client);
    } else if (subcommand === 'panel') {
        await handleTicketPanel(interaction);
    }
}

async function handleTicketSetup(interaction, client) {
    // Check if user has permission to manage channels
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return await interaction.reply({
            content: '❌ **You need the "Manage Channels" permission to setup the ticket system.**',
            ephemeral: true
        });
    }

    const channel = interaction.options.getChannel('channel');

    // Create the ticket panel embed
    const embed = new EmbedBuilder()
        .setTitle(TICKET_CONFIG.MESSAGES.PANEL_TITLE)
        .setDescription(TICKET_CONFIG.MESSAGES.PANEL_DESCRIPTION)
        .setColor(TICKET_CONFIG.COLORS.PRIMARY)
        .setFooter({ text: 'Velari Support System', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

    // Create the create ticket button
    const createButton = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel(TICKET_CONFIG.BUTTONS.CREATE_TICKET)
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎫')
        );

    try {
        await channel.send({
            embeds: [embed],
            components: [createButton]
        });

        await interaction.reply({
            content: `✅ **Ticket panel has been successfully setup in ${channel.toString()}!**`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Error setting up ticket panel:', error);
        await interaction.reply({
            content: '❌ **Failed to setup ticket panel. Please check my permissions in the channel.**',
            ephemeral: true
        });
    }
}

async function handleCloseTicket(interaction, client) {
    const channel = interaction.channel;
    const user = interaction.user;

    // Check if this is actually a ticket channel
    if (!isValidTicketChannel(channel.name)) {
        return await interaction.reply({
            content: '❌ **This command can only be used in ticket channels.**',
            ephemeral: true
        });
    }

    // Check if server is configured
    const configured = await isServerConfigured(interaction.guild.id);
    if (!configured) {
        return await interaction.reply({
            content: '❌ **This server has not been configured yet. Please use `/setup` to configure the bot first.**',
            ephemeral: true
        });
    }

    // Check if user has permission to close tickets
    const hasPermission = await hasSupportPermission(interaction.member);
    if (!hasPermission) {
        return await interaction.reply({
            content: '❌ **You do not have permission to close tickets.**',
            ephemeral: true
        });
    }

    // Create confirmation embed
    const confirmEmbed = new EmbedBuilder()
        .setTitle(TICKET_CONFIG.MESSAGES.CLOSING_TITLE)
        .setDescription(TICKET_CONFIG.MESSAGES.CLOSING_DESCRIPTION.replace('{user}', user.tag))
        .setColor(TICKET_CONFIG.COLORS.PRIMARY)
        .setFooter({ text: 'Velari Support System', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

    await interaction.reply({
        embeds: [confirmEmbed]
    });

    // Delete the channel after the configured delay
    setTimeout(async () => {
        try {
            await channel.delete();
        } catch (error) {
            console.error('Error deleting ticket channel:', error);
        }
    }, TICKET_CONFIG.CLOSE_DELAY);
}

async function handleTicketPanel(interaction) {
    // Only allow admins to use this command
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ You need Manage Server permission to use this command.', ephemeral: true });
    }
    const embed = new EmbedBuilder()
        .setTitle('🎫 Open a Support Ticket')
        .setDescription('Click the button below to open a ticket and get help from our team!')
        .setColor(0x5865F2);
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('open_ticket')
            .setLabel('Open Ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎫')
    );
    await interaction.reply({ embeds: [embed], components: [row] });
}

// Export button handlers for use in index.js
export async function handleCreateTicket(interaction, client) {
    // Show modal with four fields (all text inputs)
    const modal = new ModalBuilder()
        .setCustomId('ticket_modal')
        .setTitle('📝 New Ticket');

    const serviceInput = new TextInputBuilder()
        .setCustomId('ticket_service')
        .setLabel('Service (e.g., Bot, Website, GFX)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const descriptionInput = new TextInputBuilder()
        .setCustomId('ticket_description')
        .setLabel('Describe your issue or request')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const deadlineInput = new TextInputBuilder()
        .setCustomId('ticket_deadline')
        .setLabel('Deadline? (optional)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    const linksInput = new TextInputBuilder()
        .setCustomId('ticket_links')
        .setLabel('Links or files? (optional)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder().addComponents(serviceInput),
        new ActionRowBuilder().addComponents(descriptionInput),
        new ActionRowBuilder().addComponents(deadlineInput),
        new ActionRowBuilder().addComponents(linksInput)
    );

    await interaction.showModal(modal);
}

// Export modal handler for use in index.js
export async function handleTicketModal(interaction, client) {
    // Check if server is configured
    const configured = await isServerConfigured(interaction.guild.id);
    if (!configured) {
        return await interaction.reply({
            content: '❌ **This server has not been configured yet. Please use `/setup` to configure the bot first.**',
            ephemeral: true
        });
    }

    // Get answers
    const service = interaction.fields.getTextInputValue('ticket_service');
    const description = interaction.fields.getTextInputValue('ticket_description');
    const deadline = interaction.fields.getTextInputValue('ticket_deadline') || 'Not specified';
    const links = interaction.fields.getTextInputValue('ticket_links') || 'None';
    const orderId = generateOrderId();

    // Create ticket channel (existing logic, simplified for brevity)
    const guild = interaction.guild;
    const channelName = `ticket-${interaction.user.username}`;
    let ticketChannel;
    
    try {
        // Get support role from server config
        const supportRole = await getSupportRole(guild);
        
        const permissionOverwrites = [
            { id: guild.roles.everyone, deny: ['ViewChannel'] },
            { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'AttachFiles'] }
        ];

        // Add support role permissions if it exists
        if (supportRole) {
            permissionOverwrites.push({
                id: supportRole.id,
                allow: ['ViewChannel', 'SendMessages', 'AttachFiles', 'ManageMessages']
            });
        }

        ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: permissionOverwrites,
            topic: `Order ID: ${orderId} | Ticket for ${interaction.user.tag}`
        });
    } catch (err) {
        return interaction.reply({ content: '❌ Failed to create ticket channel. Please contact an admin.', ephemeral: true });
    }

    // Tag user and support role, post embed with answers and order ID
    const supportRole = await getSupportRole(guild);
    const supportTag = supportRole ? `<@&${supportRole.id}>` : '@Support Team';
    const userTag = `<@${interaction.user.id}>`;
    const embed = new EmbedBuilder()
        .setTitle('📝 New Ticket Submitted')
        .addFields(
            { name: '🔧 Service', value: service },
            { name: '🖊️ Description', value: description },
            { name: '⏰ Deadline', value: deadline },
            { name: '🔗 Links/Files', value: links },
            { name: '🆔 Order ID', value: orderId }
        )
        .setFooter({ text: `User: ${interaction.user.tag} | ID: ${interaction.user.id}` })
        .setTimestamp();
    const closeButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
    );
    await ticketChannel.send({ content: `${userTag} ${supportTag}`, embeds: [embed], components: [closeButton] });

    // Log to Firestore
    await db.collection('orders').add({
        orderId,
        userId: interaction.user.id,
        username: interaction.user.tag,
        service,
        description,
        deadline,
        links,
        status: 'Pending',
        timestamp: new Date()
    });

    // DM user with order details
    try {
        await interaction.user.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle('📝 Order Confirmation')
                    .setDescription(`Thank you for your order!

**Service:** ${service}
**Order ID:** \`${orderId}\`

You can track your order at any time with \`/trackorder order_id:${orderId}\``)
                    .setColor(0x43B581)
                    .setFooter({ text: 'Lunary Services' })
                    .setTimestamp()
            ]
        });
    } catch (err) {
        // Ignore DM errors
    }

    // Log to log channel if configured
    const config = await loadTicketConfig(interaction.guild.id, client);
    if (config.ticketLogChannelId) {
        try {
            const logChannel = await interaction.guild.channels.fetch(config.ticketLogChannelId);
            if (logChannel) {
                await logChannel.send({ embeds: [embed] });
            }
        } catch (err) {
            // Fail silently if log channel is missing
        }
    }

    await interaction.reply({ content: `✅ Your ticket has been created! ${ticketChannel.toString()}`, ephemeral: true });
}

export async function handleCloseTicketButton(interaction, client) {
    const channel = interaction.channel;
    const user = interaction.user;

    // Check if this is actually a ticket channel
    if (!isValidTicketChannel(channel.name)) {
        return await interaction.reply({
            content: '❌ **This command can only be used in ticket channels.**',
            ephemeral: true
        });
    }

    // Check if server is configured
    const configured = await isServerConfigured(interaction.guild.id);
    if (!configured) {
        return await interaction.reply({
            content: '❌ **This server has not been configured yet. Please use `/setup` to configure the bot first.**',
            ephemeral: true
        });
    }

    // Check if user has permission to close tickets
    const hasPermission = await hasSupportPermission(interaction.member);
    if (!hasPermission) {
        return await interaction.reply({
            content: '❌ **You do not have permission to close tickets.**',
            ephemeral: true
        });
    }

    // Create confirmation embed
    const confirmEmbed = new EmbedBuilder()
        .setTitle(TICKET_CONFIG.MESSAGES.CLOSING_TITLE)
        .setDescription(TICKET_CONFIG.MESSAGES.CLOSING_DESCRIPTION.replace('{user}', user.tag))
        .setColor(TICKET_CONFIG.COLORS.PRIMARY)
        .setFooter({ text: 'Velari Support System', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

    await interaction.reply({
        embeds: [confirmEmbed]
    });

    // Delete the channel after the configured delay
    setTimeout(async () => {
        try {
            await channel.delete();
        } catch (error) {
            console.error('Error deleting ticket channel:', error);
        }
    }, TICKET_CONFIG.CLOSE_DELAY);
} 
