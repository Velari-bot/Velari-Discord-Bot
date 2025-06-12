import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { permabannedIds } from '../utils/permaban.js';

export const data = new SlashCommandBuilder()
  .setName('unpermaban')
  .setDescription('Remove a user from the permaban list')
  .addUserOption(option => option.setName('user').setDescription('User to unpermaban').setRequired(true));

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
    return interaction.reply({ content: '❌ You need Ban Members permission.', flags: 64 });
  }
  const user = interaction.options.getUser('user');
  permabannedIds.delete(user.id);
  await interaction.reply({ content: `✅ <@${user.id}> removed from permaban list.`, flags: 64 });
} 