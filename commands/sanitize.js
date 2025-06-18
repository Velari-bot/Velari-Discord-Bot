import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('sanitize')
  .setDescription('Simplify a member\'s nickname, remove weird/cancerous symbols and dehoist')
  .addUserOption(option =>
    option.setName('user').setDescription('User to sanitize').setRequired(true)
  );

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return await interaction.reply({
      content: '❌ You need the Moderate Members permission to use this command.',
      ephemeral: true
    });
  }
  const user = interaction.options.getUser('user');
  const member = await interaction.guild.members.fetch(user.id);
  if (!member.manageable) {
    return await interaction.reply({
      content: '❌ I cannot change this user\'s nickname.',
      ephemeral: true
    });
  }
  // Sanitize nickname: remove non-alphanumeric, dehoist, fallback to username
  let newNick = member.displayName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/^[^a-zA-Z0-9]+/, '').trim();
  if (!newNick) newNick = member.user.username;
  try {
    await member.setNickname(newNick);
    const embed = new EmbedBuilder()
      .setTitle('🧼 Nickname Sanitized')
      .setDescription(`**${user.tag}**'s nickname was changed to **${newNick}**`)
      .setColor(0x43B581)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  } catch (err) {
    await interaction.reply({
      content: '❌ Failed to change nickname. Do I have permission?',
      ephemeral: true
    });
  }
} 