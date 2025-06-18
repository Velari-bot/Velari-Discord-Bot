import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('price')
  .setDescription('View pricing for all Velari services and products');

export async function execute(interaction) {
  try {
    await interaction.deferReply();

    const embed = new EmbedBuilder()
      .setTitle('💰 **Velari Pricing Guide**')
      .setColor('#00D4AA')
      .setDescription('**Complete pricing for all our premium services and products**')
      .addFields(
        {
          name: '🤖 **Discord Bot Services**',
          value: '**Premium Bot Setup:** $25/month\n**Custom Bot Development:** $50-200\n**Bot Hosting & Maintenance:** $15/month\n**Priority Support:** $10/month',
          inline: false
        },
        {
          name: '📱 **Mobile Apps**',
          value: '**Tweak App Premium:** $15/month\n**RouteLag App Premium:** $20/month\n**Custom App Development:** $100-500\n**App Store Publishing:** $50',
          inline: false
        },
        {
          name: '🌐 **Web Development**',
          value: '**Website Design:** $200-1000\n**E-commerce Site:** $500-2000\n**Custom Web App:** $300-1500\n**Website Maintenance:** $50/month',
          inline: false
        },
        {
          name: '🎨 **GFX & Design**',
          value: '**Logo Design:** $50-200\n**Banner Design:** $25-100\n**Social Media Graphics:** $15-50 each\n**Full Brand Package:** $300-800',
          inline: false
        },
        {
          name: '🔑 **Premium Keys**',
          value: '**Tweak App Key:** $15/month\n**Bot Premium Key:** $25/month\n**API Access Key:** $30/month\n**Lifetime Access:** $200-500',
          inline: false
        },
        {
          name: '📦 **Package Deals**',
          value: '**Starter Package:** $50/month\n• Basic bot + tweak app + support\n\n**Pro Package:** $100/month\n• Full bot suite + all apps + priority support\n\n**Enterprise:** $200/month\n• Everything + custom development',
          inline: false
        }
      )
      .addFields(
        {
          name: '💳 **Payment Methods**',
          value: '• PayPal\n• Stripe\n• Crypto (BTC, ETH)\n• Bank Transfer',
          inline: true
        },
        {
          name: '🎁 **Special Offers**',
          value: '• **New Customer:** 20% off first month\n• **Annual Plans:** 15% discount\n• **Referral Program:** $10 credit\n• **Student Discount:** 25% off',
          inline: true
        },
        {
          name: '📞 **Get Started**',
          value: '• Use `/ticket` to create an order\n• Contact an admin directly\n• Check our portfolio with `/portfolio`\n• View our reviews with `/review`',
          inline: true
        }
      )
      .setFooter({ text: 'Velari • Premium Services & Development' })
      .setTimestamp();

    // Create action buttons
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('price_order')
          .setLabel('Place Order')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🛒'),
        new ButtonBuilder()
          .setCustomId('price_support')
          .setLabel('Get Support')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🎫'),
        new ButtonBuilder()
          .setCustomId('price_portfolio')
          .setLabel('View Portfolio')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🎨')
      );

    await interaction.editReply({
      embeds: [embed],
      components: [row]
    });

  } catch (error) {
    console.error('Error in price command:', error);
    
    try {
      if (interaction.deferred) {
        await interaction.editReply({ 
          content: '❌ **An error occurred while loading pricing information.**',
          embeds: []
        });
      } else if (!interaction.replied) {
        await interaction.reply({ 
          content: '❌ **An error occurred while loading pricing information.**',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error message:', replyError);
    }
  }
}

// Handle button interactions for price command
export async function handlePriceButton(interaction, client) {
  const { customId } = interaction;

  try {
    if (customId === 'price_order') {
      await handlePlaceOrder(interaction);
    } else if (customId === 'price_support') {
      await handleGetSupport(interaction);
    } else if (customId === 'price_portfolio') {
      await handleViewPortfolio(interaction);
    }
  } catch (error) {
    console.error('Error handling price button:', error);
    await interaction.reply({
      content: '❌ **An error occurred while processing your request.**',
      ephemeral: true
    });
  }
}

async function handlePlaceOrder(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🛒 **Place Your Order**')
    .setColor('#4CAF50')
    .setDescription('**Ready to get started? Here\'s how to place your order:**\n\n**1.** Use `/ticket` to create a support ticket\n**2.** Specify which service you want\n**3.** Provide your requirements\n**4.** We\'ll get back to you within 24 hours\n\n**Or contact an admin directly for immediate assistance!**');

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}

async function handleGetSupport(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🎫 **Get Support**')
    .setColor('#FF9800')
    .setDescription('**Need help with pricing or have questions?**\n\n**Support Options:**\n• **Create Ticket:** Use `/ticket` command\n• **Contact Admin:** DM a server administrator\n• **FAQ:** Check our documentation\n• **Live Chat:** Available during business hours\n\n**We\'re here to help you choose the right plan!**');

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}

async function handleViewPortfolio(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🎨 **View Our Portfolio**')
    .setColor('#2196F3')
    .setDescription('**Check out our work and see what we can do for you!**\n\n**Use `/portfolio` to see:**\n• Our websites and apps\n• GFX portfolio and designs\n• Bot features and capabilities\n• Client testimonials and reviews\n\n**See the quality you can expect!**');

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
} 