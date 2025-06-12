import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Mutes a member in this server until unmuted.')
  .addUserOption(option => option.setName('user').setDescription('User to mute').setRequired(true))
  .addStringOption(option => option.setName('reason').setDescription('Reason for mute').setRequired(false));

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return interaction.reply({ content: '❌ You need Moderate Members permission.', flags: 64 });
  }
  const user = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const member = await interaction.guild.members.fetch(user.id);
  try {
    await member.timeout(28 * 24 * 60 * 60 * 1000, reason); // 28 days (max allowed by Discord)
    await interaction.reply({ content: `🔇 <@${user.id}> has been muted.`, flags: 64 });
  } catch (err) {
    await interaction.reply({ content: '❌ Failed to mute the user. Check my permissions and role position.', flags: 64 });
  }
} 