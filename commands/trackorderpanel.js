import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('trackorderpanel')
  .setDescription('Create a track order panel with a button for users to track their orders')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: '❌ You need Manage Server permission to use this command.', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('📦 Track Your Order')
    .setDescription('Click the button below to track the status of your order!')
    .addFields(
      { name: '🔍 How to Track', value: '• Click the "Track Order" button below\n• Enter your Order ID when prompted\n• View your order status and progress', inline: false },
      { name: '📋 What You\'ll See', value: '• Current order status\n• Progress bar\n• Staff assignments\n• Latest updates\n• Payment information', inline: false },
      { name: '💡 Need Help?', value: '• Contact support if you lost your Order ID\n• Check your DMs for order confirmations\n• Use `/trackorder` command directly', inline: false }
    )
    .setColor(0x5865F2)
    .setFooter({ text: 'Velari Order Tracking System' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('track_order_button')
      .setLabel('Track Order')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📦')
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}

export async function handleTrackOrderButton(interaction, client) {
  // Show modal to get order ID
  const modal = new ModalBuilder()
    .setCustomId('track_order_modal')
    .setTitle('📦 Track Order');

  const orderIdInput = new TextInputBuilder()
    .setCustomId('track_order_id')
    .setLabel('Order ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter your Order ID (e.g., ABC12345)')
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(20);

  modal.addComponents(
    new ActionRowBuilder().addComponents(orderIdInput)
  );

  await interaction.showModal(modal);
}

export async function handleTrackOrderModal(interaction, client) {
  const orderId = interaction.fields.getTextInputValue('track_order_id').trim();
  
  // Import the trackorder command functionality
  const { execute: trackOrderExecute } = await import('./trackorder.js');
  
  // Create a mock interaction object with the order ID
  const mockInteraction = {
    ...interaction,
    options: {
      getString: (name) => {
        if (name === 'order_id') return orderId;
        return null;
      }
    }
  };

  // Execute the track order functionality
  await trackOrderExecute(mockInteraction);
} 
