import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUserKeys } from '../firebase/keys.js';
import { getTimeRemaining } from '../utils/keyGenerator.js';

export const data = new SlashCommandBuilder()
  .setName('mykeys')
  .setDescription('View your redeemed premium keys and subscription status');

export async function execute(interaction, client) {
  try {
    const userId = interaction.user.id;
    
    await interaction.deferReply({ flags: 64 });

    try {
      const userKeys = await getUserKeys(userId);

      if (userKeys.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('🔑 **No Keys Found**')
          .setColor('#FF9800')
          .setDescription('**You haven\'t redeemed any premium keys yet.**\n\n**To get premium access:**\n• Purchase a subscription\n• Receive a key from an admin\n• Use `/redeem <key>` to activate it\n\n**Need help?** Contact an admin or create a support ticket!')
          .setTimestamp();

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('mykeys_support')
              .setLabel('Get Support')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('🎫'),
            new ButtonBuilder()
              .setCustomId('mykeys_info')
              .setLabel('Learn More')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('ℹ️')
          );

        await interaction.editReply({ embeds: [embed], components: [row] });
        return;
      }

      // Group keys by model and calculate active subscriptions
      const keysByModel = {};
      const activeSubscriptions = [];
      const expiredSubscriptions = [];

      userKeys.forEach(key => {
        if (!keysByModel[key.model]) {
          keysByModel[key.model] = [];
        }
        keysByModel[key.model].push(key);

        const timeRemaining = getTimeRemaining(key.expiresAt);
        if (timeRemaining !== 'Expired' && timeRemaining !== 'Lifetime') {
          activeSubscriptions.push({
            model: key.model,
            timeRemaining: timeRemaining,
            expiresAt: key.expiresAt
          });
        } else if (timeRemaining === 'Lifetime') {
          activeSubscriptions.push({
            model: key.model,
            timeRemaining: 'Lifetime',
            expiresAt: null
          });
        } else {
          expiredSubscriptions.push({
            model: key.model,
            redeemedAt: key.redeemedAt
          });
        }
      });

      const embed = new EmbedBuilder()
        .setTitle('🔑 **Your Premium Keys**')
        .setColor('#2196F3')
        .setDescription(`**You have redeemed ${userKeys.length} key(s)**`)
        .setTimestamp();

      // Add active subscriptions summary
      if (activeSubscriptions.length > 0) {
        const activeList = activeSubscriptions.map(sub => {
          const status = sub.timeRemaining === 'Lifetime' ? '♾️' : '✅';
          return `${status} **${sub.model}** - ${sub.timeRemaining}`;
        }).join('\n');

        embed.addFields({
          name: `🎯 **Active Subscriptions** (${activeSubscriptions.length})`,
          value: activeList,
          inline: false
        });
      }

      // Add expired subscriptions
      if (expiredSubscriptions.length > 0) {
        const expiredList = expiredSubscriptions.map(sub => {
          const date = sub.redeemedAt.toDate().toLocaleDateString();
          return `❌ **${sub.model}** - Expired (Redeemed: ${date})`;
        }).join('\n');

        embed.addFields({
          name: `⏰ **Expired Subscriptions** (${expiredSubscriptions.length})`,
          value: expiredList,
          inline: false
        });
      }

      // Add detailed key information by model
      Object.entries(keysByModel).forEach(([model, keys]) => {
        const keyList = keys.map(key => {
          const status = getTimeRemaining(key.expiresAt);
          const redeemedDate = key.redeemedAt.toDate().toLocaleDateString();
          const statusEmoji = status === 'Expired' ? '❌' : status === 'Lifetime' ? '♾️' : '✅';
          return `${statusEmoji} \`${key.key}\` - ${status} (Redeemed: ${redeemedDate})`;
        }).join('\n');

        embed.addFields({
          name: `🔑 **${model}** (${keys.length} key(s))`,
          value: keyList,
          inline: false
        });
      });

      // Create action buttons
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('mykeys_redeem')
            .setLabel('Redeem New Key')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔑'),
          new ButtonBuilder()
            .setCustomId('mykeys_support')
            .setLabel('Get Support')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🎫'),
          new ButtonBuilder()
            .setCustomId('mykeys_refresh')
            .setLabel('Refresh')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🔄')
        );

      await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
      console.error('Error retrieving user keys:', error);
      await interaction.editReply({
        content: '❌ **Failed to retrieve your keys. Please try again.**',
        flags: 64
      });
    }

  } catch (error) {
    console.error('Error in mykeys command:', error);
    await interaction.editReply({
      content: '❌ **An error occurred while processing your request.**',
      flags: 64
    });
  }
}

// Handle button interactions for mykeys command
export async function handleMyKeysButton(interaction, client) {
  const { customId } = interaction;

  if (customId === 'mykeys_redeem') {
    await handleRedeemNewKey(interaction);
  } else if (customId === 'mykeys_support') {
    await handleSupportRequest(interaction);
  } else if (customId === 'mykeys_info') {
    await handleLearnMore(interaction);
  } else if (customId === 'mykeys_refresh') {
    // Re-execute the command
    await execute(interaction, client);
  }
}

async function handleRedeemNewKey(interaction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🔑 **Redeem New Key**')
      .setColor('#4CAF50')
      .setDescription('**To redeem a new premium key:**\n\n**1.** Use `/redeem <key>` command\n**2.** Enter your premium key\n**3.** Follow the instructions\n\n**Don\'t have a key?**\n• Purchase a subscription\n• Contact an admin\n• Create a support ticket');

    await interaction.reply({
      embeds: [embed],
      flags: 64
    });

  } catch (error) {
    console.error('Error handling redeem new key:', error);
    await interaction.reply({
      content: '❌ **Failed to process request.**',
      flags: 64
    });
  }
}

async function handleSupportRequest(interaction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🎫 **Support Request**')
      .setColor('#FF9800')
      .setDescription('**Need help with your premium access?**\n\n**Available Support Options:**\n• **Create a ticket:** Use `/ticket` command\n• **Contact Admin:** DM a server administrator\n• **Check Documentation:** Review our guides\n• **FAQ:** Common questions and answers\n\n**We\'re here to help you get the most out of your premium features!**');

    await interaction.reply({
      embeds: [embed],
      flags: 64
    });

  } catch (error) {
    console.error('Error handling support request:', error);
    await interaction.reply({
      content: '❌ **Failed to process support request.**',
      flags: 64
    });
  }
}

async function handleLearnMore(interaction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('ℹ️ **Premium Features Information**')
      .setColor('#9C27B0')
      .setDescription('**Learn about our premium features:**\n\n**🎯 Premium Tweak App:**\n• Advanced customization options\n• Priority support\n• Early access to new features\n• Exclusive themes and tweaks\n\n**🤖 Premium Discord Bot:**\n• Enhanced moderation tools\n• Custom commands\n• Advanced analytics\n• Priority processing\n\n**🔌 Premium API Access:**\n• High rate limits\n• Advanced endpoints\n• Priority support\n• Documentation access\n\n**Ready to upgrade?** Contact an admin to purchase!');

    await interaction.reply({
      embeds: [embed],
      flags: 64
    });

  } catch (error) {
    console.error('Error handling learn more:', error);
    await interaction.reply({
      content: '❌ **Failed to load information.**',
      flags: 64
    });
  }
} 