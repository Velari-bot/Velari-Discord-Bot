import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('membercount')
  .setDescription('Shows the total number of members and how many are bots.');

export async function execute(interaction) {
  const guild = interaction.guild;
  await guild.members.fetch();
  const total = guild.memberCount;
  const bots = guild.members.cache.filter(m => m.user.bot).size;
  await interaction.reply({ content: `👥 Total Members: **${total}**\n🤖 Bots: **${bots}**` });
} 
