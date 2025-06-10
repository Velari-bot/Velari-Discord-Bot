import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import fs from 'fs';
import path from 'path';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
});

client.commands = new Collection();

// Dynamically load commands from commands folder
const commandsPath = path.join(process.cwd(), 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    }
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Serving ${client.guilds.cache.size} guilds`);
  console.log(`Watching ${client.users.cache.size} users`);
});

client.on('interactionCreate', async interaction => {
  try {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      
      await command.execute(interaction, client);
    }
    
    // Handle button interactions
    if (interaction.isButton()) {
      const { customId } = interaction;
      
      // Import modules
      const ticketModule = await import('./commands/ticket.js');
      const reactionRoleModule = await import('./commands/reactionrole.js');
      const suggestModule = await import('./commands/suggest.js');
      
      if (customId === 'create_ticket') {
        await ticketModule.handleCreateTicket(interaction, client);
      } else if (customId === 'close_ticket') {
        await ticketModule.handleCloseTicketButton(interaction, client);
      } else if (customId.startsWith('reactionrole_')) {
        await reactionRoleModule.handleReactionRoleButton(interaction, client);
      } else if (customId.startsWith('suggestion_')) {
        await suggestModule.handleSuggestionVote(interaction, client);
      } else {
        console.log(`Unknown button interaction: ${customId}`);
      }
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      const { customId } = interaction;
      
      // Import modules
      const ticketModule = await import('./commands/ticket.js');
      const utilityModule = await import('./commands/utility.js');
      const suggestModule = await import('./commands/suggest.js');
      
      if (customId === 'ticket_modal') {
        await ticketModule.handleTicketModal(interaction, client);
      } else if (customId === 'announcement_modal') {
        await utilityModule.handleAnnouncementModal(interaction, client);
      } else if (customId === 'suggestion_modal') {
        await suggestModule.handleSuggestionModal(interaction, client);
      } else {
        console.log(`Unknown modal interaction: ${customId}`);
      }
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    
    const errorMessage = '❌ **An error occurred while processing your request.**';
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

// Welcome and Goodbye events
client.on('guildMemberAdd', async member => {
  try {
    const welcomeModule = await import('./commands/welcome.js');
    await welcomeModule.sendWelcomeMessage(member.guild, member, client);
  } catch (error) {
    console.error('Error handling member join:', error);
  }
});

client.on('guildMemberRemove', async member => {
  try {
    const welcomeModule = await import('./commands/welcome.js');
    await welcomeModule.sendGoodbyeMessage(member.guild, member, client);
  } catch (error) {
    console.error('Error handling member leave:', error);
  }
});

// Message deletion tracking for snipe command
client.on('messageDelete', async message => {
  try {
    if (message.author?.bot) return;
    
    const moderationModule = await import('./commands/moderation.js');
    moderationModule.storeDeletedMessage(client, message.channel.id, message);
  } catch (error) {
    console.error('Error tracking deleted message:', error);
  }
});

// Anti-spam system (basic)
const messageCooldowns = new Map();
const joinCooldowns = new Map();

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  
  try {
    // Basic anti-spam
    const userId = message.author.id;
    const now = Date.now();
    const cooldownAmount = 3000; // 3 seconds
    
    if (messageCooldowns.has(userId)) {
      const lastMessage = messageCooldowns.get(userId);
      if (now - lastMessage < cooldownAmount) {
        // Spam detected
        await message.delete();
        await message.channel.send({
          content: `⚠️ **${message.author}, please slow down your messages!**`,
          ephemeral: true
        });
        return;
      }
    }
    
    messageCooldowns.set(userId, now);
    
    // Clean up old cooldowns
    setTimeout(() => {
      messageCooldowns.delete(userId);
    }, cooldownAmount);
    
  } catch (error) {
    console.error('Error in anti-spam system:', error);
  }
});

// Anti-raid system (basic)
client.on('guildMemberAdd', async member => {
  try {
    const guildId = member.guild.id;
    const now = Date.now();
    const raidThreshold = 10; // 10 joins in 30 seconds
    const raidWindow = 30000; // 30 seconds
    
    if (!joinCooldowns.has(guildId)) {
      joinCooldowns.set(guildId, []);
    }
    
    const joins = joinCooldowns.get(guildId);
    joins.push(now);
    
    // Remove old joins outside the window
    const recentJoins = joins.filter(time => now - time < raidWindow);
    joinCooldowns.set(guildId, recentJoins);
    
    if (recentJoins.length >= raidThreshold) {
      // Potential raid detected
      console.log(`Potential raid detected in ${member.guild.name} - ${recentJoins.length} joins in ${raidWindow/1000} seconds`);
      
      // You could implement additional measures here:
      // - Enable verification level
      // - Send alert to staff
      // - Temporarily disable invites
    }
    
  } catch (error) {
    console.error('Error in anti-raid system:', error);
  }
});

client.login(process.env.DISCORD_TOKEN); 