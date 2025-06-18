import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('lock')
  .setDescription('Lockdown system')
  .addSubcommand(sub =>
    sub.setName('add_channel').setDescription('Lock a specific channel down').addChannelOption(opt => opt.setName('channel').setDescription('Channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
  )
  .addSubcommand(sub =>
    sub.setName('add_channels').setDescription('Lock all PUBLIC channels down')
  )
  .addSubcommand(sub =>
    sub.setName('add_joins').setDescription('Kick/Ban new members joining (stub)')
  )
  .addSubcommand(sub =>
    sub.setName('add_roles').setDescription('Lock sensitive/dangerous roles down (stub)')
  )
  .addSubcommand(sub =>
    sub.setName('remove_channel').setDescription('Lift a lock from a channel').addChannelOption(opt => opt.setName('channel').setDescription('Channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
  )
  .addSubcommand(sub =>
    sub.setName('remove_channels').setDescription('Unlock all PUBLIC channels')
  )
  .addSubcommand(sub =>
    sub.setName('remove_joins').setDescription('Stop kicking/banning new members (stub)')
  )
  .addSubcommand(sub =>
    sub.setName('remove_roles').setDescription('Unlock sensitive/dangerous roles (stub)')
  )
  .addSubcommand(sub =>
    sub.setName('update').setDescription('Add a new announcement to the temp announcements channel (stub)')
  )
  .addSubcommand(sub =>
    sub.setName('view').setDescription('Check the current ongoing lockdown modes (stub)')
  );

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return await interaction.reply({ content: '❌ You need Manage Channels permission.', ephemeral: true });
  }
  const sub = interaction.options.getSubcommand();
  if (sub === 'add_channel') {
    const channel = interaction.options.getChannel('channel');
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
    await interaction.reply({ content: `🔒 Locked ${channel.toString()}.`, ephemeral: true });
  } else if (sub === 'add_channels') {
    const channels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
    for (const channel of channels.values()) {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
    }
    await interaction.reply({ content: '🔒 All public channels locked.', ephemeral: true });
  } else if (sub === 'remove_channel') {
    const channel = interaction.options.getChannel('channel');
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
    await interaction.reply({ content: `🔓 Unlocked ${channel.toString()}.`, ephemeral: true });
  } else if (sub === 'remove_channels') {
    const channels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
    for (const channel of channels.values()) {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
    }
    await interaction.reply({ content: '🔓 All public channels unlocked.', ephemeral: true });
  } else if (sub === 'add_joins') {
    await interaction.reply({ content: '🚧 New member joins will be kicked/banned (stub).', ephemeral: true });
  } else if (sub === 'add_roles') {
    await interaction.reply({ content: '🚧 Sensitive roles locked (stub).', ephemeral: true });
  } else if (sub === 'remove_joins') {
    await interaction.reply({ content: '✅ Stopped kicking/banning new members (stub).', ephemeral: true });
  } else if (sub === 'remove_roles') {
    await interaction.reply({ content: '✅ Sensitive roles unlocked (stub).', ephemeral: true });
  } else if (sub === 'update') {
    await interaction.reply({ content: '📢 Announcement added to temp channel (stub).', ephemeral: true });
  } else if (sub === 'view') {
    await interaction.reply({ content: '🔍 Current lockdown modes: (stub)', ephemeral: true });
  }
} 