import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } from 'discord.js';
import { db } from '../firebase/firebase.js';

export const data = new SlashCommandBuilder()
  .setName('supportpanel')
  .setDescription('Send the support ticket panel for users to get help.');

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: '❌ You need Manage Server permission to use this command.', ephemeral: true });
  }
  const embed = new EmbedBuilder()
    .setTitle('🆘 Support Tickets')
    .setDescription('Click the button below to open a support ticket and get help from our team!')
    .setColor(0x5865F2);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_support_ticket')
      .setLabel('Get Support')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🆘')
  );
  await interaction.reply({ embeds: [embed], components: [row] });
}

export async function handleCreateSupportTicket(interaction, client) {
  // Show modal for support
  const modal = new ModalBuilder()
    .setCustomId('support_ticket_modal')
    .setTitle('🆘 New Support Ticket');

  const subjectInput = new TextInputBuilder()
    .setCustomId('support_subject')
    .setLabel('Subject (e.g., Account, Bug, Question)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const descriptionInput = new TextInputBuilder()
    .setCustomId('support_description')
    .setLabel('Describe your issue')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(subjectInput),
    new ActionRowBuilder().addComponents(descriptionInput)
  );

  await interaction.showModal(modal);
}

export async function handleSupportTicketModal(interaction, client) {
  const subject = interaction.fields.getTextInputValue('support_subject');
  const description = interaction.fields.getTextInputValue('support_description');

  // Create support ticket channel
  const guild = interaction.guild;
  const channelName = `support-${interaction.user.username}`;
  let ticketChannel;
  try {
    ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: ['ViewChannel'] },
        { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'AttachFiles'] },
      ],
      topic: `Support ticket for ${interaction.user.tag}`
    });
  } catch (err) {
    return interaction.reply({ content: '❌ Failed to create support channel. Please contact an admin.', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('🆘 New Support Ticket')
    .addFields(
      { name: '📄 Subject', value: subject },
      { name: '🖊️ Description', value: description }
    )
    .setFooter({ text: `User: ${interaction.user.tag} | ID: ${interaction.user.id}` })
    .setTimestamp();
  await ticketChannel.send({ content: `<@${interaction.user.id}> @Support Team`, embeds: [embed] });

  // Log to Firestore
  await db.collection('supportTickets').add({
    userId: interaction.user.id,
    username: interaction.user.tag,
    subject,
    description,
    timestamp: new Date()
  });

  await interaction.reply({ content: `✅ Your support ticket has been created! ${ticketChannel.toString()}`, ephemeral: true });
} 
