import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('cat')
  .setDescription('Fetches a random cat image.');

export async function execute(interaction) {
  try {
    const res = await fetch('https://api.thecatapi.com/v1/images/search');
    const data = await res.json();
    const imageUrl = data[0]?.url;
    if (!imageUrl) throw new Error('No cat image found.');
    const embed = new EmbedBuilder()
      .setTitle('🐱 Random Cat')
      .setImage(imageUrl)
      .setColor(0xFFC0CB);
    await interaction.reply({ embeds: [embed] });
  } catch (err) {
    await interaction.reply({ content: 'Failed to fetch a cat image.', ephemeral: true });
  }
} 