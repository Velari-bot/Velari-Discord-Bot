import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits, ChannelType, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, InteractionType } from 'discord.js';
import { buildEmbedPreview } from '../utils/embedPreview.js';

const ALLOWED_ROLES = ['Admin', 'Sales', 'Creative Lead'];
const PREVIEW_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const userEmbedState = new Map(); // userId -> { embedData, previewMsgId, timeout }

const SUGGESTED_COLORS = [
  { label: 'Pink', value: '#FF4F8B' },
  { label: 'Blue', value: '#0099FF' },
  { label: 'Green', value: '#43B581' },
  { label: 'Yellow', value: '#FFCC4D' },
  { label: 'Red', value: '#FF5555' },
  { label: 'Purple', value: '#9B59B6' },
  { label: 'Custom (enter below)', value: 'custom' }
];

export const data = new SlashCommandBuilder()
  .setName('embedbuilder')
  .setDescription('Create and preview a custom embed message');

export async function execute(interaction, client) {
  // Show modal for essential fields
  const modal = new ModalBuilder()
    .setCustomId('embedbuilder_modal')
    .setTitle('Embed Builder');

  const titleInput = new TextInputBuilder()
    .setCustomId('embed_title')
    .setLabel('Title (optional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const descInput = new TextInputBuilder()
    .setCustomId('embed_description')
    .setLabel('Description (required)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const colorInput = new TextInputBuilder()
    .setCustomId('embed_color')
    .setLabel('Color Hex (e.g. #FF4F8B)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const footerInput = new TextInputBuilder()
    .setCustomId('embed_footer')
    .setLabel('Footer Text (optional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const thumbInput = new TextInputBuilder()
    .setCustomId('embed_thumbnail')
    .setLabel('Thumbnail URL (optional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput),
    new ActionRowBuilder().addComponents(colorInput),
    new ActionRowBuilder().addComponents(footerInput),
    new ActionRowBuilder().addComponents(thumbInput)
  );

  try {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.showModal(modal);
    }
  } catch (err) {
    console.error('Error showing modal:', err);
    return;
  }

  // Modal submit handler
  const filter = i => i.customId === 'embedbuilder_modal' && i.user.id === interaction.user.id;
  let modalInteraction = null;
  try {
    modalInteraction = await interaction.awaitModalSubmit({ filter, time: 5 * 60 * 1000 });
  } catch (err) {
    // Timeout or error, do not respond again
    return;
  }
  if (!modalInteraction) return;

  // Initial embed data
  let embedData = {
    title: modalInteraction.fields.getTextInputValue('embed_title'),
    description: modalInteraction.fields.getTextInputValue('embed_description'),
    color: modalInteraction.fields.getTextInputValue('embed_color') || '#FF4F8B',
    footer: modalInteraction.fields.getTextInputValue('embed_footer'),
    thumbnail: modalInteraction.fields.getTextInputValue('embed_thumbnail'),
    fields: [],
    timestamp: false
  };

  await showPreviewWithActions(modalInteraction, embedData, client);
}

async function showPreviewWithActions(interaction, embedData, client) {
  // Save state
  userEmbedState.set(interaction.user.id, { embedData });

  // Build preview
  const previewMsg = await buildEmbedPreview(interaction, embedData, client, ALLOWED_ROLES, getActionRows());

  // Save preview message ID for timeout/cancel
  if (previewMsg && previewMsg.id) {
    clearTimeout(userEmbedState.get(interaction.user.id)?.timeout);
    userEmbedState.set(interaction.user.id, {
      embedData,
      previewMsgId: previewMsg.id,
      timeout: setTimeout(async () => {
        try {
          await previewMsg.delete();
        } catch {}
        userEmbedState.delete(interaction.user.id);
      }, PREVIEW_TIMEOUT)
    });
  }

  // Button handler
  const buttonFilter = i => [
    'embed_add_field', 'embed_remove_field', 'embed_list_fields',
    'embed_add_image', 'embed_add_footer_icon', 'embed_toggle_timestamp',
    'embed_send', 'embed_edit', 'embed_cancel'
  ].includes(i.customId) && i.user.id === interaction.user.id;
  const buttonInteraction = await interaction.channel.awaitMessageComponent({ filter: buttonFilter, time: PREVIEW_TIMEOUT }).catch(() => null);
  if (!buttonInteraction) return;

  if (buttonInteraction.customId === 'embed_cancel') {
    await buttonInteraction.update({ content: 'Embed creation cancelled.', embeds: [], components: [], ephemeral: true });
    try { await previewMsg.delete(); } catch {}
    userEmbedState.delete(interaction.user.id);
    return;
  }
  if (buttonInteraction.customId === 'embed_edit') {
    await buttonInteraction.update({ content: 'Please run /embedbuilder again to edit.', embeds: [], components: [], ephemeral: true });
    try { await previewMsg.delete(); } catch {}
    userEmbedState.delete(interaction.user.id);
    return;
  }
  if (buttonInteraction.customId === 'embed_send') {
    // Send logic handled in buildEmbedPreview
    try { await previewMsg.delete(); } catch {}
    userEmbedState.delete(interaction.user.id);
    return;
  }
  if (buttonInteraction.customId === 'embed_toggle_timestamp') {
    embedData.timestamp = !embedData.timestamp;
    await showPreviewWithActions(buttonInteraction, embedData, client);
    return;
  }
  if (buttonInteraction.customId === 'embed_add_image') {
    // Show modal for main image
    const imageModal = new ModalBuilder()
      .setCustomId('embedbuilder_image')
      .setTitle('Add Main Image');
    imageModal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('embed_image')
          .setLabel('Main Image URL')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );
    await buttonInteraction.showModal(imageModal);
    const imageModalInteraction = await buttonInteraction.awaitModalSubmit({ filter: i => i.customId === 'embedbuilder_image' && i.user.id === buttonInteraction.user.id, time: 5 * 60 * 1000 }).catch(() => null);
    if (!imageModalInteraction) return;
    embedData.image = imageModalInteraction.fields.getTextInputValue('embed_image');
    await showPreviewWithActions(imageModalInteraction, embedData, client);
    return;
  }
  if (buttonInteraction.customId === 'embed_add_footer_icon') {
    // Show modal for footer icon
    const iconModal = new ModalBuilder()
      .setCustomId('embedbuilder_footer_icon')
      .setTitle('Add Footer Icon');
    iconModal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('embed_footer_icon')
          .setLabel('Footer Icon URL')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );
    await buttonInteraction.showModal(iconModal);
    const iconModalInteraction = await buttonInteraction.awaitModalSubmit({ filter: i => i.customId === 'embedbuilder_footer_icon' && i.user.id === buttonInteraction.user.id, time: 5 * 60 * 1000 }).catch(() => null);
    if (!iconModalInteraction) return;
    embedData.footerIcon = iconModalInteraction.fields.getTextInputValue('embed_footer_icon');
    await showPreviewWithActions(iconModalInteraction, embedData, client);
    return;
  }
  if (buttonInteraction.customId === 'embed_add_field') {
    // Show modal for a custom field
    const fieldModal = new ModalBuilder()
      .setCustomId('embedbuilder_field')
      .setTitle('Add Custom Field');
    fieldModal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('field_name')
          .setLabel('Field Name')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('field_value')
          .setLabel('Field Value')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('field_inline')
          .setLabel('Inline? (yes/no)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
      )
    );
    await buttonInteraction.showModal(fieldModal);
    const fieldModalInteraction = await buttonInteraction.awaitModalSubmit({ filter: i => i.customId === 'embedbuilder_field' && i.user.id === buttonInteraction.user.id, time: 5 * 60 * 1000 }).catch(() => null);
    if (!fieldModalInteraction) return;
    embedData.fields = embedData.fields || [];
    embedData.fields.push({
      name: fieldModalInteraction.fields.getTextInputValue('field_name'),
      value: fieldModalInteraction.fields.getTextInputValue('field_value'),
      inline: fieldModalInteraction.fields.getTextInputValue('field_inline')?.toLowerCase().startsWith('y') || false
    });
    await showPreviewWithActions(fieldModalInteraction, embedData, client);
    return;
  }
  if (buttonInteraction.customId === 'embed_remove_field') {
    // Show dropdown of current fields
    if (!embedData.fields || embedData.fields.length === 0) {
      await buttonInteraction.reply({ content: 'No fields to remove.', ephemeral: true });
      await showPreviewWithActions(buttonInteraction, embedData, client);
      return;
    }
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('remove_field_select')
      .setPlaceholder('Select a field to remove')
      .addOptions(embedData.fields.map((f, i) => ({ label: `${i + 1}: ${f.name}`, value: i.toString() })));
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    await buttonInteraction.reply({ content: 'Select a field to remove:', components: [selectRow], ephemeral: true });
    const selectFilter = i => i.customId === 'remove_field_select' && i.user.id === buttonInteraction.user.id;
    const selectInteraction = await buttonInteraction.channel.awaitMessageComponent({ filter: selectFilter, time: 5 * 60 * 1000 }).catch(() => null);
    if (!selectInteraction) return;
    const idx = parseInt(selectInteraction.values[0]);
    embedData.fields.splice(idx, 1);
    await selectInteraction.update({ content: `Field removed.`, components: [], ephemeral: true });
    await showPreviewWithActions(selectInteraction, embedData, client);
    return;
  }
  if (buttonInteraction.customId === 'embed_list_fields') {
    // Show ephemeral embed listing all fields
    if (!embedData.fields || embedData.fields.length === 0) {
      await buttonInteraction.reply({ content: 'No fields added yet.', ephemeral: true });
    } else {
      const listEmbed = new EmbedBuilder()
        .setTitle('Current Fields')
        .setDescription(embedData.fields.map((f, i) => `**${i + 1}.** 
Name: ${f.name}
Inline: ${f.inline ? 'Yes' : 'No'}
Value: ${f.value}`).join('\n\n'));
      await buttonInteraction.reply({ embeds: [listEmbed], ephemeral: true });
    }
    await showPreviewWithActions(buttonInteraction, embedData, client);
    return;
  }
}

function getActionRows() {
  // Only include buttons that should be shown (for future dynamic logic)
  const buttons = [
    new ButtonBuilder().setCustomId('embed_add_field').setLabel('Add Field').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('embed_remove_field').setLabel('Remove Field').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('embed_list_fields').setLabel('List Fields').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('embed_add_image').setLabel('Add Main Image').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('embed_add_footer_icon').setLabel('Add Footer Icon').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('embed_toggle_timestamp').setLabel('Toggle Timestamp').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('embed_send').setLabel('Send').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('embed_edit').setLabel('Edit').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('embed_cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
  ];
  // Split into rows of max 5 buttons
  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    const chunk = buttons.slice(i, i + 5);
    if (chunk.length > 0) {
      rows.push(new ActionRowBuilder().addComponents(...chunk));
    }
  }
  return rows;
} 
