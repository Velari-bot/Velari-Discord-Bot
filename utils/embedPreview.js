import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionsBitField } from 'discord.js';
import { setLastEmbed } from '../commands/embed.js';

function isValidImageUrl(url) {
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

/**
 * Build and show the ephemeral embed preview with Send/Edit/Cancel buttons
 */
export async function buildEmbedPreview(interaction, embedData, client, ALLOWED_ROLES) {
  // Validate thumbnail and image URLs if provided
  if (embedData.thumbnail && !isValidImageUrl(embedData.thumbnail)) {
    await interaction.reply({ content: '❌ Invalid Thumbnail URL. Please use a direct image link (http/https).', ephemeral: true });
    return;
  }
  if (embedData.image && !isValidImageUrl(embedData.image)) {
    await interaction.reply({ content: '❌ Invalid Main Image URL. Please use a direct image link (http/https).', ephemeral: true });
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

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('embed_send').setLabel('Send').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('embed_edit').setLabel('Edit').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('embed_cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
  setLastEmbed(interaction.user.id, embedData);

  // Button interaction handler
  const buttonFilter = i => ['embed_send', 'embed_edit', 'embed_cancel'].includes(i.customId) && i.user.id === interaction.user.id;
  const buttonInteraction = await interaction.channel.awaitMessageComponent({ filter: buttonFilter, time: 5 * 60 * 1000 }).catch(() => null);
  if (!buttonInteraction) return;

  if (buttonInteraction.customId === 'embed_cancel') {
    await buttonInteraction.update({ content: 'Embed creation cancelled.', embeds: [], components: [], ephemeral: true });
    return;
  }

  if (buttonInteraction.customId === 'embed_edit') {
    await buttonInteraction.update({ content: 'Please run /embedbuilder again to edit.', embeds: [], components: [], ephemeral: true });
    return;
  }

  if (buttonInteraction.customId === 'embed_send') {
    // Permission check
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const hasRole = member.roles.cache.some(role => ALLOWED_ROLES.includes(role.name));
    if (!hasRole) {
      await buttonInteraction.update({ content: 'You do not have permission to send embeds to public channels. Only DMs or preview are allowed.', embeds: [], components: [], ephemeral: true });
      return;
    }
    // Channel select menu
    const channels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText && c.viewable);
    const options = channels.map(c => ({ label: c.name, value: c.id })).slice(0, 25);
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('embed_channel_select')
      .setPlaceholder('Select a channel to send the embed')
      .addOptions(options);
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    await buttonInteraction.update({ content: 'Select a channel to send the embed:', embeds: [embed], components: [selectRow], ephemeral: true });
    // Channel select handler
    const selectFilter = i => i.customId === 'embed_channel_select' && i.user.id === interaction.user.id;
    const selectInteraction = await interaction.channel.awaitMessageComponent({ filter: selectFilter, time: 5 * 60 * 1000 }).catch(() => null);
    if (!selectInteraction) return;
    const channel = interaction.guild.channels.cache.get(selectInteraction.values[0]);
    await channel.send({ embeds: [embed] });
    await selectInteraction.update({ content: `Embed sent to <#${channel.id}>!`, embeds: [], components: [], ephemeral: true });
  }
} 