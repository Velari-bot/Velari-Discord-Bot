import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { redeemKey, getUserKeys } from '../firebase/keys.js';
import { getTimeRemaining, formatKeyForDisplay } from '../utils/keyGenerator.js';

export const data = new SlashCommandBuilder()
  .setName('redeem')
  .setDescription('Redeem a premium key to access premium features')
  .addStringOption(option =>
    option.setName('key')
      .setDescription('The premium key to redeem')
      .setRequired(true));

export async function execute(interaction, client) {
  try {
    const key = interaction.options.getString('key');
    const userId = interaction.user.id;
    const username = interaction.user.username;

    await interaction.deferReply();

    try {
      // Format the key for consistency
      const formattedKey = formatKeyForDisplay(key);
      
      // Attempt to redeem the key
      const keyData = await redeemKey(formattedKey, userId, username);

      const embed = new EmbedBuilder()
        .setTitle('🎉 **Key Redeemed Successfully!**')
        .setColor('#4CAF50')
        .setDescription(`**Welcome to premium access!**`)
        .addFields(
          { name: '🔑 **Key**', value: `\`${formattedKey}\``, inline: true },
          { name: '🎯 **Model**', value: keyData.model, inline: true },
          { name: '⏰ **Duration**', value: keyData.duration, inline: true },
          { name: '📅 **Expires**', value: keyData.expiresAt ? keyData.expiresAt.toDate().toLocaleDateString() : 'Never', inline: true },
          { name: '👤 **Redeemed By**', value: `<@${userId}>`, inline: true },
          { name: '🕒 **Time Remaining**', value: getTimeRemaining(keyData.expiresAt), inline: true }
        )
        .setTimestamp();

      // Add model-specific instructions
      const instructions = getModelInstructions(keyData.model);
      if (instructions) {
        embed.addFields({
          name: '📋 **Next Steps**',
          value: instructions,
          inline: false
        });
      }

      // Create buttons for additional actions
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('redeem_view_keys')
            .setLabel('View My Keys')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔑'),
          new ButtonBuilder()
            .setCustomId('redeem_support')
            .setLabel('Get Support')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🎫')
        );

      await interaction.editReply({ 
        embeds: [embed], 
        components: [row],
        content: '✅ **Your premium key has been successfully redeemed!**'
      });

      // Send a public confirmation (optional)
      const publicEmbed = new EmbedBuilder()
        .setTitle('🎉 **Premium Access Activated!**')
        .setColor('#4CAF50')
        .setDescription(`**Congratulations <@${userId}>!**\nYou now have access to **${keyData.model}** premium features!`)
        .setTimestamp();

      await interaction.followUp({ 
        embeds: [publicEmbed], 
        ephemeral: true 
      });

    } catch (error) {
      let errorMessage = '❌ **Failed to redeem key.**';
      
      if (error.message === 'Key not found') {
        errorMessage = '❌ **Invalid key. Please check the key and try again.**';
      } else if (error.message === 'Key is already used or deactivated') {
        errorMessage = '❌ **This key has already been used or is deactivated.**';
      } else if (error.message === 'Key has expired') {
        errorMessage = '❌ **This key has expired and can no longer be used.**';
      }

      await interaction.editReply({
        content: errorMessage,
        ephemeral: true
      });
    }

  } catch (error) {
    console.error('Error in redeem command:', error);
    await interaction.editReply({
      content: '❌ **An error occurred while processing your request.**',
      ephemeral: true
    });
  }
}

function getModelInstructions(model) {
  const instructions = {
    'premium_tweak': '**Premium Tweak App Access:**\n• Download the app from our official source\n• Use your Discord account to log in\n• Premium features are now unlocked!\n\n**Need help?** Create a support ticket!',
    'premium_bot': '**Premium Discord Bot Access:**\n• Your server now has access to premium bot features\n• Contact an admin to set up premium commands\n• Enjoy enhanced functionality!\n\n**Need help?** Create a support ticket!',
    'premium_api': '**Premium API Access:**\n• You now have access to our premium API endpoints\n• Check your DMs for API credentials\n• Review the documentation for usage examples\n\n**Need help?** Create a support ticket!'
  };

  return instructions[model] || '**Premium access activated!**\nContact support if you need assistance with your new features.';
}

// Handle button interactions for redeem command
export async function handleRedeemButton(interaction, client) {
  const { customId } = interaction;

  if (customId === 'redeem_view_keys') {
    await handleViewUserKeys(interaction);
  } else if (customId === 'redeem_support') {
    await handleSupportRequest(interaction);
  }
}

async function handleViewUserKeys(interaction) {
  try {
    const userId = interaction.user.id;
    const userKeys = await getUserKeys(userId);

    if (userKeys.length === 0) {
      await interaction.reply({
        content: '❌ **You haven\'t redeemed any keys yet.**',
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🔑 **Your Redeemed Keys**')
      .setColor('#2196F3')
      .setDescription(`**You have redeemed ${userKeys.length} key(s)**`);

    // Group keys by model
    const keysByModel = {};
    userKeys.forEach(key => {
      if (!keysByModel[key.model]) {
        keysByModel[key.model] = [];
      }
      keysByModel[key.model].push(key);
    });

    Object.entries(keysByModel).forEach(([model, keys]) => {
      const keyList = keys.map(key => {
        const status = getTimeRemaining(key.expiresAt);
        const redeemedDate = key.redeemedAt.toDate().toLocaleDateString();
        return `• \`${key.key}\` - ${status} (Redeemed: ${redeemedDate})`;
      }).join('\n');

      embed.addFields({
        name: `🎯 **${model}** (${keys.length})`,
        value: keyList,
        inline: false
      });
    });

    embed.setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });

  } catch (error) {
    console.error('Error viewing user keys:', error);
    await interaction.reply({
      content: '❌ **Failed to retrieve your keys.**',
      ephemeral: true
    });
  }
}

async function handleSupportRequest(interaction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🎫 **Support Request**')
      .setColor('#FF9800')
      .setDescription('**Need help with your premium access?**\n\n**Options:**\n• Create a support ticket using `/ticket`\n• Contact an admin directly\n• Check our documentation\n\n**We\'re here to help!**');

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });

  } catch (error) {
    console.error('Error handling support request:', error);
    await interaction.reply({
      content: '❌ **Failed to process support request.**',
      ephemeral: true
    });
  }
} 
