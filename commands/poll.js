import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

const NUMBER_EMOJIS = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

export const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Create a poll with up to 10 options.')
  .addStringOption(opt => opt.setName('question').setDescription('Poll question').setRequired(true))
  .addStringOption(opt => opt.setName('option1').setDescription('Option 1').setRequired(true))
  .addStringOption(opt => opt.setName('option2').setDescription('Option 2').setRequired(true));

for (let i = 3; i <= 10; i++) {
  data.addStringOption(opt => opt.setName(`option${i}`).setDescription(`Option ${i}`).setRequired(false));
}

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.SendMessages)) {
    return interaction.reply({ content: '❌ You need Send Messages permission.', ephemeral: true });
  }
  const question = interaction.options.getString('question');
  const options = [];
  for (let i = 1; i <= 10; i++) {
    const opt = interaction.options.getString(`option${i}`);
    if (opt) options.push(opt);
  }
  if (options.length < 2) {
    return interaction.reply({ content: '❌ You must provide at least 2 options.', ephemeral: true });
  }
  if (options.length > 10) {
    return interaction.reply({ content: '❌ You can provide up to 10 options.', ephemeral: true });
  }
  let desc = '';
  for (let i = 0; i < options.length; i++) {
    desc += `${NUMBER_EMOJIS[i]} ${options[i]}\n`;
  }
  const embed = new EmbedBuilder()
    .setTitle('📊 Poll')
    .setDescription(`**${question}**\n\n${desc}`)
    .setColor(0x5865F2)
    .setFooter({ text: `Poll by ${interaction.user.tag}` })
    .setTimestamp();
  const pollMsg = await interaction.reply({ embeds: [embed], fetchReply: true });
  for (let i = 0; i < options.length; i++) {
    await pollMsg.react(NUMBER_EMOJIS[i]);
  }
} 
