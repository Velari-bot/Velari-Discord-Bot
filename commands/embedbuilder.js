import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits, ChannelType, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, InteractionType } from 'discord.js';
import { buildEmbedPreview } from '../utils/embedPreview.js';

const ALLOWED_ROLES = ['Admin', 'Sales', 'Creative Lead'];

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

  // Color select as a dropdown (suggested colors)
  // Discord modals do not support select menus, so we use a text input for custom hex and suggest colors in the label
  const colorInput = new TextInputBuilder()
    .setCustomId('embed_color')
    .setLabel('Color Hex (suggested: #FF4F8B, #0099FF, #43B581, #FFCC4D, #FF5555, #9B59B6)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const footerInput = new TextInputBuilder()
    .setCustomId('embed_footer')
    .setLabel('Footer Text (optional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const footerIconInput = new TextInputBuilder()
    .setCustomId('embed_footer_icon')
    .setLabel('Footer Icon URL (optional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const thumbInput = new TextInputBuilder()
    .setCustomId('embed_thumbnail')
    .setLabel('Thumbnail URL (optional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const imageInput = new TextInputBuilder()
    .setCustomId('embed_image')
    .setLabel('Main Image URL (optional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const timestampInput = new TextInputBuilder()
    .setCustomId('embed_timestamp')
    .setLabel('Add Timestamp? (yes/no)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  // Only 5 components per modal, so split into two steps if needed
  // For now, use two modals if more than 5 fields are needed
  // Here, we use the first modal for the most essential fields
  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput),
    new ActionRowBuilder().addComponents(colorInput),
    new ActionRowBuilder().addComponents(footerInput),
    new ActionRowBuilder().addComponents(footerIconInput)
  );

  await interaction.showModal(modal);

  // Modal submit handler
  const filter = i => i.customId === 'embedbuilder_modal' && i.user.id === interaction.user.id;
  const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 5 * 60 * 1000 }).catch(() => null);
  if (!modalInteraction) return;

  // Second modal for image, thumbnail, timestamp
  const modal2 = new ModalBuilder()
    .setCustomId('embedbuilder_modal2')
    .setTitle('Embed Builder (Images & Options)');
  modal2.addComponents(
    new ActionRowBuilder().addComponents(thumbInput),
    new ActionRowBuilder().addComponents(imageInput),
    new ActionRowBuilder().addComponents(timestampInput)
  );
  await modalInteraction.showModal(modal2);
  const filter2 = i => i.customId === 'embedbuilder_modal2' && i.user.id === interaction.user.id;
  const modal2Interaction = await modalInteraction.awaitModalSubmit({ filter: filter2, time: 5 * 60 * 1000 }).catch(() => null);
  if (!modal2Interaction) return;

  // Third modal for up to 3 custom fields
  const field1Name = new TextInputBuilder()
    .setCustomId('field1_name')
    .setLabel('Field 1 Name (optional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  const field1Value = new TextInputBuilder()
    .setCustomId('field1_value')
    .setLabel('Field 1 Value (optional)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);
  const field1Inline = new TextInputBuilder()
    .setCustomId('field1_inline')
    .setLabel('Field 1 Inline? (yes/no)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const field2Name = new TextInputBuilder()
    .setCustomId('field2_name')
    .setLabel('Field 2 Name (optional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  const field2Value = new TextInputBuilder()
    .setCustomId('field2_value')
    .setLabel('Field 2 Value (optional)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);
  const field2Inline = new TextInputBuilder()
    .setCustomId('field2_inline')
    .setLabel('Field 2 Inline? (yes/no)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const field3Name = new TextInputBuilder()
    .setCustomId('field3_name')
    .setLabel('Field 3 Name (optional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  const field3Value = new TextInputBuilder()
    .setCustomId('field3_value')
    .setLabel('Field 3 Value (optional)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);
  const field3Inline = new TextInputBuilder()
    .setCustomId('field3_inline')
    .setLabel('Field 3 Inline? (yes/no)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const modal3 = new ModalBuilder()
    .setCustomId('embedbuilder_modal3')
    .setTitle('Embed Builder (Custom Fields)');
  modal3.addComponents(
    new ActionRowBuilder().addComponents(field1Name),
    new ActionRowBuilder().addComponents(field1Value),
    new ActionRowBuilder().addComponents(field1Inline),
    new ActionRowBuilder().addComponents(field2Name),
    new ActionRowBuilder().addComponents(field2Value)
  );
  // Only 5 per modal, so show 2 fields in this modal, then another for the third
  await modal2Interaction.showModal(modal3);
  const filter3 = i => i.customId === 'embedbuilder_modal3' && i.user.id === interaction.user.id;
  const modal3Interaction = await modal2Interaction.awaitModalSubmit({ filter: filter3, time: 5 * 60 * 1000 }).catch(() => null);
  if (!modal3Interaction) return;

  // Fourth modal for the third field
  const modal4 = new ModalBuilder()
    .setCustomId('embedbuilder_modal4')
    .setTitle('Embed Builder (Custom Field 3)');
  modal4.addComponents(
    new ActionRowBuilder().addComponents(field2Inline),
    new ActionRowBuilder().addComponents(field3Name),
    new ActionRowBuilder().addComponents(field3Value),
    new ActionRowBuilder().addComponents(field3Inline)
  );
  await modal3Interaction.showModal(modal4);
  const filter4 = i => i.customId === 'embedbuilder_modal4' && i.user.id === interaction.user.id;
  const modal4Interaction = await modal3Interaction.awaitModalSubmit({ filter: filter4, time: 5 * 60 * 1000 }).catch(() => null);
  if (!modal4Interaction) return;

  // Collect fields
  const fields = [];
  const getField = (modal, idx) => {
    const name = modal.fields.getTextInputValue(`field${idx}_name`);
    const value = modal.fields.getTextInputValue(`field${idx}_value`);
    const inline = modal.fields.getTextInputValue(`field${idx}_inline`);
    if (name && value) {
      fields.push({
        name,
        value,
        inline: inline?.toLowerCase().startsWith('y') || false
      });
    }
  };
  getField(modal3Interaction, 1);
  getField(modal3Interaction, 2);
  getField(modal4Interaction, 2); // field2_inline
  getField(modal4Interaction, 3);

  // Build embed preview
  const embedData = {
    title: modalInteraction.fields.getTextInputValue('embed_title'),
    description: modalInteraction.fields.getTextInputValue('embed_description'),
    color: modalInteraction.fields.getTextInputValue('embed_color') || '#FF4F8B',
    footer: modalInteraction.fields.getTextInputValue('embed_footer'),
    footerIcon: modalInteraction.fields.getTextInputValue('embed_footer_icon'),
    thumbnail: modal2Interaction.fields.getTextInputValue('embed_thumbnail'),
    image: modal2Interaction.fields.getTextInputValue('embed_image'),
    timestamp: modal2Interaction.fields.getTextInputValue('embed_timestamp')?.toLowerCase().startsWith('y'),
    fields
  };

  await buildEmbedPreview(modal4Interaction, embedData, client, ALLOWED_ROLES);
} 