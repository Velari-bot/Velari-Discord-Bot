import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { TICKET_CONFIG } from '../config.js';
import { getUserTicket, generateTicketChannelName, getOrCreateSupportRole, createTicketPermissions, hasTicketPermission, isValidTicketChannel } from '../utils/ticketUtils.js';

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
    );

export async function execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'setup') {
        await handleTicketSetup(interaction, client);
    } else if (subcommand === 'close') {
        await handleCloseTicket(interaction, client);
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

    // Check if user has permission to close tickets
    const supportRole = interaction.guild.roles.cache.find(role => role.name === TICKET_CONFIG.SUPPORT_ROLE_NAME);
    const hasPermission = hasTicketPermission(interaction.member, supportRole);

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

// Export button handlers for use in index.js
export async function handleCreateTicket(interaction, client) {
    const userId = interaction.user.id;
    const guild = interaction.guild;

    // Check if user already has an open ticket
    const existingTicket = getUserTicket(guild, interaction.user);

    if (existingTicket) {
        return await interaction.reply({
            content: '❌ **You already have an open ticket!** Please use your existing ticket or wait for it to be closed.',
            ephemeral: true
        });
    }

    // Create modal for issue description
    const modal = new ModalBuilder()
        .setCustomId('ticket_modal')
        .setTitle('🎫 Create Support Ticket');

    const issueInput = new TextInputBuilder()
        .setCustomId('issue_description')
        .setLabel('Describe your issue')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Please provide a detailed description of your issue or question...')
        .setRequired(true)
        .setMaxLength(1000);

    const firstActionRow = new ActionRowBuilder().addComponents(issueInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

// Export modal handler for use in index.js
export async function handleTicketModal(interaction, client) {
    const issueDescription = interaction.fields.getTextInputValue('issue_description');
    const guild = interaction.guild;

    // Get or create the Support role
    let supportRole;
    try {
        supportRole = await getOrCreateSupportRole(guild);
    } catch (error) {
        console.error('Error creating Support role:', error);
        return await interaction.reply({
            content: '❌ **Failed to create Support role. Please contact an administrator.**',
            ephemeral: true
        });
    }

    // Create the ticket channel
    const channelName = generateTicketChannelName(interaction.user.username);
    
    try {
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: interaction.channel.parent, // Same category as the panel
            permissionOverwrites: createTicketPermissions(guild, interaction.user, supportRole),
            topic: `Ticket for ${interaction.user.tag} (${interaction.user.id}) - Issue: ${issueDescription.substring(0, 100)}...`
        });

        // Create welcome embed with issue description
        const welcomeEmbed = new EmbedBuilder()
            .setTitle(TICKET_CONFIG.MESSAGES.WELCOME_TITLE)
            .setDescription(`**Welcome ${interaction.user}!**\n\n**Your support ticket has been created.**\n\n**Issue Description:**\n${issueDescription}\n\n• **Please provide additional details** if needed\n• **Be patient** - our support team will respond soon\n• **Stay on topic** - keep the conversation relevant\n\n**A support team member will assist you shortly!**`)
            .setColor(TICKET_CONFIG.COLORS.PRIMARY)
            .setFooter({ text: 'Velari Support System', iconURL: guild.iconURL() })
            .setTimestamp();

        // Create close ticket button
        const closeButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel(TICKET_CONFIG.BUTTONS.CLOSE_TICKET)
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

        await ticketChannel.send({
            content: `${interaction.user} ${supportRole}`,
            embeds: [welcomeEmbed],
            components: [closeButton]
        });

        await interaction.reply({
            content: `✅ **Your ticket has been created!** ${ticketChannel.toString()}`,
            ephemeral: true
        });

    } catch (error) {
        console.error('Error creating ticket channel:', error);
        await interaction.reply({
            content: '❌ **Failed to create ticket channel. Please contact an administrator.**',
            ephemeral: true
        });
    }
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

    // Check if user has permission to close tickets
    const supportRole = interaction.guild.roles.cache.find(role => role.name === TICKET_CONFIG.SUPPORT_ROLE_NAME);
    const hasPermission = hasTicketPermission(interaction.member, supportRole);

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