import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

const memeRateLimit = new Map(); // userId -> [timestamps]
const MAX_MEMES_PER_SEC = 5;
const WINDOW_MS = 1000;

export const data = new SlashCommandBuilder()
  .setName('meme')
  .setDescription('Fetches a random meme from Reddit.');

export async function execute(interaction) {
  const now = Date.now();
  const userId = interaction.user.id;
  const timestamps = memeRateLimit.get(userId) || [];
  // Remove timestamps older than 1 second
  const recent = timestamps.filter(ts => now - ts < WINDOW_MS);
  if (recent.length >= MAX_MEMES_PER_SEC) {
    await interaction.reply({ content: '⏳ You are using /meme too fast! Please wait a second.', ephemeral: true });
    return;
  }
  recent.push(now);
  memeRateLimit.set(userId, recent);

  await interaction.deferReply();
  try {
    const res = await fetch('https://www.reddit.com/r/memes/random/.json');
    const json = await res.json();
    const post = json[0]?.data?.children[0]?.data;
    if (!post || !post.url) throw new Error('No meme found');
    const embed = new EmbedBuilder()
      .setTitle(post.title || 'Random Meme')
      .setImage(post.url)
      .setURL('https://reddit.com' + post.permalink)
      .setFooter({ text: `👍 ${post.ups} | 💬 ${post.num_comments}` })
      .setColor(0x00BFFF);
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await interaction.editReply({ content: 'Failed to fetch a meme.' });
  }
} 