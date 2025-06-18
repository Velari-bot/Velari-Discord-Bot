import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
  .setName('cat')
  .setDescription('Fetches a random cat image.');

export async function execute(interaction) {
  await interaction.deferReply();
  try {
    const res = await fetch('https://api.thecatapi.com/v1/images/search');
    const data = await res.json();
    const imageUrl = data[0]?.url;
    if (!imageUrl) throw new Error('No image found');
    const embed = new EmbedBuilder()
      .setTitle('🐱 Random Cat')
      .setImage(imageUrl)
      .setColor(0xFFC0CB);
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await interaction.editReply({ content: 'Failed to fetch a cat image.' });
  }
} 
