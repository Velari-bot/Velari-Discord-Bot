import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } from 'discord.js';
import { db } from '../firebase/firebase.js';

function generateOrderId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const data = new SlashCommandBuilder()
  .setName('orderpanel')
  .setDescription('Send the order ticket panel for users to order services.');

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: '❌ You need Manage Server permission to use this command.', flags: 64 });
  }
  const embed = new EmbedBuilder()
    .setTitle('🛒 Order Digital Services')
    .setDescription('Click the button below to order a service from our team!')
    .setColor(0x43B581);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_order_ticket')
      .setLabel('Order Now')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🛒')
  );
  await interaction.reply({ embeds: [embed], components: [row] });
}

export async function handleCreateOrderTicket(interaction, client) {
  // Show modal for order
  const modal = new ModalBuilder()
    .setCustomId('order_ticket_modal')
    .setTitle('🛒 New Order');

  const serviceInput = new TextInputBuilder()
    .setCustomId('ticket_service')
    .setLabel('Service (e.g., Bot, Website, GFX)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const descriptionInput = new TextInputBuilder()
    .setCustomId('ticket_description')
    .setLabel('Describe your order')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const deadlineInput = new TextInputBuilder()
    .setCustomId('ticket_deadline')
    .setLabel('Deadline? (optional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const linksInput = new TextInputBuilder()
    .setCustomId('ticket_links')
    .setLabel('Links or files? (optional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(serviceInput),
    new ActionRowBuilder().addComponents(descriptionInput),
    new ActionRowBuilder().addComponents(deadlineInput),
    new ActionRowBuilder().addComponents(linksInput)
  );

  await interaction.showModal(modal);
}

export async function handleOrderTicketModal(interaction, client) {
  const service = interaction.fields.getTextInputValue('ticket_service');
  const description = interaction.fields.getTextInputValue('ticket_description');
  const deadline = interaction.fields.getTextInputValue('ticket_deadline') || 'Not specified';
  const links = interaction.fields.getTextInputValue('ticket_links') || 'None';
  const orderId = generateOrderId();

  // Create ticket channel
  const guild = interaction.guild;
  const channelName = `order-${interaction.user.username}`;
  let ticketChannel;
  try {
    ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: ['ViewChannel'] },
        { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'AttachFiles'] },
      ],
      topic: `Order ID: ${orderId} | Order for ${interaction.user.tag}`
    });
  } catch (err) {
    return interaction.reply({ content: '❌ Failed to create order channel. Please contact an admin.', flags: 64 });
  }

  const embed = new EmbedBuilder()
    .setTitle('📝 New Order Submitted')
    .addFields(
      { name: '🔧 Service', value: service },
      { name: '🖊️ Description', value: description },
      { name: '⏰ Deadline', value: deadline },
      { name: '🔗 Links/Files', value: links },
      { name: '🆔 Order ID', value: orderId }
    )
    .setFooter({ text: `User: ${interaction.user.tag} | ID: ${interaction.user.id}` })
    .setTimestamp();
  await ticketChannel.send({ content: `<@${interaction.user.id}> @Support Team`, embeds: [embed] });

  // Log to Firestore
  await db.collection('orders').add({
    orderId,
    userId: interaction.user.id,
    username: interaction.user.tag,
    service,
    description,
    deadline,
    links,
    status: 'Pending',
    timestamp: new Date()
  });

  // DM user with order details
  try {
    await interaction.user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('📝 Order Confirmation')
          .setDescription(`Thank you for your order!\n\n**Service:** ${service}\n**Order ID:** \`${orderId}\`\n\nYou can track your order at any time with \`/trackorder order_id:${orderId}\``)
          .setColor(0x43B581)
          .setFooter({ text: 'Lunary Services' })
          .setTimestamp()
      ]
    });
  } catch (err) {}

  await interaction.reply({ content: `✅ Your order ticket has been created! ${ticketChannel.toString()}`, flags: 64 });
} 