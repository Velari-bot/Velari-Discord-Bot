import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { db } from '../firebase/firebase.js';

// Function to generate a unique order ID
function generateOrderId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Function to ensure order ID is unique
async function generateUniqueOrderId() {
    let orderId;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
        orderId = generateOrderId();
        const existingOrder = await db.collection('orders').where('orderId', '==', orderId).limit(1).get();
        attempts++;
        
        if (existingOrder.empty) {
            return orderId;
        }
    } while (attempts < maxAttempts);
    
    // If we can't find a unique ID after max attempts, add timestamp
    return generateOrderId() + Date.now().toString().slice(-4);
}

export const data = new SlashCommandBuilder()
  .setName('addorder')
  .setDescription('Add an order to a user after payment verification')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('The user who made the purchase')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('service')
      .setDescription('What service was purchased')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('payment_method')
      .setDescription('Payment method used (Stripe/PayPal)')
      .setRequired(true)
      .addChoices(
        { name: 'Stripe', value: 'stripe' },
        { name: 'PayPal', value: 'paypal' }
      )
  )
  .addStringOption(option =>
    option.setName('amount')
      .setDescription('Payment amount (e.g., $50.00)')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('payment_id')
      .setDescription('Payment ID from Stripe/PayPal (optional)')
      .setRequired(false)
  )
  .addStringOption(option =>
    option.setName('notes')
      .setDescription('Additional notes about the order')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('user');
  const service = interaction.options.getString('service');
  const paymentMethod = interaction.options.getString('payment_method');
  const amount = interaction.options.getString('amount');
  const paymentId = interaction.options.getString('payment_id') || 'N/A';
  const notes = interaction.options.getString('notes') || 'No additional notes';

  try {
    // Generate a unique order ID
    const orderId = await generateUniqueOrderId();

    // Create the order document
    const orderData = {
      orderId,
      userId: targetUser.id,
      username: targetUser.tag,
      service,
      paymentMethod,
      paymentId,
      amount,
      notes,
      status: 'Payment Verified',
      timestamp: new Date(),
      addedBy: interaction.user.id,
      addedByUsername: interaction.user.tag
    };

    await db.collection('orders').add(orderData);

    // Create success embed
    const embed = new EmbedBuilder()
      .setTitle('✅ Order Added Successfully')
      .setDescription(`Order has been added to the system for ${targetUser.toString()}`)
      .addFields(
        { name: '👤 User', value: targetUser.toString(), inline: true },
        { name: '🆔 Order ID', value: `\`${orderId}\``, inline: true },
        { name: '🔧 Service', value: service, inline: true },
        { name: '💳 Payment Method', value: paymentMethod.toUpperCase(), inline: true },
        { name: '💰 Amount', value: amount, inline: true },
        { name: '🔗 Payment ID', value: paymentId, inline: true },
        { name: '📝 Notes', value: notes, inline: false }
      )
      .setColor(0x43B581)
      .setFooter({ text: `Added by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    // DM the user about their order
    try {
      const userEmbed = new EmbedBuilder()
        .setTitle('🎉 Payment Verified!')
        .setDescription(`Your payment has been verified and your order has been processed!`)
        .addFields(
          { name: '🆔 Order ID', value: `\`${orderId}\``, inline: true },
          { name: '🔧 Service', value: service, inline: true },
          { name: '💰 Amount', value: amount, inline: true },
          { name: '📊 Status', value: 'Payment Verified', inline: true }
        )
        .setColor(0x43B581)
        .setFooter({ text: 'Lunary Services' })
        .setTimestamp();

      await targetUser.send({
        content: `**Thank you for your purchase!** 🎉\n\nYou can track your order anytime using:\n\`/trackorder order_id:${orderId}\``,
        embeds: [userEmbed]
      });
    } catch (dmError) {
      console.log(`Could not DM user ${targetUser.tag}:`, dmError.message);
    }

  } catch (error) {
    console.error('Error adding order:', error);
    await interaction.reply({
      content: '❌ **Failed to add order to the system. Please try again.**',
      ephemeral: true
    });
  }
} 
