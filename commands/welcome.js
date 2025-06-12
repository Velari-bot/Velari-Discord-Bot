import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { TICKET_CONFIG, CHANNEL_IDS } from '../config.js';
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
            flags: 64
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

    await interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleToggle(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return await interaction.reply({
            content: '❌ **You need "Manage Server" permission to configure the welcome system.**',
            flags: 64
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

    await interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleTest(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return await interaction.reply({
            content: '❌ **You need "Manage Server" permission to test the welcome system.**',
            flags: 64
        });
    }
    // Send the real welcome message
    await sendWelcomeMessage(interaction.guild, interaction.member, client, true);

    // Build the same embed for preview
    const member = interaction.member;
    const guild = interaction.guild;
    const memberCount = guild.memberCount;
    const accountCreated = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`;
    const joinDate = `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`;
    const quickLinks = `**Quick Links:**\n[Server Rules](https://discord.com/channels/${guild.id}/${RULES_CHANNEL_ID})\n[General](https://discord.com/channels/${guild.id}/)\n[Support](https://discord.com/channels/${guild.id}/)`;
    const embed = new EmbedBuilder()
      .setTitle(`🎉 Welcome to Team Solarr | EST 2025, ${member.user.tag}! 🎉`)
      .setDescription(`We're excited to have you join our community!\n\n• You are our **${memberCount}th** member\n• Account created on ${accountCreated}\n• Join date: ${joinDate}\n\n${quickLinks}`)
      .setImage('attachment://Lunary_Banner.png')
      .setColor('#F44336')
      .setFooter({ text: `Member joined at • ${new Date(member.joinedTimestamp).toLocaleTimeString()} • ${new Date(member.joinedTimestamp).toLocaleDateString()}` });

    // Send the preview as an ephemeral reply with the banner image
    await interaction.reply({
        content: '👀 **Welcome Message Preview:**',
        embeds: [embed],
        files: [{ attachment: './Lunary_Banner.png', name: 'Lunary_Banner.png' }],
        flags: 64
    });
}

const WELCOME_CHANNEL_ID = '1382038664246464523';
const RULES_CHANNEL_ID = '1382074001924427906';
const WELCOME_EMOJIS = [
  '🎉', '👋', '😎', '🥳', '✨', '🙌', '🔥', '😃', '🫡', '💫', '🤩', '🦾', '🦸', '🫶', '💥', '🌟', '🎊', '🕺', '💯', '🚀'
];

export async function sendWelcomeMessage(guild, member, client, isTest = false) {
    const config = await loadWelcomeConfig(guild.id, client);
    if (!config) return;
    const memberCount = guild.memberCount;
    const accountCreated = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`;
    const joinDate = `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`;
    const quickLinks = `**Quick Links:**\n[Server Rules](https://discord.com/channels/${guild.id}/${RULES_CHANNEL_ID})\n[General](https://discord.com/channels/${guild.id}/)\n[Support](https://discord.com/channels/${guild.id}/)`;
    const embed = new EmbedBuilder()
      .setTitle(`🎉 Welcome to Team Solarr | EST 2025, ${member.user.tag}! 🎉`)
      .setDescription(`We're excited to have you join our community!\n\n• You are our **${memberCount}th** member\n• Account created on ${accountCreated}\n• Join date: ${joinDate}\n\n${quickLinks}`)
      .setImage('attachment://Lunary_Banner.png')
      .setColor('#F44336')
      .setFooter({ text: `Member joined at • ${new Date(member.joinedTimestamp).toLocaleTimeString()} • ${new Date(member.joinedTimestamp).toLocaleDateString()}` });

    // Send to welcome channel with banner image attachment
    try {
        const channel = await guild.channels.fetch(CHANNEL_IDS.welcome || WELCOME_CHANNEL_ID);
        if (channel) {
            const sentMessage = await channel.send({
                embeds: [embed],
                files: [{ attachment: './Lunary_Banner.png', name: 'Lunary_Banner.png' }]
            });
            // Add 3 random emoji reactions
            const shuffled = WELCOME_EMOJIS.sort(() => 0.5 - Math.random());
            const emojis = shuffled.slice(0, 3);
            for (const emoji of emojis) {
                await sentMessage.react(emoji);
            }
        }
    } catch (error) {
        console.error('Error sending welcome message to channel:', error);
    }

    // Send DM (unchanged)
    if (config.dmEnabled && !isTest) {
        try {
            await member.send({
                embeds: [embed]
            });
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