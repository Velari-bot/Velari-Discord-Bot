import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('embed')
  .setDescription('Save or load embed templates (memory only)')
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

// In-memory store for templates (will be lost on restart)
const templates = new Map();

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
    templates.set(`${userId}_${name}`, embedData);
    await interaction.reply({ content: `Template '${name}' saved! (Note: This will be lost when the bot restarts)`, ephemeral: true });
  } else if (sub === 'load') {
    const data = templates.get(`${userId}_${name}`);
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