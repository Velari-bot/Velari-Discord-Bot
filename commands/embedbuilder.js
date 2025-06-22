import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits, ChannelType, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, InteractionType } from 'discord.js';
import { buildEmbedPreview } from '../utils/embedPreview.js';
import { hasAdminPermission, hasStaffPermission, isServerConfigured } from '../utils/serverRoles.js';

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

/**
 * Handler for the initial embedbuilder modal submission
 * Sends the embed directly to the same channel, no preview or extra buttons.
 */
export async function handleEmbedBuilderModal(interaction, client) {
  // Build embed data from modal
  let embedData = {
    title: interaction.fields.getTextInputValue('embed_title'),
    description: interaction.fields.getTextInputValue('embed_description'),
    color: interaction.fields.getTextInputValue('embed_color') || '#FF4F8B',
    footer: interaction.fields.getTextInputValue('embed_footer'),
    thumbnail: interaction.fields.getTextInputValue('embed_thumbnail'),
    fields: [],
    timestamp: false
  };

  // Build the embed
  const embed = new EmbedBuilder()
    .setDescription(embedData.description)
    .setColor(embedData.color);
  if (embedData.title) embed.setTitle(embedData.title);
  if (embedData.footer) embed.setFooter({ text: embedData.footer });
  if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail);

  // Send the embed to the same channel
  await interaction.channel.send({ embeds: [embed] });

  // Ephemeral confirmation
  await interaction.reply({ content: '✅ Embed sent to this channel!', ephemeral: true });
}

/**
 * Handler for all embedbuilder-related button interactions
 */
export async function handleEmbedButton(interaction, client) {
  const state = userEmbedState.get(interaction.user.id);
  if (!state) {
    await interaction.reply({ content: 'No embed session found. Please run /embedbuilder again.', ephemeral: true });
    return;
  }
  await showPreviewWithActions(interaction, state.embedData, client);
}

async function showPreviewWithActions(interaction, embedData, client) {
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
  // No local modal or button handling here!
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

/**
 * Main /embedbuilder command execute function: only shows the modal.
 */
export async function execute(interaction, client) {
  try {
    // Check if server is configured
    const configured = await isServerConfigured(interaction.guild.id);
    
    if (!configured) {
      return await interaction.reply({
        content: '❌ **This server has not been configured yet. Please use `/setup` to configure the bot first.**',
        ephemeral: true
      });
    }

    // Check permissions using new system
    const hasPermission = await hasAdminPermission(interaction.member) || 
                         await hasStaffPermission(interaction.member);

    if (!hasPermission) {
      return await interaction.reply({
        content: '❌ **You do not have permission to use the embed builder.**',
        ephemeral: true
      });
    }

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

    if (!interaction.replied && !interaction.deferred) {
      await interaction.showModal(modal);
    }
  } catch (error) {
    console.error('Error in embedbuilder command:', error);
    await interaction.reply({
      content: '❌ **An error occurred while processing your request.**',
      ephemeral: true
    });
  }
}

/**
 * Handler for the embedbuilder_image modal submission
 */
export async function handleEmbedAddImageModal(interaction, client) {
  const state = userEmbedState.get(interaction.user.id);
  if (!state) {
    await interaction.reply({ content: 'No embed session found. Please run /embedbuilder again.', ephemeral: true });
    return;
  }
  state.embedData.image = interaction.fields.getTextInputValue('embed_image');
  await showPreviewWithActions(interaction, state.embedData, client);
}

/**
 * Handler for the embedbuilder_footer_icon modal submission
 */
export async function handleEmbedAddFooterIconModal(interaction, client) {
  const state = userEmbedState.get(interaction.user.id);
  if (!state) {
    await interaction.reply({ content: 'No embed session found. Please run /embedbuilder again.', ephemeral: true });
    return;
  }
  state.embedData.footerIcon = interaction.fields.getTextInputValue('embed_footer_icon');
  await showPreviewWithActions(interaction, state.embedData, client);
}

/**
 * Handler for the embedbuilder_field modal submission
 */
export async function handleEmbedAddFieldModal(interaction, client) {
  const state = userEmbedState.get(interaction.user.id);
  if (!state) {
    await interaction.reply({ content: 'No embed session found. Please run /embedbuilder again.', ephemeral: true });
    return;
  }
  state.embedData.fields = state.embedData.fields || [];
  state.embedData.fields.push({
    name: interaction.fields.getTextInputValue('field_name'),
    value: interaction.fields.getTextInputValue('field_value'),
    inline: interaction.fields.getTextInputValue('field_inline')?.toLowerCase().startsWith('y') || false
  });
  await showPreviewWithActions(interaction, state.embedData, client);
}

/**
 * Handler for the remove_field_select select menu
 */
export async function handleRemoveFieldSelect(interaction, client) {
  const state = userEmbedState.get(interaction.user.id);
  if (!state) {
    await interaction.reply({ content: 'No embed session found. Please run /embedbuilder again.', ephemeral: true });
    return;
  }
  const idx = parseInt(interaction.values[0]);
  state.embedData.fields.splice(idx, 1);
  await interaction.update({ content: `Field removed.`, components: [], ephemeral: true });
  await showPreviewWithActions(interaction, state.embedData, client);
} 
