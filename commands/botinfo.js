import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('botinfo')
  .setDescription('Show all features and systems of the bot');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🤖 Velari Bot - Feature Overview')
    .setColor('#4CAF50')
    .setDescription("Here's everything I can do for your server!")
    .addFields(
      { name: '🔑 Key System', value: 'Generate, redeem, and manage premium keys. `/keys`', inline: false },
      { name: '📝 Review System', value: 'Leave and view reviews for purchases. `/review`', inline: false },
      { name: '👋 Welcome & Goodbye', value: 'Custom welcome/goodbye messages with banners and reactions. `/welcome`', inline: false },
      { name: '🎫 Ticket & Support', value: 'Create support tickets and get help. `/ticket`', inline: false },
      { name: '🛡️ Moderation', value: 'Ban, kick, timeout, warn, purge, snipe. `/moderation`', inline: false },
      { name: '🎭 Reaction Roles', value: 'Self-assignable roles with buttons. `/reactionrole`', inline: false },
      { name: '💡 Suggestions', value: 'Submit and vote on suggestions. `/suggest`', inline: false },
      { name: '📊 Dashboard', value: 'Excel-like dashboard for key stats. `/keys dashboard`', inline: false },
      { name: '📢 Announcements', value: 'Send announcements to channels. `/utility announce`', inline: false },
      { name: 'ℹ️ Info & Utility', value: 'Server info, user info, bot info, reminders. `/utility`', inline: false },
      { name: '⚙️ Admin Tools', value: 'Role management, system toggles, and more.', inline: false },
      { name: '📚 Full Command List', value: 'Type `/` to see all available commands!', inline: false },
      { name: '📞 Support', value: '[Open a ticket](https://discord.com/channels/@me) or use `/ticket` for help.', inline: false }
    )
    .setFooter({ text: 'Velari Bot • All-in-one server management', iconURL: interaction.client.user.displayAvatarURL() })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
} 
