import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
  .setName('dog')
  .setDescription('Fetches a random dog image.');

export async function execute(interaction) {
  await interaction.deferReply();
  try {
    const res = await fetch('https://dog.ceo/api/breeds/image/random');
    const data = await res.json();
    const imageUrl = data.message;
    if (!imageUrl) throw new Error('No image found');
    const embed = new EmbedBuilder()
      .setTitle('🐶 Random Dog')
      .setImage(imageUrl)
      .setColor(0xFFD700);
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await interaction.editReply({ content: 'Failed to fetch a dog image.' });
  }
} 