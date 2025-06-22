import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { getAllKeys, getActiveKeysByModel, getKeyStats } from '../firebase/keys.js';
import { hasAdminPermission, hasStaffPermission, isServerConfigured } from '../utils/serverRoles.js';
import { getTimeRemaining, formatDuration } from '../utils/keyGenerator.js';

export const data = new SlashCommandBuilder()
  .setName('keydashboard')
  .setDescription('View comprehensive key dashboard with Excel-like functionality')
  .addStringOption(option =>
    option.setName('filter')
      .setDescription('Filter keys by status')
      .setRequired(false)
      .addChoices(
        { name: 'All Keys', value: 'all' },
        { name: 'Active Only', value: 'active' },
        { name: 'Redeemed Only', value: 'redeemed' },
        { name: 'Expired Only', value: 'expired' }
      ))
  .addStringOption(option =>
    option.setName('model')
      .setDescription('Filter by specific model')
      .setRequired(false)
      .addChoices(
        { name: 'All Models', value: 'all' },
        { name: 'Premium Tweak App', value: 'premium_tweak' },
        { name: 'Premium Discord Bot', value: 'premium_bot' },
        { name: 'Premium API Access', value: 'premium_api' }
      ))
  .addStringOption(option =>
    option.setName('sort')
      .setDescription('Sort order')
      .setRequired(false)
      .addChoices(
        { name: 'Newest First', value: 'newest' },
        { name: 'Oldest First', value: 'oldest' },
        { name: 'Model A-Z', value: 'model_asc' },
        { name: 'Model Z-A', value: 'model_desc' },
        { name: 'Status', value: 'status' }
      ));

export async function execute(interaction, client) {
  try {
    // Check if server is configured
    const configured = await isServerConfigured(interaction.guild.id);
    
    if (!configured) {
      return await interaction.reply({
        content: '❌ **This server has not been configured yet. Please use `/setup` to configure the bot first.**',
        ephemeral: true
      });
    }

    // Check permissions using new system
    const hasPermission = await hasAdminPermission(interaction.member) || 
                         await hasStaffPermission(interaction.member);

    if (!hasPermission) {
      return await interaction.reply({
        content: '❌ **You do not have permission to access the key dashboard.**',
        ephemeral: true
      });
    }

    await handleDashboard(interaction);
  } catch (error) {
    console.error('Error in keydashboard command:', error);
    await interaction.reply({
      content: '❌ **An error occurred while processing your request.**',
      ephemeral: true
    });
  }
}

function createDashboardEmbed(keys, stats, filter, modelFilter, sort) {
  const embed = new EmbedBuilder()
    .setTitle('📊 **Key Management Dashboard**')
    .setColor('#9C27B0')
    .setDescription(`**Comprehensive overview of key management system**`)
    .setTimestamp();

  // Add statistics
  embed.addFields(
    { name: '📈 **Overall Statistics**', value: 
      `**Total Keys:** ${stats.total}\n` +
      `**Active Keys:** ${stats.active}\n` +
      `**Redeemed Keys:** ${stats.redeemed}\n` +
      `**Expired Keys:** ${stats.expired}`, inline: true },
    { name: '🎯 **Current Filter**', value: 
      `**Status:** ${filter}\n` +
      `**Model:** ${modelFilter}\n` +
      `**Sort:** ${sort}\n` +
      `**Showing:** ${keys.length} keys`, inline: true }
  );

  // Add model breakdown
  const modelBreakdown = Object.entries(stats.byModel).map(([model, modelStats]) => 
    `**${model}:** ${modelStats.total} total (${modelStats.active} active, ${modelStats.redeemed} redeemed)`
  ).join('\n');

  if (modelBreakdown) {
    embed.addFields({
      name: '📊 **Model Breakdown**',
      value: modelBreakdown,
      inline: false
    });
  }

  // Add recent keys table (Excel-like format)
  if (keys.length > 0) {
    const recentKeys = keys.slice(0, 10);
    const tableRows = recentKeys.map((key, index) => {
      const status = key.isActive ? '✅ Active' : '🔒 Redeemed';
      const timeRemaining = getTimeRemaining(key.expiresAt);
      const redeemedBy = key.redeemedBy ? `<@${key.redeemedBy}>` : 'N/A';
      const redeemedDate = key.redeemedAt ? key.redeemedAt.toDate().toLocaleDateString() : 'N/A';
      
      return `${index + 1}. \`${key.key}\` | ${key.model} | ${status} | ${timeRemaining} | ${redeemedBy} | ${redeemedDate}`;
    });

    embed.addFields({
      name: `📋 **Recent Keys** (${recentKeys.length}/${keys.length})`,
      value: tableRows.join('\n'),
      inline: false
    });

    if (keys.length > 10) {
      embed.addFields({
        name: '📝 **Note**',
        value: `*Showing first 10 keys. Use filters to view specific keys.*`,
        inline: false
      });
    }
  } else {
    embed.addFields({
      name: '📋 **No Keys Found**',
      value: 'No keys match the current filter criteria.',
      inline: false
    });
  }

  return embed;
}

function sortKeys(keys, sort) {
  switch (sort) {
    case 'newest':
      return keys.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
    case 'oldest':
      return keys.sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate());
    case 'model_asc':
      return keys.sort((a, b) => a.model.localeCompare(b.model));
    case 'model_desc':
      return keys.sort((a, b) => b.model.localeCompare(a.model));
    case 'status':
      return keys.sort((a, b) => {
        if (a.isActive === b.isActive) return 0;
        return a.isActive ? -1 : 1;
      });
    default:
      return keys;
  }
}

// Handle button interactions for dashboard
export async function handleDashboardButton(interaction, client) {
  const { customId } = interaction;

  if (customId === 'dashboard_export_csv') {
    await handleExportCSV(interaction);
  } else if (customId === 'dashboard_generate_keys') {
    await handleGenerateKeys(interaction);
  } else if (customId === 'dashboard_refresh') {
    await execute(interaction, client);
  }
}

// Handle select menu interactions for dashboard
export async function handleDashboardSelect(interaction, client) {
  const { customId, values } = interaction;

  if (customId === 'dashboard_filter' || customId === 'dashboard_model') {
    // Re-execute with new filter
    await execute(interaction, client);
  }
}

async function handleExportCSV(interaction) {
  try {
    const keys = await getAllKeys();
    
    // Create CSV content
    const csvHeader = 'Key,Model,Duration,Status,Time Remaining,Redeemed By,Redeemed Date,Created Date\n';
    const csvRows = keys.map(key => {
      const status = key.isActive ? 'Active' : 'Redeemed';
      const timeRemaining = getTimeRemaining(key.expiresAt);
      const redeemedBy = key.redeemedByUsername || 'N/A';
      const redeemedDate = key.redeemedAt ? key.redeemedAt.toDate().toLocaleDateString() : 'N/A';
      const createdDate = key.createdAt.toDate().toLocaleDateString();
      
      return `"${key.key}","${key.model}","${key.duration}","${status}","${timeRemaining}","${redeemedBy}","${redeemedDate}","${createdDate}"`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;
    
    // Create file attachment (in a real implementation, you'd save this to a file)
    const embed = new EmbedBuilder()
      .setTitle('📊 **CSV Export Ready**')
      .setColor('#4CAF50')
      .setDescription(`**CSV export contains ${keys.length} keys**\n\n**Columns:**\n• Key\n• Model\n• Duration\n• Status\n• Time Remaining\n• Redeemed By\n• Redeemed Date\n• Created Date\n\n**Note:** In a full implementation, this would generate a downloadable CSV file.`);

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });

  } catch (error) {
    console.error('Error exporting CSV:', error);
    await interaction.reply({
      content: '❌ **Failed to export CSV data.**',
      ephemeral: true
    });
  }
}

async function handleGenerateKeys(interaction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🔑 **Generate Keys**')
      .setColor('#4CAF50')
      .setDescription('**To generate new keys, use the `/keys generate` command:**\n\n**Available options:**\n• **Model:** Premium Tweak App, Discord Bot, API Access\n• **Duration:** 1 day to lifetime\n• **Count:** 1-50 keys at once\n\n**Example:**\n`/keys generate model:premium_tweak duration:30d count:5`');

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });

  } catch (error) {
    console.error('Error handling generate keys:', error);
    await interaction.reply({
      content: '❌ **Failed to process request.**',
      ephemeral: true
    });
  }
}

async function handleDashboard(interaction) {
  const filter = interaction.options.getString('filter') || 'all';
  const modelFilter = interaction.options.getString('model') || 'all';
  const sort = interaction.options.getString('sort') || 'newest';

  await interaction.deferReply();

  try {
    // Get keys based on filters
    let keys;
    if (modelFilter === 'all') {
      keys = await getAllKeys();
    } else {
      keys = await getActiveKeysByModel(modelFilter);
    }

    // Apply status filter
    if (filter === 'active') {
      keys = keys.filter(key => key.isActive);
    } else if (filter === 'redeemed') {
      keys = keys.filter(key => !key.isActive);
    } else if (filter === 'expired') {
      keys = keys.filter(key => {
        if (!key.expiresAt) return false;
        return new Date() > key.expiresAt.toDate();
      });
    }

    // Apply sorting
    keys = sortKeys(keys, sort);

    // Get statistics
    const stats = await getKeyStats();

    // Create main dashboard embed
    const embed = createDashboardEmbed(keys, stats, filter, modelFilter, sort);

    // Create action buttons
    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('dashboard_export_csv')
          .setLabel('Export CSV')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📊'),
        new ButtonBuilder()
          .setCustomId('dashboard_generate_keys')
          .setLabel('Generate Keys')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🔑'),
        new ButtonBuilder()
          .setCustomId('dashboard_refresh')
          .setLabel('Refresh')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔄')
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('dashboard_filter')
          .setPlaceholder('Filter Keys')
          .addOptions([
            { label: 'All Keys', value: 'all', emoji: '📋' },
            { label: 'Active Only', value: 'active', emoji: '✅' },
            { label: 'Redeemed Only', value: 'redeemed', emoji: '🔒' },
            { label: 'Expired Only', value: 'expired', emoji: '⏰' }
          ]),
        new StringSelectMenuBuilder()
          .setCustomId('dashboard_model')
          .setPlaceholder('Filter by Model')
          .addOptions([
            { label: 'All Models', value: 'all', emoji: '🎯' },
            { label: 'Premium Tweak App', value: 'premium_tweak', emoji: '📱' },
            { label: 'Premium Discord Bot', value: 'premium_bot', emoji: '🤖' },
            { label: 'Premium API Access', value: 'premium_api', emoji: '🔌' }
          ])
      );

    await interaction.editReply({ 
      embeds: [embed], 
      components: [row1, row2] 
    });

  } catch (error) {
    console.error('Error loading dashboard:', error);
    await interaction.editReply({
      content: '❌ **Failed to load dashboard data.**'
    });
  }
} 
