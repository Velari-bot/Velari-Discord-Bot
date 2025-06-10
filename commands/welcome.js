import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { TICKET_CONFIG } from '../config.js';
import { db } from '../firebase/firebase.js';

export const data = new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Configure the welcome system')
    .addSubcommand(subcommand =>
        subcommand
            .setName('setchannel')
            .setDescription('Set the welcome channel')
            .addChannelOption(option =>
                option
                    .setName('channel')
                    .setDescription('Channel for welcome messages')
                    .setRequired(true)
                    .addChannelTypes(ChannelType.GuildText)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('toggle')
            .setDescription('Toggle welcome features')
            .addStringOption(option =>
                option
                    .setName('feature')
                    .setDescription('Feature to toggle')
                    .setRequired(true)
                    .addChoices(
                        { name: 'DM Welcome', value: 'dm' },
                        { name: 'Welcome Messages', value: 'welcome' },
                        { name: 'Goodbye Messages', value: 'goodbye' }
                    )
            )
            .addBooleanOption(option =>
                option
                    .setName('enabled')
                    .setDescription('Enable or disable the feature')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('test')
            .setDescription('Test the welcome message')
    );

// Helper to load config from Firestore
async function loadWelcomeConfig(guildId, client) {
    if (!client.welcomeConfig) client.welcomeConfig = {};
    if (client.welcomeConfig[guildId]) return client.welcomeConfig[guildId];
    const doc = await db.collection('welcomeConfig').doc(guildId).get();
    if (doc.exists) {
        client.welcomeConfig[guildId] = doc.data();
        return doc.data();
    } else {
        // Default config
        const def = {
            channelId: null,
            dmEnabled: true,
            welcomeEnabled: true,
            goodbyeEnabled: true
        };
        client.welcomeConfig[guildId] = def;
        return def;
    }
}

export async function execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'setchannel') {
        await handleSetChannel(interaction, client);
    } else if (subcommand === 'toggle') {
        await handleToggle(interaction, client);
    } else if (subcommand === 'test') {
        await handleTest(interaction, client);
    }
}

async function handleSetChannel(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return await interaction.reply({
            content: '❌ **You need "Manage Server" permission to configure the welcome system.**',
            ephemeral: true
        });
    }

    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guildId;
    const config = await loadWelcomeConfig(guildId, client);
    config.channelId = channel.id;
    await db.collection('welcomeConfig').doc(guildId).set(config);
    client.welcomeConfig[guildId] = config;

    const embed = new EmbedBuilder()
        .setTitle('✅ **Welcome Channel Set**')
        .setDescription(`**Welcome messages will now be sent to ${channel.toString()}**`)
        .setColor(TICKET_CONFIG.COLORS.SUCCESS)
        .setFooter({ text: 'Velari Welcome System', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleToggle(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return await interaction.reply({
            content: '❌ **You need "Manage Server" permission to configure the welcome system.**',
            ephemeral: true
        });
    }

    const feature = interaction.options.getString('feature');
    const enabled = interaction.options.getBoolean('enabled');
    const guildId = interaction.guildId;
    const config = await loadWelcomeConfig(guildId, client);

    switch (feature) {
        case 'dm':
            config.dmEnabled = enabled;
            break;
        case 'welcome':
            config.welcomeEnabled = enabled;
            break;
        case 'goodbye':
            config.goodbyeEnabled = enabled;
            break;
    }
    await db.collection('welcomeConfig').doc(guildId).set(config);
    client.welcomeConfig[guildId] = config;

    const embed = new EmbedBuilder()
        .setTitle('✅ **Welcome System Updated**')
        .setDescription(`**${feature.charAt(0).toUpperCase() + feature.slice(1)} messages are now ${enabled ? 'enabled' : 'disabled'}**`)
        .setColor(TICKET_CONFIG.COLORS.SUCCESS)
        .setFooter({ text: 'Velari Welcome System', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleTest(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return await interaction.reply({
            content: '❌ **You need "Manage Server" permission to test the welcome system.**',
            ephemeral: true
        });
    }
    await sendWelcomeMessage(interaction.guild, interaction.member, client, true);
    const embed = new EmbedBuilder()
        .setTitle('✅ **Test Complete**')
        .setDescription('**Welcome message has been sent to the configured channel and DM (if enabled).**')
        .setColor(TICKET_CONFIG.COLORS.SUCCESS)
        .setFooter({ text: 'Velari Welcome System', iconURL: interaction.guild.iconURL() })
        .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

export async function sendWelcomeMessage(guild, member, client, isTest = false) {
    const config = await loadWelcomeConfig(guild.id, client);
    if (!config) return;
    const memberCount = guild.memberCount;
    const joinPosition = memberCount;
    const welcomeEmbed = new EmbedBuilder()
        .setTitle('🎉 **Welcome to the Server!**')
        .setDescription(`**Welcome ${member}!**\n\n**You are member #${joinPosition}**\n\n**We hope you enjoy your stay!**\n\n• **Read the rules** in #rules\n• **Introduce yourself** in #introductions\n• **Join the community** in #general`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setColor(TICKET_CONFIG.COLORS.PRIMARY)
        .setFooter({ text: 'Velari Welcome System', iconURL: guild.iconURL() })
        .setTimestamp();
    if (config.welcomeEnabled && config.channelId) {
        try {
            const channel = await guild.channels.fetch(config.channelId);
            if (channel) {
                await channel.send({ embeds: [welcomeEmbed] });
            }
        } catch (error) {
            console.error('Error sending welcome message to channel:', error);
        }
    }
    if (config.dmEnabled && !isTest) {
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle('🎉 **Welcome to ' + guild.name + '!**')
                .setDescription(`**Thanks for joining our community!**\n\n**Here are some helpful tips:**\n\n• **Read the rules** to avoid any issues\n• **Introduce yourself** to meet other members\n• **Have fun** and be respectful!\n\n**If you need help, feel free to ask!**`)
                .setColor(TICKET_CONFIG.COLORS.PRIMARY)
                .setFooter({ text: 'Velari Welcome System', iconURL: guild.iconURL() })
                .setTimestamp();
            await member.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.error('Error sending welcome DM:', error);
        }
    }
}

export async function sendGoodbyeMessage(guild, member, client) {
    const config = await loadWelcomeConfig(guild.id, client);
    if (!config || !config.goodbyeEnabled || !config.channelId) return;
    try {
        const channel = await guild.channels.fetch(config.channelId);
        if (!channel) return;
        const goodbyeEmbed = new EmbedBuilder()
            .setTitle('👋 **Goodbye!**')
            .setDescription(`**${member.user.tag} has left the server.**\n\n**We're sorry to see you go!**\n\n**Member count: ${guild.memberCount}**`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setColor(TICKET_CONFIG.COLORS.WARNING)
            .setFooter({ text: 'Velari Welcome System', iconURL: guild.iconURL() })
            .setTimestamp();
        await channel.send({ embeds: [goodbyeEmbed] });
    } catch (error) {
        console.error('Error sending goodbye message:', error);
    }
} 