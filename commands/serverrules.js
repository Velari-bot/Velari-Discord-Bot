import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('serverrules')
    .setDescription('Post the Lunary Services rules and info embed');

export async function execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return await interaction.reply({
            content: '❌ **You need "Manage Server" permission to use this command.**',
            ephemeral: true
        });
    }
    const rulesEmbed = new EmbedBuilder()
        .setTitle('📜 LUNARY SERVICES - RULES & INFO')
        .setDescription('💼 **Welcome to Lunary Services!**\nWe provide high-quality digital services for creators, businesses, and communities. Before ordering, please read the following rules and pricing carefully.')
        .addFields(
            { name: '🚫 Rules', value: `• Be respectful to staff and clients at all times.\n• No chargebacks or refunds unless explicitly approved by staff.\n• No spam, advertising, or self-promotion.\n• Do not impersonate Lunary staff or misrepresent services.\n• All payments are upfront and in full before work begins.\n• Feedback is welcome, but harassment or toxic behavior is not tolerated.\n• Breaking rules may result in warnings, bans, or blacklisting.` },
            { name: '💸 Pricing', value: `*(Hosting is optional but recommended for complete setup)*\n🖥 **Hosting** – $5/month\n🗂 **Backend Hosting** – $5/month` },
            { name: '🔧 Services', value: `🤖 **Discord Bot:** $40+\n🌐 **Website:** $150+\n📱 **App:** $250+` },
            { name: '🎨 Designs', value: `🖼 **GFX (Thumbnail/Logo):** $25 / $40+\n🎞 **VFX (Montage/Edit Video):** Custom Pricing` },
            { name: '💎 Optional Extras', value: `🚀 **14x Server Boosts (3 months):** $20\n🎁 **Discord Nitro (1 Month):** $8` },
            { name: '📝 To order, open a ticket and provide:', value: `• Service type\n• Details/requirements\n• Preferred deadline\n• Payment method` },
            { name: '\u200B', value: '📩 **Staff will respond shortly. Thank you for choosing Lunary Services!**' }
        )
        .setColor('#5865F2')
        .setFooter({ text: 'Lunary Services', iconURL: 'https://cdn.discordapp.com/attachments/1382042625959530616/1382042652433977364/Lunary.png?ex=6849b705&is=68486585&hm=cfb8e8a894192e0ee608a71ebad6e936bed4ad20e1df3a0309effd79297b917b&' })
        .setTimestamp();
    await interaction.reply({ embeds: [rulesEmbed] });
}
