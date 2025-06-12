import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { db } from '../firebase/firebase.js';

const STATUS_STEPS = [
  { key: 'Payment Verified', emoji: '💳', label: 'Payment Verified' },
  { key: 'In Progress', emoji: '🟡', label: 'In Progress' },
  { key: 'In Review', emoji: '🔵', label: 'In Review' },
  { key: 'Complete', emoji: '🟢', label: 'Complete' }
];

export const data = new SlashCommandBuilder()
  .setName('trackorder')
  .setDescription('Track the status of your service order')
  .addStringOption(option =>
    option.setName('order_id').setDescription('Order ID (optional)').setRequired(false)
  );

function buildProgressBar(status) {
  let bar = '';
  let found = false;
  for (const step of STATUS_STEPS) {
    if (!found) {
      bar += `**${step.emoji} ${step.label}**`;
      if (step.key === status) found = true;
    } else {
      bar += ` → ${step.emoji} ${step.label}`;
    }
  }
  return bar;
}

function getStatusColor(status) {
  switch (status) {
    case 'Payment Verified':
      return 0x43B581; // Green
    case 'In Progress':
      return 0x5865F2; // Blue
    case 'In Review':
      return 0xFAA61A; // Orange
    case 'Complete':
      return 0x43B581; // Green
    case 'On Hold':
      return 0xFF5555; // Red
    case 'Cancelled':
      return 0xFF5555; // Red
    default:
      return 0x5865F2; // Blue
  }
}

export async function execute(interaction) {
  const orderId = interaction.options.getString('order_id');
  const userId = interaction.user.id;
  let order = null;
  
  try {
    // Fetch from Firestore
    let query;
    if (orderId) {
      query = await db.collection('orders').where('orderId', '==', orderId).limit(1).get();
    } else {
      query = await db.collection('orders').where('userId', '==', userId).orderBy('timestamp', 'desc').limit(1).get();
    }
    
    if (!query.empty) {
      order = query.docs[0].data();
    }
  } catch (err) {
    console.error('[ERROR] Fetching order from Firestore:', err);
    return interaction.reply({ content: '❌ Failed to fetch your order. Please try again later.', flags: 64 });
  }

  if (!order) {
    const embed = new EmbedBuilder()
      .setTitle('Order Not Found')
      .setDescription('We could not find any active or recent orders for you. To place an order, please open a ticket using `/ticketpanel` or the support panel.')
      .setColor(0xFF5555)
      .setFooter({ text: 'Lunary Services' });
    return interaction.reply({ embeds: [embed], flags: 64 });
  }

  // Build progress bar
  const progressBar = buildProgressBar(order.status);
  
  // Format timestamp
  const orderDate = order.timestamp ? new Date(order.timestamp.toDate()).toLocaleDateString() : 'N/A';
  const lastUpdated = order.lastUpdated ? new Date(order.lastUpdated.toDate()).toLocaleDateString() : 'N/A';
  
  const embed = new EmbedBuilder()
    .setTitle('📦 Order Status')
    .addFields(
      { name: '👤 User', value: `<@${order.userId}>`, inline: true },
      { name: '🆔 Order ID', value: `\`${order.orderId}\``, inline: true },
      { name: '🔧 Service', value: order.service || 'N/A', inline: true },
      { name: '💳 Payment Method', value: order.paymentMethod ? order.paymentMethod.toUpperCase() : 'N/A', inline: true },
      { name: '💰 Amount', value: order.amount || 'N/A', inline: true },
      { name: '📅 Order Date', value: orderDate, inline: true },
      { name: '📊 Status', value: order.status || 'N/A', inline: true },
      { name: '👨‍💼 Assigned Staff', value: order.staff ? `<@${order.staff}>` : 'Unassigned', inline: true },
      { name: '🔄 Last Updated', value: lastUpdated, inline: true }
    )
    .setColor(getStatusColor(order.status))
    .setFooter({ text: 'Lunary Services' })
    .setTimestamp();

  // Add payment ID if available
  if (order.paymentId && order.paymentId !== 'N/A') {
    embed.addFields({ name: '🔗 Payment ID', value: `\`${order.paymentId}\``, inline: true });
  }

  // Add progress bar for standard statuses
  if (['Payment Verified', 'In Progress', 'In Review', 'Complete'].includes(order.status)) {
    embed.addFields({ name: '📈 Progress', value: progressBar, inline: false });
  }

  // Add notes if available
  if (order.notes) {
    embed.addFields({ name: '📝 Notes / Updates', value: order.notes, inline: false });
  }

  // Add description based on status
  if (order.status === 'Complete') {
    embed.setDescription('✅ **Your order is complete!** Thank you for choosing Lunary Services.');
  } else if (order.status === 'Payment Verified') {
    embed.setDescription('💳 **Payment verified!** Your order is being processed.');
  } else if (order.status === 'In Progress') {
    embed.setDescription('🔄 **Work in progress!** Our team is working on your order.');
  } else if (order.status === 'In Review') {
    embed.setDescription('🔍 **Under review!** Your order is being reviewed for quality assurance.');
  } else if (order.status === 'On Hold') {
    embed.setDescription('⏸️ **Order on hold.** Please contact support for more information.');
  } else if (order.status === 'Cancelled') {
    embed.setDescription('❌ **Order cancelled.** Please contact support if you have questions.');
  }

  // Add buttons based on status
  let components = [];
  if (order.status === 'In Review') {
    components = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('request_revision')
          .setLabel('Request Revision')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true) // Placeholder for now
      )
    ];
  }

  await interaction.reply({ embeds: [embed], components, flags: 64 });
} 