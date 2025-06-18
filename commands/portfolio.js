import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('portfolio')
  .setDescription('Showcase the Velari bot, apps, websites, and GFX portfolio');

export async function execute(interaction) {
  try {
    // Defer the reply immediately to prevent timeout
    await interaction.deferReply();

    const tweakAppUrl = 'https://cdn.discordapp.com/attachments/1369447488716800191/1382586323679842397/image.png?ex=68504e9a&is=684efd1a&hm=b7c2c05ec949cb365db19ac6cbe2b16e644db11b92d4cf5ea4c7067ffac6113b&';
    const routelagAppUrl = 'https://cdn.discordapp.com/attachments/1369447488716800191/1382586396711190579/image.png?ex=68504eac&is=684efd2c&hm=7fd42abc91c6a9d1dd0e2ff0d029781865653d1273df091de7204f8c4619b523&';
    const montageUrl = 'https://cdn.discordapp.com/attachments/1369447488716800191/1383893466479722557/bobtage_4.mp4?ex=685072b9&is=684f2139&hm=2220f09872bcc5501b1e19755f926d97a1c82c66e06a258f04475f4e03620f6d&';

    const embed = new EmbedBuilder()
      .setTitle('🎨 Velari Portfolio')
      .setColor('#5865F2')
      .setDescription('Explore our apps, websites, and GFX work!')
      .addFields(
        { name: '🌐 Websites', value: '[RouteLag](https://www.routelag.com/)\n[Zylo Tweaks](https://zylo-tweaks-web.vercel.app/)', inline: false },
        { name: '🖥️ Apps', value: 'RouteLag App\nTweak App\n(see images below)', inline: false },
        { name: '🎨 GFX Portfolio', value: '[Google Drive GFX Folder](https://drive.google.com/drive/folders/1KhzOZuxxE-QdZBDo00-lz4lYmJkOxXxd?usp=drive_link)\n[Montage Video](' + montageUrl + ')', inline: false },
        { name: '🤖 Velari Bot', value: 'All-in-one Discord bot for community management, support, and automation. Includes premium key system, reviews, welcome banners, tickets, moderation, and more.', inline: false },
        { name: '💰 Pricing Overview', value: '**Starting Prices:**\n• Discord Bot: $25/month\n• Mobile Apps: $15-20/month\n• Web Development: $200+\n• GFX Design: $25+\n\n**Use `/price` for detailed pricing!**', inline: false }
      )
      .setImage(routelagAppUrl)
      .setThumbnail(tweakAppUrl)
      .setFooter({ text: 'Velari • Bot, Apps, GFX & More' })
      .setTimestamp();

    // Create action buttons
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('portfolio_price')
          .setLabel('View Pricing')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('💰'),
        new ButtonBuilder()
          .setCustomId('portfolio_order')
          .setLabel('Place Order')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🛒'),
        new ButtonBuilder()
          .setCustomId('portfolio_support')
          .setLabel('Get Support')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🎫')
      );

    await interaction.editReply({
      embeds: [embed],
      components: [row]
    });
  } catch (error) {
    console.error('Error in portfolio command:', error);
    
    try {
      if (interaction.deferred) {
        await interaction.editReply({ 
          content: '❌ **An error occurred while loading the portfolio.**',
          embeds: []
        });
      } else if (!interaction.replied) {
        await interaction.reply({ 
          content: '❌ **An error occurred while loading the portfolio.**',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error message:', replyError);
    }
  }
}

// Handle button interactions for portfolio command
export async function handlePortfolioButton(interaction, client) {
  const { customId } = interaction;

  try {
    if (customId === 'portfolio_price') {
      await handleViewPricing(interaction);
    } else if (customId === 'portfolio_order') {
      await handlePlaceOrder(interaction);
    } else if (customId === 'portfolio_support') {
      await handleGetSupport(interaction);
    }
  } catch (error) {
    console.error('Error handling portfolio button:', error);
    await interaction.reply({
      content: '❌ **An error occurred while processing your request.**',
      ephemeral: true
    });
  }
}

async function handleViewPricing(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('💰 **View Detailed Pricing**')
    .setColor('#00D4AA')
    .setDescription('**Use `/price` to see our complete pricing guide!**\n\n**Includes:**\n• All service prices\n• Package deals\n• Payment methods\n• Special offers\n• Contact information\n\n**Get the full pricing breakdown!**');

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
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
    .setDescription('**Need help or have questions?**\n\n**Support Options:**\n• **Create Ticket:** Use `/ticket` command\n• **Contact Admin:** DM a server administrator\n• **FAQ:** Check our documentation\n• **Live Chat:** Available during business hours\n\n**We\'re here to help!**');

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
} 
