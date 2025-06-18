import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('credits')
  .setDescription('Shows credit information for the bot.');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🤖 Bot Credits')
    .setDescription('Developed by Wrench GFX (BBYT) and powered by Solace. Special thanks to all contributors and open source projects!')
    .setColor(0x5865F2)
    .setFooter({ text: 'Lunary Services' })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
} 
