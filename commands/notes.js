import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

const notesStore = new Map(); // userId -> [{id, note, moderatorId, timestamp}]
let noteCounter = 1;

export const data = new SlashCommandBuilder()
  .setName('notes')
  .setDescription('User notes system')
  .addSubcommand(sub =>
    sub.setName('add').setDescription('Add a new note to a member').addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)).addStringOption(opt => opt.setName('note').setDescription('Note').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('modify').setDescription('Edit the note of a certain user').addIntegerOption(opt => opt.setName('note_id').setDescription('Note ID').setRequired(true)).addStringOption(opt => opt.setName('note').setDescription('New note').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('remove').setDescription('Remove a certain note from a user').addIntegerOption(opt => opt.setName('note_id').setDescription('Note ID').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('sweep').setDescription('Deletes all notes of a specific user').addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('view').setDescription('View all notes or specific filtered notes').addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
  );

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return await interaction.reply({ content: '❌ You need Moderate Members permission.', ephemeral: true });
  }
  const sub = interaction.options.getSubcommand();
  if (sub === 'add') {
    const user = interaction.options.getUser('user');
    const note = interaction.options.getString('note');
    const arr = notesStore.get(user.id) || [];
    arr.push({ id: noteCounter, note, moderatorId: interaction.user.id, timestamp: Date.now() });
    notesStore.set(user.id, arr);
    await interaction.reply({ content: `Note #${noteCounter++} added for ${user.tag}.`, ephemeral: true });
  } else if (sub === 'modify') {
    const noteId = interaction.options.getInteger('note_id');
    const newNote = interaction.options.getString('note');
    let found = false;
    for (const arr of notesStore.values()) {
      for (const n of arr) {
        if (n.id === noteId) {
          n.note = newNote;
          found = true;
        }
      }
    }
    if (found) {
      await interaction.reply({ content: `Note #${noteId} updated.`, ephemeral: true });
    } else {
      await interaction.reply({ content: 'Note not found.', ephemeral: true });
    }
  } else if (sub === 'remove') {
    const noteId = interaction.options.getInteger('note_id');
    let found = false;
    for (const [userId, arr] of notesStore.entries()) {
      const idx = arr.findIndex(n => n.id === noteId);
      if (idx !== -1) {
        arr.splice(idx, 1);
        notesStore.set(userId, arr);
        found = true;
      }
    }
    if (found) {
      await interaction.reply({ content: `Note #${noteId} removed.`, ephemeral: true });
    } else {
      await interaction.reply({ content: 'Note not found.', ephemeral: true });
    }
  } else if (sub === 'sweep') {
    const user = interaction.options.getUser('user');
    notesStore.delete(user.id);
    await interaction.reply({ content: `All notes for ${user.tag} deleted.`, ephemeral: true });
  } else if (sub === 'view') {
    const user = interaction.options.getUser('user');
    const arr = notesStore.get(user.id) || [];
    if (arr.length === 0) return await interaction.reply({ content: 'No notes found for this user.', ephemeral: true });
    const embed = new EmbedBuilder()
      .setTitle(`Notes for ${user.tag}`)
      .setDescription(arr.map(n => `#${n.id}: ${n.note} (by <@${n.moderatorId}>, <t:${Math.floor(n.timestamp/1000)}:R>)`).join('\n'))
      .setColor('Yellow');
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
} 