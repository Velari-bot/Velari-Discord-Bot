import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { TICKET_CONFIG } from '../config.js';
import { db } from '../firebase/firebase.js';

export const data = new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Suggestion system')
    .addSubcommand(subcommand =>
        subcommand
            .setName('setup')
            .setDescription('Setup the suggestion channel')
            .addChannelOption(option =>
                option.setName('channel').setDescription('Channel for suggestions').setRequired(true).addChannelTypes(ChannelType.GuildText)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('create')
            .setDescription('Create a suggestion')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('anonymous')
            .setDescription('Create an anonymous suggestion')
    );

// Helper to load suggestion config
async function loadSuggestionConfig(guildId, client) {
    if (!client.suggestionConfig) client.suggestionConfig = {};
    if (client.suggestionConfig[guildId]) return client.suggestionConfig[guildId];
    const doc = await db.collection('suggestionConfig').doc(guildId).get();
    if (doc.exists) {
        client.suggestionConfig[guildId] = doc.data();
        return doc.data();
    } else {
        return null;
    }
}

export async function execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'setup':
            await handleSetup(interaction, client);
            break;
        case 'create':
            await handleCreate(interaction, client);
            break;
        case 'anonymous':
            await handleAnonymous(interaction, client);
            break;
    }
}

async function handleSetup(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return await interaction.reply({
            content: '❌ **You need "Manage Server" permission to setup the suggestion system.**',
            ephemeral: true
        });
    }

    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;
    await db.collection('suggestionConfig').doc(guildId).set({ channelId: channel.id });
    client.suggestionConfig[guildId] = { channelId: channel.id };

    const embed = new EmbedBuilder()
        .setTitle('✅ **Suggestion Channel Set**')
        .setDescription(`**Suggestions will now be posted in ${channel.toString()}**`)
        .setColor(TICKET_CONFIG.COLORS.SUCCESS)
        .setFooter({ text: 'Velari Suggestion System', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleCreate(interaction, client) {
    const config = await loadSuggestionConfig(interaction.guild.id, client);
    if (!config || !config.channelId) {
        return await interaction.reply({
            content: '❌ **Suggestion system is not setup. Please ask an administrator to set it up.**',
            ephemeral: true
        });
    }

    // Create modal for suggestion
    const modal = new ModalBuilder()
        .setCustomId('suggestion_modal')
        .setTitle('💡 Create Suggestion');

    const titleInput = new TextInputBuilder()
        .setCustomId('suggestion_title')
        .setLabel('Suggestion Title')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter a brief title for your suggestion...')
        .setRequired(true)
        .setMaxLength(256);

    const descriptionInput = new TextInputBuilder()
        .setCustomId('suggestion_description')
        .setLabel('Suggestion Description')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Describe your suggestion in detail...')
        .setRequired(true)
        .setMaxLength(2000);

    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);

    modal.addComponents(firstActionRow, secondActionRow);

    // Store user info for modal submission
    if (!client.suggestionData) client.suggestionData = new Map();
    client.suggestionData.set(interaction.user.id, { 
        guildId: interaction.guild.id,
        anonymous: false
    });

    await interaction.showModal(modal);
}

async function handleAnonymous(interaction, client) {
    const config = await loadSuggestionConfig(interaction.guild.id, client);
    if (!config || !config.channelId) {
        return await interaction.reply({
            content: '❌ **Suggestion system is not setup. Please ask an administrator to set it up.**',
            ephemeral: true
        });
    }

    // Create modal for anonymous suggestion
    const modal = new ModalBuilder()
        .setCustomId('suggestion_modal')
        .setTitle('💡 Create Anonymous Suggestion');

    const titleInput = new TextInputBuilder()
        .setCustomId('suggestion_title')
        .setLabel('Suggestion Title')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter a brief title for your suggestion...')
        .setRequired(true)
        .setMaxLength(256);

    const descriptionInput = new TextInputBuilder()
        .setCustomId('suggestion_description')
        .setLabel('Suggestion Description')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Describe your suggestion in detail...')
        .setRequired(true)
        .setMaxLength(2000);

    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);

    modal.addComponents(firstActionRow, secondActionRow);

    // Store user info for modal submission
    if (!client.suggestionData) client.suggestionData = new Map();
    client.suggestionData.set(interaction.user.id, { 
        guildId: interaction.guild.id,
        anonymous: true
    });

    await interaction.showModal(modal);
}

// Export modal handler for use in index.js
export async function handleSuggestionModal(interaction, client) {
    const title = interaction.fields.getTextInputValue('suggestion_title');
    const description = interaction.fields.getTextInputValue('suggestion_description');
    
    const suggestionData = client.suggestionData?.get(interaction.user.id);
    if (!suggestionData) {
        return await interaction.reply({
            content: '❌ **Suggestion data not found. Please try again.**',
            ephemeral: true
        });
    }

    const config = client.suggestionConfig?.[suggestionData.guildId];
    if (!config || !config.channelId) {
        return await interaction.reply({
            content: '❌ **Suggestion system is not setup.**',
            ephemeral: true
        });
    }

    const channel = await interaction.guild.channels.fetch(config.channelId);
    if (!channel) {
        return await interaction.reply({
            content: '❌ **Suggestion channel not found.**',
            ephemeral: true
        });
    }

    // Generate suggestion ID
    const suggestionId = Date.now().toString();
    
    const embed = new EmbedBuilder()
        .setTitle(`💡 **${title}**`)
        .setDescription(description)
        .addFields(
            { name: '**Status**', value: '📊 Under Review', inline: true },
            { name: '**Suggestion ID**', value: `#${suggestionId.slice(-6)}`, inline: true },
            { name: '**Submitted**', value: suggestionData.anonymous ? 'Anonymous' : `by ${interaction.user.tag}`, inline: true }
        )
        .setColor(TICKET_CONFIG.COLORS.PRIMARY)
        .setFooter({ text: 'Velari Suggestion System', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

    // Create voting buttons
    const voteRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`suggestion_upvote_${suggestionId}`)
                .setLabel('Upvote')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅'),
            new ButtonBuilder()
                .setCustomId(`suggestion_downvote_${suggestionId}`)
                .setLabel('Downvote')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌')
        );

    try {
        const message = await channel.send({
            embeds: [embed],
            components: [voteRow]
        });

        // Store suggestion data
        if (!client.suggestions) client.suggestions = new Map();
        client.suggestions.set(suggestionId, {
            messageId: message.id,
            channelId: channel.id,
            guildId: suggestionData.guildId,
            authorId: suggestionData.anonymous ? null : interaction.user.id,
            title: title,
            description: description,
            upvotes: new Set(),
            downvotes: new Set(),
            anonymous: suggestionData.anonymous
        });

        const successEmbed = new EmbedBuilder()
            .setTitle('✅ **Suggestion Submitted**')
            .setDescription(`**Your suggestion has been posted in ${channel.toString()}**\n\n**Suggestion ID:** #${suggestionId.slice(-6)}`)
            .setColor(TICKET_CONFIG.COLORS.SUCCESS)
            .setFooter({ text: 'Velari Suggestion System', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        
        // Clean up
        client.suggestionData.delete(interaction.user.id);
        
    } catch (error) {
        console.error('Error posting suggestion:', error);
        await interaction.reply({
            content: '❌ **Failed to post suggestion. Please try again.**',
            ephemeral: true
        });
    }
}

// Export button handlers for use in index.js
export async function handleSuggestionVote(interaction, client) {
    const [action, voteType, suggestionId] = interaction.customId.split('_');
    
    if (action !== 'suggestion' || !['upvote', 'downvote'].includes(voteType)) {
        return;
    }

    const suggestion = client.suggestions?.get(suggestionId);
    if (!suggestion) {
        return await interaction.reply({
            content: '❌ **Suggestion not found.**',
            ephemeral: true
        });
    }

    const userId = interaction.user.id;
    const isUpvote = voteType === 'upvote';

    // Remove vote from other category if exists
    if (isUpvote) {
        suggestion.downvotes.delete(userId);
        if (suggestion.upvotes.has(userId)) {
            suggestion.upvotes.delete(userId);
            await interaction.reply({
                content: '✅ **Your upvote has been removed.**',
                ephemeral: true
            });
        } else {
            suggestion.upvotes.add(userId);
            await interaction.reply({
                content: '✅ **Your upvote has been recorded.**',
                ephemeral: true
            });
        }
    } else {
        suggestion.upvotes.delete(userId);
        if (suggestion.downvotes.has(userId)) {
            suggestion.downvotes.delete(userId);
            await interaction.reply({
                content: '❌ **Your downvote has been removed.**',
                ephemeral: true
            });
        } else {
            suggestion.downvotes.add(userId);
            await interaction.reply({
                content: '❌ **Your downvote has been recorded.**',
                ephemeral: true
            });
        }
    }

    // Update the suggestion message
    try {
        const channel = await interaction.guild.channels.fetch(suggestion.channelId);
        const message = await channel.messages.fetch(suggestion.messageId);
        
        const embed = EmbedBuilder.from(message.embeds[0]);
        const upvoteCount = suggestion.upvotes.size;
        const downvoteCount = suggestion.downvotes.size;
        const totalVotes = upvoteCount + downvoteCount;
        
        // Update status based on votes
        let status = '📊 Under Review';
        if (totalVotes >= 5) {
            if (upvoteCount > downvoteCount) {
                status = '✅ Popular';
            } else if (downvoteCount > upvoteCount) {
                status = '❌ Unpopular';
            }
        }
        
        embed.spliceFields(0, 1, { name: '**Status**', value: status, inline: true });
        embed.addFields(
            { name: '**Votes**', value: `✅ ${upvoteCount} | ❌ ${downvoteCount}`, inline: true }
        );

        await message.edit({ embeds: [embed] });
        
    } catch (error) {
        console.error('Error updating suggestion message:', error);
    }
} 
