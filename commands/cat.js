import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('cat')
  .setDescription('Fetches a random cat image.');

export async function execute(interaction) {
  try {
    // Defer reply to prevent timeout
    await interaction.deferReply();
    
    const res = await fetch('https://api.thecatapi.com/v1/images/search');
    const data = await res.json();
    const imageUrl = data[0]?.url;
    
    if (!imageUrl) throw new Error('No cat image found.');
    
    const embed = new EmbedBuilder()
      .setTitle('🐱 Random Cat')
      .setImage(imageUrl)
      .setColor(0xFFC0CB);
      
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error('Error in cat command:', err);
    
    try {
      if (interaction.deferred) {
        await interaction.editReply({ content: 'Failed to fetch a cat image.', embeds: [] });
      } else if (!interaction.replied) {
        await interaction.reply({ content: 'Failed to fetch a cat image.', ephemeral: true });
      }
    } catch (replyError) {
      console.error('Error sending error message:', replyError);
    }
  }
} 
