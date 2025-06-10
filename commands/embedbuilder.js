import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits, ChannelType, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, InteractionType } from 'discord.js';
import { buildEmbedPreview } from '../utils/embedPreview.js';

const ALLOWED_ROLES = ['Admin', 'Sales', 'Creative Lead'];

export const data = new SlashCommandBuilder()
  .setName('embedbuilder')
  .setDescription('Create and preview a custom embed message');

export async function execute(interaction, client) {
  // Show modal for embed input
  const modal = new ModalBuilder()
    .setCustomId('embedbuilder_modal')
    .setTitle('Embed Builder');

  const titleInput = new TextInputBuilder()
    .setCustomId('embed_title')
    .setLabel('Embed Title (optional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const descInput = new TextInputBuilder()
    .setCustomId('embed_description')
    .setLabel('Embed Description (required)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const colorInput = new TextInputBuilder()
    .setCustomId('embed_color')
    .setLabel('Color Hex (optional, default #FF4F8B)')
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

  const imageInput = new TextInputBuilder()
    .setCustomId('embed_image')
    .setLabel('Image URL (optional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput),
    new ActionRowBuilder().addComponents(colorInput),
    new ActionRowBuilder().addComponents(footerInput),
    new ActionRowBuilder().addComponents(thumbInput),
    new ActionRowBuilder().addComponents(imageInput)
  );

  await interaction.showModal(modal);

  // Modal submit handler
  const filter = i => i.customId === 'embedbuilder_modal' && i.user.id === interaction.user.id;
  const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 5 * 60 * 1000 }).catch(() => null);
  if (!modalInteraction) return;

  // Build embed preview
  const embedData = {
    title: modalInteraction.fields.getTextInputValue('embed_title'),
    description: modalInteraction.fields.getTextInputValue('embed_description'),
    color: modalInteraction.fields.getTextInputValue('embed_color') || '#FF4F8B',
    footer: modalInteraction.fields.getTextInputValue('embed_footer'),
    thumbnail: modalInteraction.fields.getTextInputValue('embed_thumbnail'),
    image: modalInteraction.fields.getTextInputValue('embed_image'),
  };

  await buildEmbedPreview(modalInteraction, embedData, client, ALLOWED_ROLES);
} 