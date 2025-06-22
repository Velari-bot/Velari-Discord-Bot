import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getServerConfig } from '../utils/serverRoles.js';

export const data = new SlashCommandBuilder()
  .setName('serverinfo')
  .setDescription('View the current server configuration and roles');

export async function execute(interaction, client) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const serverConfig = await getServerConfig(interaction.guild.id);

    if (!serverConfig || !serverConfig.isActive) {
      const embed = new EmbedBuilder()
        .setTitle('❌ **Server Not Configured**')
        .setColor('#F44336')
        .setDescription('**This server has not been configured yet.**')
        .addFields({
          name: '🔧 **Setup Required**',
          value: 'Use `/setup` to configure admin and staff roles for this server.\n\n**Required roles:**\n• Admin Role - Full access to all bot features\n• Staff Role - Access to view orders and help with support\n• Support Role (optional) - Can manage tickets',
          inline: false
        })
        .setFooter({ text: 'Only users with "Manage Server" permission can run /setup' })
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    }

    // Get role objects
    const adminRole = interaction.guild.roles.cache.get(serverConfig.adminRoleId);
    const staffRole = interaction.guild.roles.cache.get(serverConfig.staffRoleId);
    const supportRole = serverConfig.supportRoleId ? interaction.guild.roles.cache.get(serverConfig.supportRoleId) : null;

    // Check if roles still exist
    const missingRoles = [];
    if (!adminRole) missingRoles.push('Admin Role');
    if (!staffRole) missingRoles.push('Staff Role');
    if (serverConfig.supportRoleId && !supportRole) missingRoles.push('Support Role');

    const embed = new EmbedBuilder()
      .setTitle('⚙️ **Server Configuration**')
      .setColor('#4CAF50')
      .setDescription(`**Server:** ${interaction.guild.name}`)
      .addFields(
        { name: '👑 **Admin Role**', value: adminRole ? `${adminRole} (${adminRole.name})` : '❌ **Role not found**', inline: true },
        { name: '👥 **Staff Role**', value: staffRole ? `${staffRole} (${staffRole.name})` : '❌ **Role not found**', inline: true },
        { name: '🎫 **Support Role**', value: supportRole ? `${supportRole} (${supportRole.name})` : 'Not configured', inline: true },
        { name: '👮 **Setup By**', value: `<@${serverConfig.setupBy}> (${serverConfig.setupByUsername})`, inline: true },
        { name: '📅 **Setup Date**', value: serverConfig.setupAt.toDate().toLocaleString(), inline: true },
        { name: '✅ **Status**', value: serverConfig.isActive ? 'Active' : 'Inactive', inline: true }
      )
      .setFooter({ text: 'Use /setup to reconfigure roles' })
      .setTimestamp();

    if (missingRoles.length > 0) {
      embed.addFields({
        name: '⚠️ **Warning**',
        value: `**Missing roles:** ${missingRoles.join(', ')}\n\nThese roles may have been deleted. Use \`/setup\` to reconfigure.`,
        inline: false
      });
      embed.setColor('#FF9800');
    }

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error in serverinfo command:', error);
    await interaction.editReply({
      content: '❌ **An error occurred while fetching server information.**'
    });
  }
} 