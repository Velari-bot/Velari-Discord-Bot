import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('embed')
  .setDescription('Embed templates and helper commands')
  .addSubcommand(sub =>
    sub.setName('template')
      .setDescription('Send a predefined embed template')
      .addStringOption(opt =>
        opt.setName('type')
          .setDescription('Template type')
          .setRequired(true)
          .addChoices(
            { name: 'gfx', value: 'gfx' },
            { name: 'vfx', value: 'vfx' },
            { name: 'update', value: 'update' }
          )
      )
  )
  .addSubcommand(sub =>
    sub.setName('tips')
      .setDescription('Show embed tips and best practices')
  )
  .addSubcommand(sub =>
    sub.setName('color')
      .setDescription('Show embed color reference')
  )
  .addSubcommand(sub =>
    sub.setName('markdown')
      .setDescription('Show Discord markdown formatting guide')
  );

// In-memory store for templates (will be lost on restart)
const templates = new Map();

// In-memory store for last used embed per user (for demo; use DB for production)
const lastEmbed = new Map();

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'template') {
    const type = interaction.options.getString('type');
    let embed;
    if (type === 'gfx') {
      embed = new EmbedBuilder()
        .setTitle('🎨 GFX Services Now Available!')
        .setDescription('Need thumbnails, logos, or stream overlays? Our design team has you covered with fast delivery and premium quality.')
        .setColor(0xFF4F8B)
        .setThumbnail('https://example.com/lunary-logo.png')
        .addFields(
          { name: '🖼️ Thumbnails', value: '$25 – Fast, YouTube-optimized', inline: true },
          { name: '🔳 Logos', value: '$40+ – Custom, clean, scalable', inline: true }
        )
        .setFooter({ text: 'Lunary • Creative Studio' })
        .setTimestamp();
    } else if (type === 'vfx') {
      embed = new EmbedBuilder()
        .setTitle('🎞 VFX / Montage Edits')
        .setDescription('We edit montages, stream intros, and synced clips with SFX/VFX that pop. DM to start your order.')
        .setColor(0xFF6D00)
        .setImage('https://example.com/montage-preview.gif')
        .addFields(
          { name: '🎧 Synced VFX', value: 'Perfectly timed with audio', inline: true },
          { name: '🎮 Game Support', value: 'Fortnite, Valorant, CoD, etc.', inline: true }
        )
        .setFooter({ text: 'Lunary • Visual FX Division' })
        .setTimestamp();
    } else if (type === 'update') {
      embed = new EmbedBuilder()
        .setTitle('📢 Service Update: New Features!')
        .setDescription("We've added embed templates, field builders, and more.\nUse `/embedbuilder` to try it out now!")
        .setColor(0xFCA311)
        .addFields(
          { name: '🚀 New', value: '`/embed template` commands', inline: true },
          { name: '🔧 Improvements', value: 'UI fixes, better preview logic', inline: true }
        )
        .setFooter({ text: 'Lunary Bot Update | v1.2' })
        .setTimestamp();
    }
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (sub === 'tips') {
    const embed = new EmbedBuilder()
      .setTitle('🧠 Embed Tips & Best Practices')
      .setDescription('- Use direct image URLs ending in `.png`, `.jpg`, or `.gif`\n- Embed character limits:\n• Title: 256\n• Description: 4,096\n• Fields: 25 max, 1,024 chars each\n- Avoid too many embeds in one message')
      .setColor(0x00ADB5);
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (sub === 'color') {
    const embed = new EmbedBuilder()
      .setTitle('🎨 Embed Color Reference')
      .setDescription('Here are some hex color ideas:\n\n`#FF4F8B` - Lunary Pink\n`#FF6D00` - Bright Orange\n`#FCA311` - Warm Yellow\n`#5A189A` - Deep Purple\n`#00ADB5` - Aqua Blue\n\nUse any hex code in your embed color field!')
      .setColor(0xFF4F8B);
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (sub === 'markdown') {
    const embed = new EmbedBuilder()
      .setTitle('✍️ Discord Markdown Guide')
      .addFields(
        { name: 'Bold', value: '**text**', inline: true },
        { name: 'Italic', value: '*text*', inline: true },
        { name: 'Underline', value: '__text__', inline: true },
        { name: 'Strikethrough', value: '~~text~~', inline: true },
        { name: 'Hyperlink', value: '[text](https://example.com)', inline: true },
        { name: 'Emoji', value: 'Use `:emoji_name:` or Unicode emojis 😎' }
      )
      .setColor(0x888888);
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }
}

// Export for use in embedbuilder.js to update lastEmbed
export function setLastEmbed(userId, data) {
  lastEmbed.set(userId, data);
} 