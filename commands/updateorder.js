import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { db } from '../firebase/firebase.js';

const VALID_STATUSES = [
  'Payment Verified',
  'In Progress',
  'In Review',
  'Complete',
  'On Hold',
  'Cancelled'
];

export const data = new SlashCommandBuilder()
  .setName('updateorder')
  .setDescription('Update the status of an existing order')
  .addStringOption(option =>
    option.setName('order_id')
      .setDescription('The order ID to update')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('status')
      .setDescription('New status for the order')
      .setRequired(true)
      .addChoices(
        { name: 'Payment Verified', value: 'Payment Verified' },
        { name: 'In Progress', value: 'In Progress' },
        { name: 'In Review', value: 'In Review' },
        { name: 'Complete', value: 'Complete' },
        { name: 'On Hold', value: 'On Hold' },
        { name: 'Cancelled', value: 'Cancelled' }
      )
  )
  .addStringOption(option =>
    option.setName('notes')
      .setDescription('Additional notes or updates about the order')
      .setRequired(false)
  )
  .addUserOption(option =>
    option.setName('assigned_staff')
      .setDescription('Staff member assigned to this order')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const orderId = interaction.options.getString('order_id');
  const newStatus = interaction.options.getString('status');
  const notes = interaction.options.getString('notes') || '';
  const assignedStaff = interaction.options.getUser('assigned_staff');

  try {
    // Find the order
    const orderQuery = await db.collection('orders').where('orderId', '==', orderId).limit(1).get();
    
    if (orderQuery.empty) {
      return interaction.reply({
        content: `❌ **Order ID \`${orderId}\` not found in the system.**`,
        flags: 64
      });
    }

    const orderDoc = orderQuery.docs[0];
    const orderData = orderDoc.data();
    const oldStatus = orderData.status;

    // Prepare update data
    const updateData = {
      status: newStatus,
      lastUpdated: new Date(),
      updatedBy: interaction.user.id,
      updatedByUsername: interaction.user.tag
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (assignedStaff) {
      updateData.staff = assignedStaff.id;
      updateData.staffUsername = assignedStaff.tag;
    }

    // Update the order
    await orderDoc.ref.update(updateData);

    // Create success embed
    const embed = new EmbedBuilder()
      .setTitle('✅ Order Updated Successfully')
      .setDescription(`Order \`${orderId}\` status has been updated`)
      .addFields(
        { name: '👤 User', value: `<@${orderData.userId}>`, inline: true },
        { name: '🆔 Order ID', value: `\`${orderId}\``, inline: true },
        { name: '🔧 Service', value: orderData.service, inline: true },
        { name: '📊 Old Status', value: oldStatus, inline: true },
        { name: '📊 New Status', value: newStatus, inline: true },
        { name: '💰 Amount', value: orderData.amount, inline: true }
      )
      .setColor(getStatusColor(newStatus))
      .setFooter({ text: `Updated by ${interaction.user.tag}` })
      .setTimestamp();

    if (notes) {
      embed.addFields({ name: '📝 Notes', value: notes, inline: false });
    }

    if (assignedStaff) {
      embed.addFields({ name: '👨‍💼 Assigned Staff', value: assignedStaff.toString(), inline: true });
    }

    await interaction.reply({ embeds: [embed], flags: 64 });

    // DM the user about the status update
    try {
      const userEmbed = new EmbedBuilder()
        .setTitle('📦 Order Status Update')
        .setDescription(`Your order status has been updated!`)
        .addFields(
          { name: '🆔 Order ID', value: `\`${orderId}\``, inline: true },
          { name: '🔧 Service', value: orderData.service, inline: true },
          { name: '📊 Status', value: newStatus, inline: true }
        )
        .setColor(getStatusColor(newStatus))
        .setFooter({ text: 'Lunary Services' })
        .setTimestamp();

      if (notes) {
        userEmbed.addFields({ name: '📝 Update Notes', value: notes, inline: false });
      }

      if (assignedStaff) {
        userEmbed.addFields({ name: '👨‍💼 Assigned Staff', value: assignedStaff.toString(), inline: true });
      }

      const user = await interaction.client.users.fetch(orderData.userId);
      await user.send({
        content: `**Your order status has been updated!** 📦\n\nYou can track your order anytime using:\n\`/trackorder order_id:${orderId}\``,
        embeds: [userEmbed]
      });
    } catch (dmError) {
      console.log(`Could not DM user for order ${orderId}:`, dmError.message);
    }

  } catch (error) {
    console.error('Error updating order:', error);
    await interaction.reply({
      content: '❌ **Failed to update order. Please try again.**',
      flags: 64
    });
  }
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