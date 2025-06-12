import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionsBitField } from 'discord.js';
import { setLastEmbed } from '../commands/embed.js';
import { ALLOWED_ROLES, OVERRIDE_ROLES, CHANNEL_IDS } from '../config.js';

function isValidImageUrl(url) {
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

/**
 * Build and show the ephemeral embed preview with Send/Edit/Cancel buttons
 * Accepts optional actionRows for custom button layouts
 */
export async function buildEmbedPreview(interaction, embedData, client, allowedRoles, actionRows) {
  // Validate thumbnail and image URLs if provided
  if (embedData.thumbnail && !isValidImageUrl(embedData.thumbnail)) {
    await interaction.reply({ content: '❌ Invalid Thumbnail URL. Please use a direct image link (http/https).', flags: 64 });
    return;
  }
  if (embedData.image && !isValidImageUrl(embedData.image)) {
    await interaction.reply({ content: '❌ Invalid Main Image URL. Please use a direct image link (http/https).', flags: 64 });
    return;
  }

  // Validate color
  let color = '#FF4F8B';
  if (embedData.color && /^#([0-9A-F]{6})$/i.test(embedData.color)) {
    color = embedData.color;
  }

  const embed = new EmbedBuilder()
    .setDescription(embedData.description)
    .setColor(color);
  if (embedData.title) embed.setTitle(embedData.title);
  if (embedData.footer) embed.setFooter({ text: embedData.footer, iconURL: embedData.footerIcon || undefined });
  if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail);
  if (embedData.image) embed.setImage(embedData.image);
  if (embedData.timestamp) embed.setTimestamp(new Date());
  if (Array.isArray(embedData.fields)) embed.addFields(embedData.fields);

  // Use provided actionRows or default
  const rows = actionRows || [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('embed_send').setLabel('Send').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('embed_edit').setLabel('Edit').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('embed_cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
    )
  ];

  const reply = await interaction.reply({
    embeds: [embed],
    components: rows,
    flags: 64
  });
  setLastEmbed(interaction.user.id, embedData);

  // Button interaction handler
  const buttonFilter = i => ['embed_send', 'embed_edit', 'embed_cancel'].includes(i.customId) && i.user.id === interaction.user.id;
  const buttonInteraction = await interaction.channel.awaitMessageComponent({ filter: buttonFilter, time: 5 * 60 * 1000 }).catch(() => null);
  if (!buttonInteraction) return reply;

  if (buttonInteraction.customId === 'embed_cancel') {
    await buttonInteraction.update({ content: 'Embed creation cancelled.', embeds: [], components: [], flags: 64 });
    return reply;
  }

  if (buttonInteraction.customId === 'embed_edit') {
    await buttonInteraction.update({ content: 'Please run /embedbuilder again to edit.', embeds: [], components: [], flags: 64 });
    return reply;
  }

  if (buttonInteraction.customId === 'embed_send') {
    // Permission check using config.js
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const memberRoles = member.roles.cache.map(r => r.name);
    const hasPublicAccess = ALLOWED_ROLES.some(role => memberRoles.includes(role));
    const isOverride = OVERRIDE_ROLES.some(role => memberRoles.includes(role));
    if (!hasPublicAccess && !isOverride) {
      await buttonInteraction.update({ content: "🚫 You don't have permission to send embeds to public channels.", embeds: [], components: [], flags: 64 });
      return reply;
    }
    // Channel select menu
    const channels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText && c.viewable);
    const options = channels.map(c => ({ label: c.name, value: c.id })).slice(0, 25);
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('embed_channel_select')
      .setPlaceholder('Select a channel to send the embed')
      .addOptions(options);
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    await buttonInteraction.update({ content: 'Select a channel to send the embed:', embeds: [embed], components: [selectRow], flags: 64 });
    // Channel select handler
    const selectFilter = i => i.customId === 'embed_channel_select' && i.user.id === interaction.user.id;
    const selectInteraction = await interaction.channel.awaitMessageComponent({ filter: selectFilter, time: 5 * 60 * 1000 }).catch(() => null);
    if (!selectInteraction) return reply;
    const channel = interaction.guild.channels.cache.get(selectInteraction.values[0]);
    await channel.send({ embeds: [embed] });

    // Logging logic
    const logChannel = interaction.guild.channels.cache.get(CHANNEL_IDS.logs);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('📤 Embed Sent')
        .setColor(0x00ADB5)
        .addFields(
          { name: '👤 Author', value: `${interaction.user.tag}`, inline: true },
          { name: '📺 Target Channel', value: `<#${channel.id}>`, inline: true }
        )
        .setTimestamp();
      try {
        await logChannel.send({ embeds: [logEmbed, embed] });
      } catch (err) {
        console.warn('Failed to log embed:', err);
      }
    } else {
      console.warn('Log channel not found. Skipping embed log.');
    }

    await selectInteraction.update({ content: `Embed sent to <#${channel.id}>!`, embeds: [], components: [], flags: 64 });
    return reply;
  }
  return reply;
} 