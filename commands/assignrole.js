import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { ALLOWED_ROLES, OVERRIDE_ROLES, CHANNEL_IDS } from '../config.js';

export const data = new SlashCommandBuilder()
  .setName('assignrole')
  .setDescription('Assign the purchased role to a user')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('The user to assign the role to')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('reason')
      .setDescription('Reason for assigning the role')
      .setRequired(false));

// Helper function to log role assignments to the review activity channel
async function logRoleAssignment(interaction, targetUser, purchasedRole, reason) {
  const logChannelId = CHANNEL_IDS.reviews;
  try {
    const logChannel = await interaction.guild.channels.fetch(logChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('🎯 **Role Assignment: Purchased Role**')
        .setColor('#4CAF50')
        .setDescription(`**Role assigned to user for review access**`)
        .addFields(
          { name: '👤 **User Assigned**', value: `<@${targetUser.id}> (${targetUser.username})`, inline: true },
          { name: '🎯 **Role**', value: purchasedRole.name, inline: true },
          { name: '👮 **Assigned By**', value: `<@${interaction.user.id}> (${interaction.user.username})`, inline: true },
          { name: '📋 **Reason**', value: reason || 'No reason provided', inline: false },
          { name: '📅 **Timestamp**', value: new Date().toLocaleString(), inline: true }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    }
  } catch (error) {
    console.log('Could not log role assignment to channel:', error.message);
  }
}

export async function execute(interaction, client) {
  try {
    // Check permissions
    const member = interaction.member;
    const hasPermission = member.roles.cache.some(role => 
      ALLOWED_ROLES.includes(role.id) || OVERRIDE_ROLES.includes(role.id)
    );

    if (!hasPermission) {
      return await interaction.reply({
        content: '❌ **You do not have permission to assign roles.**',
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Purchase verified';
    const purchasedRoleId = '1382076356170354688';

    await interaction.deferReply();

    try {
      const targetMember = await interaction.guild.members.fetch(targetUser.id);
      const purchasedRole = interaction.guild.roles.cache.get(purchasedRoleId);

      if (!purchasedRole) {
        return await interaction.editReply({
          content: '❌ **Purchased role not found. Please check the role ID.**'
        });
      }

      // Check if user already has the role
      if (targetMember.roles.cache.has(purchasedRoleId)) {
        const embed = new EmbedBuilder()
          .setTitle('ℹ️ **Role Already Assigned**')
          .setColor('#FF9800')
          .setDescription(`**${targetUser.username} already has the purchased role.**`)
          .addFields(
            { name: '👤 **User**', value: `<@${targetUser.id}>`, inline: true },
            { name: '🎯 **Role**', value: purchasedRole.name, inline: true },
            { name: '📋 **Reason**', value: reason, inline: false }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Assign the role
      await targetMember.roles.add(purchasedRoleId, reason);

      const embed = new EmbedBuilder()
        .setTitle('✅ **Role Assigned Successfully**')
        .setColor('#4CAF50')
        .setDescription(`**Purchased role has been assigned to ${targetUser.username}!**`)
        .addFields(
          { name: '👤 **User**', value: `<@${targetUser.id}>`, inline: true },
          { name: '🎯 **Role**', value: purchasedRole.name, inline: true },
          { name: '👮 **Assigned By**', value: `<@${interaction.user.id}>`, inline: true },
          { name: '📋 **Reason**', value: reason, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Log the role assignment
      await logRoleAssignment(interaction, targetUser, purchasedRole, reason);

      // Send DM to user
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('🎉 **Purchase Verified!**')
          .setColor('#4CAF50')
          .setDescription(`**Your purchase has been verified and you now have access to exclusive features!**`)
          .addFields(
            { name: '🎯 **Role Assigned**', value: purchasedRole.name, inline: true },
            { name: '👮 **Verified By**', value: interaction.user.username, inline: true },
            { name: '📋 **Reason**', value: reason, inline: false }
          )
          .addFields({
            name: '🔑 **New Features Unlocked**',
            value: '• **Write Reviews** - Use `/review make` to leave reviews\n• **Premium Access** - Access to premium features\n• **Exclusive Content** - Special channels and content\n\n**Thank you for your purchase!**',
            inline: false
          })
          .setTimestamp();

        await targetUser.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.log('Could not send DM to user (DMs might be disabled)');
      }

    } catch (error) {
      console.error('Error assigning role:', error);
      await interaction.editReply({
        content: '❌ **Failed to assign role. Please check permissions and try again.**'
      });
    }

  } catch (error) {
    console.error('Error in assignrole command:', error);
    await interaction.editReply({
      content: '❌ **An error occurred while processing your request.**'
    });
  }
} 