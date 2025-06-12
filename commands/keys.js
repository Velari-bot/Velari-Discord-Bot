import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } from 'discord.js';
import { ALLOWED_ROLES, OVERRIDE_ROLES } from '../config.js';
import { createKey, getAllKeys, getKeysByModel, getActiveKeysByModel, deactivateKey, reactivateKey, getKeyStats } from '../firebase/keys.js';
import { generatePremiumKey, generateStandardKey, calculateExpiryDate, formatDuration, getTimeRemaining, validateKeyFormat, formatKeyForDisplay } from '../utils/keyGenerator.js';
import nodemailer from 'nodemailer';

export const data = new SlashCommandBuilder()
  .setName('keys')
  .setDescription('Manage premium keys and subscriptions')
  .addSubcommand(subcommand =>
    subcommand
      .setName('generate')
      .setDescription('Generate new premium keys')
      .addStringOption(option =>
        option.setName('model')
          .setDescription('The model/subscription type')
          .setRequired(true)
          .addChoices(
            { name: 'Premium Tweak App', value: 'premium_tweak' },
            { name: 'Premium Discord Bot', value: 'premium_bot' },
            { name: 'Premium API Access', value: 'premium_api' },
            { name: 'Custom Model', value: 'custom' }
          ))
      .addStringOption(option =>
        option.setName('duration')
          .setDescription('Key duration')
          .setRequired(true)
          .addChoices(
            { name: '1 Day', value: '1d' },
            { name: '7 Days', value: '7d' },
            { name: '30 Days', value: '30d' },
            { name: '90 Days', value: '90d' },
            { name: '1 Year', value: '365d' },
            { name: 'Lifetime', value: 'lifetime' }
          ))
      .addStringOption(option =>
        option.setName('custom_model')
          .setDescription('Custom model name (if custom is selected)')
          .setRequired(false))
      .addIntegerOption(option =>
        option.setName('count')
          .setDescription('Number of keys to generate (1-50)')
          .setRequired(false)
          .setMinValue(1)
          .setMaxValue(50)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('view')
      .setDescription('View key status and statistics')
      .addStringOption(option =>
        option.setName('model')
          .setDescription('Filter by specific model')
          .setRequired(false)
          .addChoices(
            { name: 'All Models', value: 'all' },
            { name: 'Premium Tweak App', value: 'premium_tweak' },
            { name: 'Premium Discord Bot', value: 'premium_bot' },
            { name: 'Premium API Access', value: 'premium_api' }
          )))
  .addSubcommand(subcommand =>
    subcommand
      .setName('dashboard')
      .setDescription('View comprehensive key dashboard'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('deactivate')
      .setDescription('Deactivate a specific key')
      .addStringOption(option =>
        option.setName('key_id')
          .setDescription('The key ID to deactivate')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('reactivate')
      .setDescription('Reactivate a deactivated key')
      .addStringOption(option =>
        option.setName('key_id')
          .setDescription('The key ID to reactivate')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('custom')
      .setDescription('Create a custom key with specific details')
      .addStringOption(option =>
        option.setName('key')
          .setDescription('Custom key value')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('model')
          .setDescription('The model/subscription type')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('duration')
          .setDescription('Key duration')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('description')
          .setDescription('Additional description for the key')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('send')
      .setDescription('Generate a key, DM it to a user, and email it to them')
      .addUserOption(option =>
        option.setName('user').setDescription('User to send the key to').setRequired(true))
      .addStringOption(option =>
        option.setName('email').setDescription('Email to send the key to').setRequired(true))
      .addStringOption(option =>
        option.setName('model').setDescription('Subscription model').setRequired(true))
      .addStringOption(option =>
        option.setName('duration').setDescription('Duration (e.g. 30d, 1y)').setRequired(true)));

export async function execute(interaction, client) {
  try {
    // Check permissions
    const member = interaction.member;
    const hasPermission = member.roles.cache.some(role => 
      ALLOWED_ROLES.includes(role.id) || OVERRIDE_ROLES.includes(role.id)
    );

    if (!hasPermission) {
      return await interaction.reply({
        content: '❌ **You do not have permission to manage keys.**',
        ephemeral: true
      });
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'generate':
        await handleGenerate(interaction);
        break;
      case 'view':
        await handleView(interaction);
        break;
      case 'dashboard':
        await handleDashboard(interaction);
        break;
      case 'deactivate':
        await handleDeactivate(interaction);
        break;
      case 'reactivate':
        await handleReactivate(interaction);
        break;
      case 'custom':
        await handleCustom(interaction);
        break;
      case 'send':
        await handleSend(interaction, client);
        break;
    }
  } catch (error) {
    console.error('Error in keys command:', error);
    await interaction.reply({
      content: '❌ **An error occurred while processing your request.**',
      ephemeral: true
    });
  }
}

async function handleGenerate(interaction) {
  const model = interaction.options.getString('model');
  const customModel = interaction.options.getString('custom_model');
  const duration = interaction.options.getString('duration');
  const count = interaction.options.getInteger('count') || 1;

  const finalModel = model === 'custom' ? customModel : model;
  
  if (model === 'custom' && !customModel) {
    return await interaction.reply({
      content: '❌ **Please provide a custom model name.**',
      ephemeral: true
    });
  }

  await interaction.deferReply();

  try {
    const keys = [];
    const expiresAt = calculateExpiryDate(duration);

    for (let i = 0; i < count; i++) {
      const keyValue = generatePremiumKey(finalModel);
      const keyId = await createKey({
        key: keyValue,
        model: finalModel,
        duration: duration,
        expiresAt: expiresAt,
        createdBy: interaction.user.id,
        createdByUsername: interaction.user.username
      });
      
      keys.push({
        id: keyId,
        key: keyValue,
        model: finalModel,
        duration: duration,
        expiresAt: expiresAt
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🔑 **Keys Generated Successfully**')
      .setColor('#4CAF50')
      .setDescription(`**Generated ${count} key(s) for ${finalModel}**`)
      .addFields(
        { name: '📋 **Model**', value: finalModel, inline: true },
        { name: '⏰ **Duration**', value: formatDuration(duration), inline: true },
        { name: '📅 **Expires**', value: expiresAt ? expiresAt.toLocaleDateString() : 'Never', inline: true }
      )
      .setTimestamp();

    // Add keys to embed (limit to first 10 for display)
    const keysToShow = keys.slice(0, 10);
    const keyList = keysToShow.map(k => `\`${k.key}\``).join('\n');
    
    if (keyList) {
      embed.addFields({
        name: `🔑 **Generated Keys** (${keysToShow.length}/${keys.length})`,
        value: keyList,
        inline: false
      });
    }

    if (keys.length > 10) {
      embed.addFields({
        name: '📝 **Note**',
        value: `*Showing first 10 keys. All ${keys.length} keys have been generated and stored.*`,
        inline: false
      });
    }

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error generating keys:', error);
    await interaction.editReply({
      content: '❌ **Failed to generate keys. Please try again.**'
    });
  }
}

async function handleView(interaction) {
  const model = interaction.options.getString('model') || 'all';

  await interaction.deferReply();

  try {
    let keys;
    if (model === 'all') {
      keys = await getAllKeys();
    } else {
      keys = await getKeysByModel(model);
    }

    const activeKeys = keys.filter(k => k.isActive);
    const redeemedKeys = keys.filter(k => !k.isActive);

    const embed = new EmbedBuilder()
      .setTitle('🔑 **Key Status Overview**')
      .setColor('#2196F3')
      .addFields(
        { name: '📊 **Total Keys**', value: keys.length.toString(), inline: true },
        { name: '✅ **Active Keys**', value: activeKeys.length.toString(), inline: true },
        { name: '🔒 **Redeemed Keys**', value: redeemedKeys.length.toString(), inline: true }
      )
      .setTimestamp();

    if (model !== 'all') {
      embed.addFields({
        name: '🎯 **Model Filter**',
        value: model,
        inline: true
      });
    }

    // Show recent keys
    const recentKeys = keys.slice(0, 5);
    if (recentKeys.length > 0) {
      const recentList = recentKeys.map(k => {
        const status = k.isActive ? '✅' : '🔒';
        const timeLeft = getTimeRemaining(k.expiresAt);
        return `${status} \`${k.key}\` - ${k.model} (${timeLeft})`;
      }).join('\n');
      
      embed.addFields({
        name: '🕒 **Recent Keys**',
        value: recentList,
        inline: false
      });
    }

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error viewing keys:', error);
    await interaction.editReply({
      content: '❌ **Failed to retrieve key information.**'
    });
  }
}

async function handleDashboard(interaction) {
  await interaction.deferReply();

  try {
    const stats = await getKeyStats();
    const allKeys = await getAllKeys();

    const embed = new EmbedBuilder()
      .setTitle('📊 **Key Management Dashboard**')
      .setColor('#9C27B0')
      .setDescription('**Comprehensive overview of all key statistics**')
      .addFields(
        { name: '📈 **Overall Statistics**', value: 
          `**Total Keys:** ${stats.total}\n` +
          `**Active Keys:** ${stats.active}\n` +
          `**Redeemed Keys:** ${stats.redeemed}\n` +
          `**Expired Keys:** ${stats.expired}`, inline: false },
        { name: '🎯 **By Model**', value: 
          Object.entries(stats.byModel).map(([model, modelStats]) => 
            `**${model}:** ${modelStats.total} total (${modelStats.active} active, ${modelStats.redeemed} redeemed)`
          ).join('\n') || 'No keys found', inline: false }
      )
      .setTimestamp();

    // Create buttons for quick actions
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('keys_generate_quick')
          .setLabel('Generate Keys')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🔑'),
        new ButtonBuilder()
          .setCustomId('keys_export')
          .setLabel('Export Data')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📊'),
        new ButtonBuilder()
          .setCustomId('keys_refresh')
          .setLabel('Refresh')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🔄')
      );

    await interaction.editReply({ embeds: [embed], components: [row] });

  } catch (error) {
    console.error('Error loading dashboard:', error);
    await interaction.editReply({
      content: '❌ **Failed to load dashboard.**'
    });
  }
}

async function handleDeactivate(interaction) {
  const keyId = interaction.options.getString('key_id');

  await interaction.deferReply();

  try {
    await deactivateKey(keyId);
    
    const embed = new EmbedBuilder()
      .setTitle('🔒 **Key Deactivated**')
      .setColor('#FF9800')
      .setDescription(`**Key ID:** \`${keyId}\`\n**Status:** Deactivated`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error deactivating key:', error);
    await interaction.editReply({
      content: '❌ **Failed to deactivate key. Please check the key ID.**'
    });
  }
}

async function handleReactivate(interaction) {
  const keyId = interaction.options.getString('key_id');

  await interaction.deferReply();

  try {
    await reactivateKey(keyId);
    
    const embed = new EmbedBuilder()
      .setTitle('✅ **Key Reactivated**')
      .setColor('#4CAF50')
      .setDescription(`**Key ID:** \`${keyId}\`\n**Status:** Active`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error reactivating key:', error);
    await interaction.editReply({
      content: '❌ **Failed to reactivate key. Please check the key ID.**'
    });
  }
}

async function handleCustom(interaction) {
  const key = interaction.options.getString('key');
  const model = interaction.options.getString('model');
  const duration = interaction.options.getString('duration');
  const description = interaction.options.getString('description') || 'Custom key';

  // Validate key format
  if (!validateKeyFormat(key)) {
    return await interaction.reply({
      content: '❌ **Invalid key format. Please use format like: XXX-XXXX-XXXX-XXXX**',
      ephemeral: true
    });
  }

  await interaction.deferReply();

  try {
    const expiresAt = calculateExpiryDate(duration);
    const keyId = await createKey({
      key: formatKeyForDisplay(key),
      model: model,
      duration: duration,
      expiresAt: expiresAt,
      description: description,
      createdBy: interaction.user.id,
      createdByUsername: interaction.user.username,
      isCustom: true
    });

    const embed = new EmbedBuilder()
      .setTitle('🔑 **Custom Key Created**')
      .setColor('#4CAF50')
      .setDescription(`**Custom key has been successfully created!**`)
      .addFields(
        { name: '🔑 **Key**', value: `\`${formatKeyForDisplay(key)}\``, inline: true },
        { name: '🎯 **Model**', value: model, inline: true },
        { name: '⏰ **Duration**', value: formatDuration(duration), inline: true },
        { name: '📝 **Description**', value: description, inline: false },
        { name: '📅 **Expires**', value: expiresAt ? expiresAt.toLocaleDateString() : 'Never', inline: true },
        { name: '🆔 **Key ID**', value: keyId, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error creating custom key:', error);
    await interaction.editReply({
      content: '❌ **Failed to create custom key. Please try again.**'
    });
  }
}

async function handleSend(interaction, client) {
  const user = interaction.options.getUser('user');
  const email = interaction.options.getString('email');
  const model = interaction.options.getString('model');
  const duration = interaction.options.getString('duration');
  const admin = interaction.user;

  await interaction.deferReply({ ephemeral: true });

  // Automatically select the correct key generation function
  let key;
  if (model === 'custom') {
    // Ask for custom model name (could add as an option if needed)
    const customModel = interaction.options.getString('custom_model') || 'CUSTOM';
    key = generateKey(customModel, 20);
  } else {
    key = generatePremiumKey(model);
  }

  // DM the user with a styled embed
  try {
    const embed = new EmbedBuilder()
      .setTitle('🔑 Your Premium Key')
      .setColor('#4CAF50')
      .setDescription('Thank you for your purchase! Here is your premium access key:')
      .addFields(
        { name: 'Product', value: model, inline: true },
        { name: 'Duration', value: duration, inline: true },
        { name: 'Key', value: `\`${key}\``, inline: false }
      )
      .setFooter({ text: 'If you need help, reply to this DM or contact support.' })
      .setTimestamp();
    await user.send({ embeds: [embed] });
  } catch (err) {
    await interaction.editReply({ content: 'Could not DM the user. They may have DMs disabled.' });
  }

  // Send a beautiful HTML email
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your provider
      auth: {
        user: process.env.EMAIL_USER || 'your@email.com',
        pass: process.env.EMAIL_PASS || 'yourpassword'
      }
    });
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; box-shadow: 0 2px 8px #eee;">
        <div style="background: #4CAF50; color: #fff; padding: 24px 24px 12px 24px; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0;">🔑 Your Premium Key</h2>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 1.1em;">Thank you for your purchase from <b>Your Store</b>!</p>
          <table style="width: 100%; margin: 16px 0; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold;">Product:</td><td>${model}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Duration:</td><td>${duration}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Key:</td><td style="font-family: monospace; font-size: 1.1em; color: #4CAF50;">${key}</td></tr>
          </table>
          <p style="margin-top: 24px;">To redeem your key, follow the instructions provided in your Discord DM or contact our support team if you need help.</p>
          <p style="margin-top: 24px; font-size: 0.95em; color: #888;">If you did not make this purchase, please contact <a href='mailto:support@yourstore.com'>support@yourstore.com</a> immediately.</p>
        </div>
        <div style="background: #f5f5f5; color: #888; text-align: center; padding: 12px; border-radius: 0 0 10px 10px; font-size: 0.95em;">
          &copy; ${new Date().getFullYear()} Your Store. All rights reserved.
        </div>
      </div>
    `;
    await transporter.sendMail({
      from: 'Your Store <your@email.com>',
      to: email,
      subject: 'Your Premium Key',
      html
    });
  } catch (err) {
    await interaction.editReply({ content: 'Key sent in DM, but failed to send email.' });
    return;
  }

  await interaction.editReply({ content: `Key generated, DMed to <@${user.id}> and emailed to ${email}` });
} 