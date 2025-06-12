import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('portfolio')
  .setDescription('Showcase the Velari bot, apps, websites, and GFX portfolio');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🎨 Velari Portfolio')
    .setColor('#5865F2')
    .setDescription('Explore our apps, websites, and GFX work!')
    .addFields(
      { name: '🌐 Websites', value: '[RouteLag](https://www.routelag.com/)\n[Zylo Tweaks](https://zylo-tweaks-web.vercel.app/)', inline: false },
      { name: '🖥️ Apps', value: 'RouteLag App\nTweak App\n(see images below)', inline: false },
      { name: '🎨 GFX Portfolio', value: '[Google Drive GFX Folder](https://drive.google.com/drive/folders/1KhzOZuxxE-QdZBDo00-lz4lYmJkOxXxd?usp=drive_link)', inline: false },
      { name: '🤖 Velari Bot', value: 'All-in-one Discord bot for community management, support, and automation. Includes premium key system, reviews, welcome banners, tickets, moderation, and more.', inline: false }
    )
    .setImage('attachment://Routelag APp.png')
    .setThumbnail('attachment://Tweak App.png')
    .setFooter({ text: 'Velari • Bot, Apps, GFX & More' })
    .setTimestamp();

  await interaction.reply({
    embeds: [embed],
    files: [
      { attachment: './Routelag APp.png', name: 'Routelag APp.png' },
      { attachment: './Tweak App.png', name: 'Tweak App.png' }
    ],
    ephemeral: false
  });
} 