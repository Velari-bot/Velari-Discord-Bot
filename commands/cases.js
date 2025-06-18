import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

const casesStore = new Map(); // caseId -> caseObj
let caseCounter = 1;

export const data = new SlashCommandBuilder()
  .setName('cases')
  .setDescription('Moderation case management')
  .addSubcommand(sub =>
    sub.setName('modify')
      .setDescription('Modify a moderation case')
      .addIntegerOption(opt => opt.setName('case_id').setDescription('Case ID').setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('New reason').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('view')
      .setDescription('View moderation cases')
      .addUserOption(opt => opt.setName('user').setDescription('User to view cases for').setRequired(false))
      .addIntegerOption(opt => opt.setName('case_id').setDescription('Case ID').setRequired(false))
  );

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return await interaction.reply({ content: '❌ You need Moderate Members permission.', ephemeral: true });
  }
  const sub = interaction.options.getSubcommand();
  if (sub === 'modify') {
    const caseId = interaction.options.getInteger('case_id');
    const newReason = interaction.options.getString('reason');
    const modCase = casesStore.get(caseId);
    if (!modCase) {
      return await interaction.reply({ content: 'Case not found.', ephemeral: true });
    }
    modCase.reason = newReason;
    await interaction.reply({ content: `Case #${caseId} reason updated.`, ephemeral: true });
  } else if (sub === 'view') {
    const user = interaction.options.getUser('user');
    const caseId = interaction.options.getInteger('case_id');
    if (caseId) {
      const modCase = casesStore.get(caseId);
      if (!modCase) return await interaction.reply({ content: 'Case not found.', ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle(`Case #${caseId}`)
        .addFields(
          { name: 'User', value: `<@${modCase.userId}>`, inline: true },
          { name: 'Action', value: modCase.action, inline: true },
          { name: 'Reason', value: modCase.reason, inline: false },
          { name: 'Moderator', value: `<@${modCase.moderatorId}>`, inline: true },
          { name: 'Timestamp', value: `<t:${Math.floor(modCase.timestamp/1000)}:R>`, inline: true }
        )
        .setColor('Blue');
      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    // List all cases for a user or all cases
    let casesArr = Array.from(casesStore.values());
    if (user) casesArr = casesArr.filter(c => c.userId === user.id);
    if (casesArr.length === 0) return await interaction.reply({ content: 'No cases found.', ephemeral: true });
    const embed = new EmbedBuilder()
      .setTitle('Moderation Cases')
      .setDescription(casesArr.map(c => `#${c.id}: <@${c.userId}> - ${c.action} - ${c.reason}`).join('\n'))
      .setColor('Blue');
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

// Helper to add a case (to be used by other commands)
export function addCase({ userId, action, reason, moderatorId }) {
  const id = caseCounter++;
  casesStore.set(id, { id, userId, action, reason, moderatorId, timestamp: Date.now() });
  return id;
} 