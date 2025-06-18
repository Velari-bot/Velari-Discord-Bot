import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

const quarantineStore = new Map(); // userId -> [roleIds]

export const data = new SlashCommandBuilder()
  .setName('quarantine')
  .setDescription('Quarantine system')
  .addSubcommand(sub =>
    sub.setName('add')
      .setDescription('Add a member to quarantine')
      .addUserOption(opt => opt.setName('user').setDescription('User to quarantine').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('remove')
      .setDescription('Remove a member from quarantine and restore their roles')
      .addUserOption(opt => opt.setName('user').setDescription('User to unquarantine').setRequired(true))
  );

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return await interaction.reply({ content: '❌ You need Moderate Members permission.', ephemeral: true });
  }
  const sub = interaction.options.getSubcommand();
  const user = interaction.options.getUser('user');
  const member = await interaction.guild.members.fetch(user.id);
  let quarantineRole = interaction.guild.roles.cache.find(r => r.name === 'Quarantined');
  if (!quarantineRole) {
    quarantineRole = await interaction.guild.roles.create({ name: 'Quarantined', color: 'DARK_GREY', permissions: [] });
  }
  if (sub === 'add') {
    if (member.roles.cache.has(quarantineRole.id)) {
      return await interaction.reply({ content: 'User is already quarantined.', ephemeral: true });
    }
    const prevRoles = member.roles.cache.filter(r => r.id !== interaction.guild.id && r.id !== quarantineRole.id).map(r => r.id);
    quarantineStore.set(member.id, prevRoles);
    await member.roles.set([quarantineRole.id]);
    await interaction.reply({ embeds: [new EmbedBuilder().setTitle('🚨 Quarantined').setDescription(`${user.tag} has been quarantined.`).setColor('Red')], ephemeral: true });
  } else if (sub === 'remove') {
    if (!member.roles.cache.has(quarantineRole.id)) {
      return await interaction.reply({ content: 'User is not quarantined.', ephemeral: true });
    }
    const prevRoles = quarantineStore.get(member.id);
    if (prevRoles && prevRoles.length > 0) {
      await member.roles.set(prevRoles);
      quarantineStore.delete(member.id);
      await interaction.reply({ embeds: [new EmbedBuilder().setTitle('✅ Unquarantined').setDescription(`${user.tag} has been restored to their previous roles.`).setColor('Green')], ephemeral: true });
    } else {
      await member.roles.remove(quarantineRole.id);
      await interaction.reply({ content: 'No previous roles found. Only removed quarantine role.', ephemeral: true });
    }
  }
} 