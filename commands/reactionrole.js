import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { TICKET_CONFIG } from '../config.js';
import { db } from '../firebase/firebase.js';

export const data = new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Manage reaction roles')
    .addSubcommand(subcommand =>
        subcommand
            .setName('create')
            .setDescription('Create a reaction role message')
            .addStringOption(option =>
                option.setName('title').setDescription('Message title').setRequired(true)
            )
            .addStringOption(option =>
                option.setName('description').setDescription('Message description').setRequired(true)
            )
            .addRoleOption(option =>
                option.setName('role1').setDescription('First role').setRequired(true)
            )
            .addRoleOption(option =>
                option.setName('role2').setDescription('Second role').setRequired(false)
            )
            .addRoleOption(option =>
                option.setName('role3').setDescription('Third role').setRequired(false)
            )
            .addRoleOption(option =>
                option.setName('role4').setDescription('Fourth role').setRequired(false)
            )
            .addRoleOption(option =>
                option.setName('role5').setDescription('Fifth role').setRequired(false)
            )
    );

export async function execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
        await handleCreateReactionRole(interaction, client);
    }
}

async function handleCreateReactionRole(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return await interaction.reply({
            content: '❌ **You need "Manage Roles" permission to create reaction roles.**',
            ephemeral: true
        });
    }

    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const roles = [
        interaction.options.getRole('role1'),
        interaction.options.getRole('role2'),
        interaction.options.getRole('role3'),
        interaction.options.getRole('role4'),
        interaction.options.getRole('role5')
    ].filter(role => role !== null);

    if (roles.length === 0) {
        return await interaction.reply({
            content: '❌ **At least one role is required.**',
            ephemeral: true
        });
    }

    // Check if bot can manage these roles
    for (const role of roles) {
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return await interaction.reply({
                content: `❌ **I cannot manage the role ${role.name}. It is higher than my highest role.**`,
                ephemeral: true
            });
        }
    }

    const embed = new EmbedBuilder()
        .setTitle(`🎭 **${title}**`)
        .setDescription(description)
        .setColor(TICKET_CONFIG.COLORS.PRIMARY)
        .setFooter({ text: 'Velari Reaction Role System', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

    // Create buttons for each role
    const buttonRows = [];
    const emojis = ['🟣', '🔵', '🟢', '🟡', '🟠'];
    
    for (let i = 0; i < roles.length; i++) {
        const role = roles[i];
        const emoji = emojis[i];
        
        const button = new ButtonBuilder()
            .setCustomId(`reactionrole_${role.id}`)
            .setLabel(role.name)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(emoji);

        // Add to rows (max 5 buttons per row)
        const rowIndex = Math.floor(i / 5);
        if (!buttonRows[rowIndex]) {
            buttonRows[rowIndex] = new ActionRowBuilder();
        }
        buttonRows[rowIndex].addComponents(button);
    }

    try {
        const message = await interaction.channel.send({
            embeds: [embed],
            components: buttonRows
        });

        // Store reaction role data
        if (!client.reactionRoles) client.reactionRoles = new Map();
        client.reactionRoles.set(message.id, {
            guildId: interaction.guild.id,
            roles: roles.map(role => role.id)
        });

        const successEmbed = new EmbedBuilder()
            .setTitle('✅ **Reaction Role Created**')
            .setDescription(`**Reaction role message has been created with ${roles.length} role(s).**\n\n**Roles:** ${roles.map(role => role.toString()).join(', ')}`)
            .setColor(TICKET_CONFIG.COLORS.SUCCESS)
            .setFooter({ text: 'Velari Reaction Role System', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });

    } catch (error) {
        console.error('Error creating reaction role message:', error);
        await interaction.reply({
            content: '❌ **Failed to create reaction role message. Please check my permissions.**',
            ephemeral: true
        });
    }
}

// Export button handler for use in index.js
export async function handleReactionRoleButton(interaction, client) {
    const roleId = interaction.customId.replace('reactionrole_', '');
    const role = interaction.guild.roles.cache.get(roleId);
    
    if (!role) {
        return await interaction.reply({
            content: '❌ **Role not found.**',
            ephemeral: true
        });
    }

    const member = interaction.member;
    const hasRole = member.roles.cache.has(roleId);

    try {
        if (hasRole) {
            await member.roles.remove(role, 'Reaction role removal');
            
            const embed = new EmbedBuilder()
                .setTitle('🎭 **Role Removed**')
                .setDescription(`**The role ${role.toString()} has been removed from you.**`)
                .setColor(TICKET_CONFIG.COLORS.WARNING)
                .setFooter({ text: 'Velari Reaction Role System', iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            await member.roles.add(role, 'Reaction role assignment');
            
            const embed = new EmbedBuilder()
                .setTitle('🎭 **Role Added**')
                .setDescription(`**The role ${role.toString()} has been added to you.**`)
                .setColor(TICKET_CONFIG.COLORS.SUCCESS)
                .setFooter({ text: 'Velari Reaction Role System', iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    } catch (error) {
        console.error('Error managing reaction role:', error);
        await interaction.reply({
            content: '❌ **Failed to manage role. Please contact an administrator.**',
            ephemeral: true
        });
    }
} 
