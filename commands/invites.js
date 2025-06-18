import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('invites')
  .setDescription('See how many people a user has invited to the server')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('The user to check invites for')
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser('user');
  const guild = interaction.guild;

  await interaction.deferReply();

  try {
    // Fetch all invites for the guild
    const invites = await guild.invites.fetch();
    // Filter invites created by the selected user
    const userInvites = invites.filter(invite => invite.inviter && invite.inviter.id === user.id);
    // Count total uses
    const totalUses = userInvites.reduce((acc, invite) => acc + (invite.uses || 0), 0);

    const embed = new EmbedBuilder()
      .setTitle('📨 Invite Stats')
      .setColor('#2196F3')
      .setDescription(`**${user.tag}** has invited **${totalUses}** member(s) to the server!`)
      .addFields(
        { name: 'Total Invites Created', value: `${userInvites.size}`, inline: true },
        { name: 'Total Uses', value: `${totalUses}`, inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error fetching invites:', error);
    await interaction.editReply({ content: '❌ Could not fetch invite data. Make sure I have the "Manage Server" permission.' });
  }
} 
