import { SlashCommandBuilder } from 'discord.js';
import { saveTemplate, loadTemplate } from '../firebase/firebase.js';

export const data = new SlashCommandBuilder()
  .setName('embed')
  .setDescription('Save or load embed templates')
  .addSubcommand(sub =>
    sub.setName('save')
      .setDescription('Save the last used embed as a template')
      .addStringOption(opt =>
        opt.setName('name').setDescription('Template name').setRequired(true)))
  .addSubcommand(sub =>
    sub.setName('load')
      .setDescription('Load a saved embed template')
      .addStringOption(opt =>
        opt.setName('name').setDescription('Template name').setRequired(true)));

// In-memory store for last used embed per user (for demo; use DB for production)
const lastEmbed = new Map();

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const name = interaction.options.getString('name');
  const userId = interaction.user.id;

  if (sub === 'save') {
    const embedData = lastEmbed.get(userId);
    if (!embedData) {
      await interaction.reply({ content: 'No embed to save. Use /embedbuilder first.', ephemeral: true });
      return;
    }
    await saveTemplate(userId, name, embedData);
    await interaction.reply({ content: `Template '${name}' saved!`, ephemeral: true });
  } else if (sub === 'load') {
    const data = await loadTemplate(userId, name);
    if (!data) {
      await interaction.reply({ content: `No template found with name '${name}'.`, ephemeral: true });
      return;
    }
    lastEmbed.set(userId, data);
    await interaction.reply({ content: `Template '${name}' loaded! Use /embedbuilder to preview/send.`, ephemeral: true });
  }
}

// Export for use in embedbuilder.js to update lastEmbed
export function setLastEmbed(userId, data) {
  lastEmbed.set(userId, data);
} 