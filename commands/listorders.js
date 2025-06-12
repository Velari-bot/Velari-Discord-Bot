import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { db } from '../firebase/firebase.js';

export const data = new SlashCommandBuilder()
  .setName('listorders')
  .setDescription('List all orders with filtering options')
  .addStringOption(option =>
    option.setName('status')
      .setDescription('Filter by order status')
      .setRequired(false)
      .addChoices(
        { name: 'All Orders', value: 'all' },
        { name: 'Payment Verified', value: 'Payment Verified' },
        { name: 'In Progress', value: 'In Progress' },
        { name: 'In Review', value: 'In Review' },
        { name: 'Complete', value: 'Complete' },
        { name: 'On Hold', value: 'On Hold' },
        { name: 'Cancelled', value: 'Cancelled' }
      )
  )
  .addStringOption(option =>
    option.setName('service')
      .setDescription('Filter by service type')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option.setName('limit')
      .setDescription('Number of orders to show (max 25)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(25)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const statusFilter = interaction.options.getString('status') || 'all';
  const serviceFilter = interaction.options.getString('service');
  const limit = interaction.options.getInteger('limit') || 10;

  try {
    let query = db.collection('orders').orderBy('timestamp', 'desc').limit(limit);
    
    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.where('status', '==', statusFilter);
    }

    const snapshot = await query.get();
    
    if (snapshot.empty) {
      const embed = new EmbedBuilder()
        .setTitle('📋 Orders List')
        .setDescription('No orders found matching your criteria.')
        .setColor(0xFF5555)
        .setFooter({ text: 'Lunary Services' });
      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    const orders = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Apply service filter if specified
      if (!serviceFilter || data.service?.toLowerCase().includes(serviceFilter.toLowerCase())) {
        orders.push(data);
      }
    });

    if (orders.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📋 Orders List')
        .setDescription('No orders found matching your criteria.')
        .setColor(0xFF5555)
        .setFooter({ text: 'Lunary Services' });
      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    // Create embed with order list
    const embed = new EmbedBuilder()
      .setTitle('📋 Orders List')
      .setDescription(`Showing ${orders.length} order(s)`)
      .setColor(0x5865F2)
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    // Add order fields
    orders.forEach((order, index) => {
      const orderDate = order.timestamp ? new Date(order.timestamp.toDate()).toLocaleDateString() : 'N/A';
      const statusEmoji = getStatusEmoji(order.status);
      
      embed.addFields({
        name: `${index + 1}. ${statusEmoji} Order \`${order.orderId}\``,
        value: `**User:** <@${order.userId}>\n**Service:** ${order.service}\n**Amount:** ${order.amount}\n**Status:** ${order.status}\n**Date:** ${orderDate}`,
        inline: false
      });
    });

    // Add filter info
    const filterInfo = [];
    if (statusFilter !== 'all') filterInfo.push(`Status: ${statusFilter}`);
    if (serviceFilter) filterInfo.push(`Service: ${serviceFilter}`);
    if (filterInfo.length > 0) {
      embed.addFields({ name: '🔍 Filters Applied', value: filterInfo.join(' | '), inline: false });
    }

    await interaction.reply({ embeds: [embed], flags: 64 });

  } catch (error) {
    console.error('Error listing orders:', error);
    await interaction.reply({
      content: '❌ **Failed to fetch orders. Please try again.**',
      flags: 64
    });
  }
}

function getStatusEmoji(status) {
  switch (status) {
    case 'Payment Verified':
      return '💳';
    case 'In Progress':
      return '🔄';
    case 'In Review':
      return '🔍';
    case 'Complete':
      return '✅';
    case 'On Hold':
      return '⏸️';
    case 'Cancelled':
      return '❌';
    default:
      return '📦';
  }
} 