import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { db } from '../firebase/firebase.js';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Setup bot roles and permissions for this server')
  .addRoleOption(option =>
    option.setName('admin_role')
      .setDescription('Role that will have admin permissions (can manage orders, keys, etc.)')
      .setRequired(true))
  .addRoleOption(option =>
    option.setName('staff_role')
      .setDescription('Role that will have staff permissions (can view orders, help with support)')
      .setRequired(true))
  .addRoleOption(option =>
    option.setName('support_role')
      .setDescription('Role for support team members (can manage tickets)')
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction, client) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const adminRole = interaction.options.getRole('admin_role');
    const staffRole = interaction.options.getRole('staff_role');
    const supportRole = interaction.options.getRole('support_role');

    // Check if bot can manage these roles
    const botMember = interaction.guild.members.me;
    if (adminRole.position >= botMember.roles.highest.position) {
      return await interaction.editReply({
        content: '❌ **I cannot manage the admin role. It is higher than my highest role.**'
      });
    }

    if (staffRole.position >= botMember.roles.highest.position) {
      return await interaction.editReply({
        content: '❌ **I cannot manage the staff role. It is higher than my highest role.**'
      });
    }

    if (supportRole && supportRole.position >= botMember.roles.highest.position) {
      return await interaction.editReply({
        content: '❌ **I cannot manage the support role. It is higher than my highest role.**'
      });
    }

    // Save server configuration to Firebase
    const serverConfig = {
      guildId: interaction.guild.id,
      guildName: interaction.guild.name,
      adminRoleId: adminRole.id,
      adminRoleName: adminRole.name,
      staffRoleId: staffRole.id,
      staffRoleName: staffRole.name,
      supportRoleId: supportRole ? supportRole.id : null,
      supportRoleName: supportRole ? supportRole.name : null,
      setupBy: interaction.user.id,
      setupByUsername: interaction.user.username,
      setupAt: new Date(),
      isActive: true
    };

    try {
      await db.collection('server_configs').doc(interaction.guild.id).set(serverConfig);
    } catch (error) {
      console.error('Error saving server config:', error);
      return await interaction.editReply({
        content: '❌ **Failed to save server configuration. Please try again.**'
      });
    }

    // Create success embed
    const embed = new EmbedBuilder()
      .setTitle('✅ **Server Setup Complete**')
      .setColor('#4CAF50')
      .setDescription(`**Your server has been configured successfully!**`)
      .addFields(
        { name: '👑 **Admin Role**', value: `${adminRole} (${adminRole.name})`, inline: true },
        { name: '👥 **Staff Role**', value: `${staffRole} (${staffRole.name})`, inline: true },
        { name: '🎫 **Support Role**', value: supportRole ? `${supportRole} (${supportRole.name})` : 'Not set', inline: true },
        { name: '👮 **Setup By**', value: interaction.user.username, inline: true },
        { name: '📅 **Setup Date**', value: new Date().toLocaleString(), inline: true }
      )
      .addFields({
        name: '🔑 **What This Enables**',
        value: '• **Admin Role**: Full access to all bot features\n• **Staff Role**: Access to view orders, help with support\n• **Support Role**: Can manage tickets and provide support\n\n**The bot is now ready to use in your server!**',
        inline: false
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // Send a public message to the channel
    const publicEmbed = new EmbedBuilder()
      .setTitle('🎉 **Bot Setup Complete!**')
      .setColor('#4CAF50')
      .setDescription(`**The Velari bot has been successfully configured for this server!**\n\n**Roles have been set up and the bot is ready to use.**`)
      .addFields(
        { name: '👑 **Admin Role**', value: adminRole.name, inline: true },
        { name: '👥 **Staff Role**', value: staffRole.name, inline: true },
        { name: '🎫 **Support Role**', value: supportRole ? supportRole.name : 'Not set', inline: true }
      )
      .setFooter({ text: 'Setup by ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.channel.send({ embeds: [publicEmbed] });

  } catch (error) {
    console.error('Error in setup command:', error);
    await interaction.editReply({
      content: '❌ **An error occurred while setting up the server. Please try again.**'
    });
  }
} 