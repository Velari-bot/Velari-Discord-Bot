import { EmbedBuilder } from 'discord.js';
import { getActiveKeysByModel } from '../firebase/keys.js';
import { getTimeRemaining, formatDuration } from './keyGenerator.js';
import { CHANNEL_IDS } from '../config.js';

// Key delivery system
export async function sendKeyToUser(client, userId, keyData, reason = 'Purchase') {
  try {
    const user = await client.users.fetch(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const embed = new EmbedBuilder()
      .setTitle('🔑 **Your Premium Key**')
      .setColor('#4CAF50')
      .setDescription(`**Thank you for your ${reason.toLowerCase()}!**\n\n**Your premium key has been generated and is ready to use.**`)
      .addFields(
        { name: '🔑 **Key**', value: `\`${keyData.key}\``, inline: true },
        { name: '🎯 **Model**', value: keyData.model, inline: true },
        { name: '⏰ **Duration**', value: formatDuration(keyData.duration), inline: true },
        { name: '📅 **Expires**', value: keyData.expiresAt ? keyData.expiresAt.toDate().toLocaleDateString() : 'Never', inline: true },
        { name: '🕒 **Time Remaining**', value: getTimeRemaining(keyData.expiresAt), inline: true }
      )
      .setTimestamp();

    // Add model-specific instructions
    const instructions = getModelInstructions(keyData.model);
    if (instructions) {
      embed.addFields({
        name: '📋 **How to Activate**',
        value: instructions,
        inline: false
      });
    }

    // Add footer with support information
    embed.setFooter({
      text: 'Need help? Create a support ticket or contact an admin!',
      iconURL: client.user.displayAvatarURL()
    });

    await user.send({ embeds: [embed] });
    
    return true;
  } catch (error) {
    console.error('Error sending key to user:', error);
    return false;
  }
}

export async function sendBulkKeysToUser(client, userId, keys, reason = 'Bulk Purchase') {
  try {
    const user = await client.users.fetch(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const embed = new EmbedBuilder()
      .setTitle('🔑 **Your Premium Keys**')
      .setColor('#4CAF50')
      .setDescription(`**Thank you for your ${reason.toLowerCase()}!**\n\n**You have received ${keys.length} premium key(s).**`)
      .setTimestamp();

    // Group keys by model
    const keysByModel = {};
    keys.forEach(key => {
      if (!keysByModel[key.model]) {
        keysByModel[key.model] = [];
      }
      keysByModel[key.model].push(key);
    });

    Object.entries(keysByModel).forEach(([model, modelKeys]) => {
      const keyList = modelKeys.map(key => {
        const timeRemaining = getTimeRemaining(key.expiresAt);
        return `• \`${key.key}\` - ${formatDuration(key.duration)} (${timeRemaining})`;
      }).join('\n');

      embed.addFields({
        name: `🎯 **${model}** (${modelKeys.length} key(s))`,
        value: keyList,
        inline: false
      });
    });

    // Add activation instructions
    embed.addFields({
      name: '📋 **How to Activate**',
      value: '**1.** Use `/redeem <key>` command\n**2.** Enter one of your keys above\n**3.** Follow the instructions\n\n**You can redeem keys one at a time as needed!**',
      inline: false
    });

    embed.setFooter({
      text: 'Need help? Create a support ticket or contact an admin!',
      iconURL: client.user.displayAvatarURL()
    });

    await user.send({ embeds: [embed] });
    
    return true;
  } catch (error) {
    console.error('Error sending bulk keys to user:', error);
    return false;
  }
}

export async function sendKeyExpiryWarning(client, userId, keyData) {
  try {
    const user = await client.users.fetch(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const timeRemaining = getTimeRemaining(keyData.expiresAt);
    
    const embed = new EmbedBuilder()
      .setTitle('⚠️ **Key Expiry Warning**')
      .setColor('#FF9800')
      .setDescription(`**Your premium key will expire soon!**`)
      .addFields(
        { name: '🔑 **Key**', value: `\`${keyData.key}\``, inline: true },
        { name: '🎯 **Model**', value: keyData.model, inline: true },
        { name: '⏰ **Time Remaining**', value: timeRemaining, inline: true },
        { name: '📅 **Expires**', value: keyData.expiresAt.toDate().toLocaleDateString(), inline: true }
      )
      .addFields({
        name: '🔄 **Renew Your Access**',
        value: '**To continue enjoying premium features:**\n• Purchase a new subscription\n• Contact an admin for renewal\n• Create a support ticket for assistance\n\n**Don\'t lose access to your premium features!**',
        inline: false
      })
      .setTimestamp();

    embed.setFooter({
      text: 'Need help? Create a support ticket or contact an admin!',
      iconURL: client.user.displayAvatarURL()
    });

    await user.send({ embeds: [embed] });
    
    return true;
  } catch (error) {
    console.error('Error sending key expiry warning:', error);
    return false;
  }
}

export async function sendKeyExpiredNotification(client, userId, keyData) {
  try {
    const user = await client.users.fetch(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const embed = new EmbedBuilder()
      .setTitle('⏰ **Key Expired**')
      .setColor('#F44336')
      .setDescription(`**Your premium key has expired.**`)
      .addFields(
        { name: '🔑 **Key**', value: `\`${keyData.key}\``, inline: true },
        { name: '🎯 **Model**', value: keyData.model, inline: true },
        { name: '📅 **Expired**', value: keyData.expiresAt.toDate().toLocaleDateString(), inline: true }
      )
      .addFields({
        name: '🔄 **Renew Your Access**',
        value: '**To restore premium access:**\n• Purchase a new subscription\n• Contact an admin for renewal\n• Create a support ticket for assistance\n\n**We\'d love to have you back!**',
        inline: false
      })
      .setTimestamp();

    embed.setFooter({
      text: 'Need help? Create a support ticket or contact an admin!',
      iconURL: client.user.displayAvatarURL()
    });

    await user.send({ embeds: [embed] });
    
    return true;
  } catch (error) {
    console.error('Error sending key expired notification:', error);
    return false;
  }
}

export async function sendKeyDeliveryNotification(client, channelId, userId, keyData, reason = 'Purchase') {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    const user = await client.users.fetch(userId);
    const username = user ? user.username : 'Unknown User';

    const embed = new EmbedBuilder()
      .setTitle('🔑 **Key Delivered**')
      .setColor('#4CAF50')
      .setDescription(`**Key successfully delivered to <@${userId}>**`)
      .addFields(
        { name: '👤 **User**', value: username, inline: true },
        { name: '🎯 **Model**', value: keyData.model, inline: true },
        { name: '⏰ **Duration**', value: formatDuration(keyData.duration), inline: true },
        { name: '📋 **Reason**', value: reason, inline: true }
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    
    return true;
  } catch (error) {
    console.error('Error sending key delivery notification:', error);
    return false;
  }
}

function getModelInstructions(model) {
  const instructions = {
    'premium_tweak': '**1.** Use `/redeem <key>` command\n**2.** Enter your key: `' + 'KEY-XXXX-XXXX-XXXX' + '`\n**3.** Download the app from our official source\n**4.** Log in with your Discord account\n**5.** Premium features are now unlocked!',
    'premium_bot': '**1.** Use `/redeem <key>` command\n**2.** Enter your key: `' + 'KEY-XXXX-XXXX-XXXX' + '`\n**3.** Your server now has access to premium bot features\n**4.** Contact an admin to set up premium commands',
    'premium_api': '**1.** Use `/redeem <key>` command\n**2.** Enter your key: `' + 'KEY-XXXX-XXXX-XXXX' + '`\n**3.** You now have access to premium API endpoints\n**4.** Check your DMs for API credentials'
  };

  return instructions[model] || '**1.** Use `/redeem <key>` command\n**2.** Enter your key\n**3.** Follow the instructions provided\n**4.** Contact support if you need help';
}

// Utility function to check for expiring keys and send warnings
export async function checkExpiringKeys(client) {
  try {
    // This would typically be called by a scheduled task
    // For now, it's a utility function that can be called manually
    
    const allModels = ['premium_tweak', 'premium_bot', 'premium_api'];
    const now = new Date();
    const warningThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    for (const model of allModels) {
      const activeKeys = await getActiveKeysByModel(model);
      
      for (const key of activeKeys) {
        if (key.expiresAt) {
          const expiryDate = key.expiresAt.toDate();
          const timeUntilExpiry = expiryDate - now;
          
          // Send warning if key expires within 7 days
          if (timeUntilExpiry > 0 && timeUntilExpiry <= warningThreshold) {
            await sendKeyExpiryWarning(client, key.redeemedBy, key);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking expiring keys:', error);
  }
} 