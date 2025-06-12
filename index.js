import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { permabannedIds } from './utils/permaban.js';

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

// Channel IDs
const WELCOME_CHANNEL_ID = '1369435023899496498';
const RULES_CHANNEL_ID = '1369435178971172984';
const ANNOUNCEMENTS_CHANNEL_ID = '1369435271002591232';
const PRICING_CHANNEL_ID = '1382467465572913172';
const FAQ_CHANNEL_ID = '1382467481733435486';
const STATUS_CHANNEL_ID = '1382467501622821076';
const ORDER_HERE_CHANNEL_ID = '1382467920063496232';
const SHOWCASE_CHANNEL_ID = '1382467953789894677';
const PACKAGE_ADDON_CHANNEL_ID = '1382467968826478592';
const REVIEWS_CHANNEL_ID = '1382467982004846632';
const GENERAL_CHAT_ID = '1369436802837905458';
const TICKET_CHANNEL_ID = '1370521751456317531';
const ORDER_TRACKING_CHANNEL_ID = '1382468168509034647';
const LOGS_CHANNEL_ID = '1369444382390091927';

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

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Serving ${client.guilds.cache.size} guilds`);
  console.log(`Watching ${client.users.cache.size} users`);
  
  // Initialize Firebase and Key System
  try {
    const { testConnection, initializeKeySystem } = await import('./firebase/firebase.js');
    
    // Test Firebase connection
    const connectionTest = await testConnection();
    if (!connectionTest) {
      console.error('❌ Firebase connection failed. Key system may not work properly.');
    }
    
    // Initialize key system collections
    const keySystemInit = await initializeKeySystem();
    if (!keySystemInit) {
      console.error('❌ Key system initialization failed.');
    } else {
      console.log('🔑 Key system ready!');
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase/Key system:', error);
  }
  
  const general = client.channels.cache.get(GENERAL_CHAT_ID);
  if (general) {
    const me = await general.guild.members.fetchMe();
    const perms = general.permissionsFor(me);
    if (!perms.has(['ManageMessages', 'ModerateMembers'])) {
      console.warn('⚠️ Bot is missing Manage Messages or Moderate Members permissions in #general!');
    }
  } else {
    console.warn('⚠️ #general channel not found for permissions check.');
  }
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
      const redeemModule = await import('./commands/redeem.js');
      const myKeysModule = await import('./commands/mykeys.js');
      const keyDashboardModule = await import('./commands/keydashboard.js');
      const reviewModule = await import('./commands/review.js');
      
      if (customId === 'create_ticket') {
        await ticketModule.handleCreateTicket(interaction, client);
      } else if (customId === 'close_ticket') {
        await ticketModule.handleCloseTicketButton(interaction, client);
      } else if (customId.startsWith('reactionrole_')) {
        await reactionRoleModule.handleReactionRoleButton(interaction, client);
      } else if (customId.startsWith('suggestion_')) {
        await suggestModule.handleSuggestionVote(interaction, client);
      } else if (customId.startsWith('redeem_')) {
        await redeemModule.handleRedeemButton(interaction, client);
      } else if (customId.startsWith('mykeys_')) {
        await myKeysModule.handleMyKeysButton(interaction, client);
      } else if (customId.startsWith('dashboard_')) {
        await keyDashboardModule.handleDashboardButton(interaction, client);
      } else if (customId.startsWith('review_')) {
        await reviewModule.handleReviewButton(interaction, client);
      } else {
        console.log(`Unknown button interaction: ${customId}`);
      }
    }

    // Handle select menu interactions
    if (interaction.isStringSelectMenu()) {
      const { customId } = interaction;
      
      const keyDashboardModule = await import('./commands/keydashboard.js');
      
      if (customId.startsWith('dashboard_')) {
        await keyDashboardModule.handleDashboardSelect(interaction, client);
      } else {
        console.log(`Unknown select menu interaction: ${customId}`);
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
      await interaction.followUp({ content: errorMessage, flags: 64 });
    } else {
      await interaction.reply({ content: errorMessage, flags: 64 });
    }
  }
});

// --- Welcome Message with Random Emoji Reactions ---
const WELCOME_EMOJIS = [
  '🎉', '👋', '😎', '🥳', '✨', '🙌', '🔥', '😃', '🫡', '💫', '🤩', '🦾', '🦸', '🫶', '💥', '🌟', '🎊', '🕺', '💯', '🚀'
];

client.on('guildMemberAdd', async (member) => {
  try {
    const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID);
    if (!channel) return;

    // Format join date and account creation date
    const createdAt = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`;
    const joinedAt = `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`;

    // Get member count
    const memberCount = member.guild.memberCount;

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle(`🎉 Welcome to Team Solarr | EST 2025, ${member.user.tag}! 🎉`)
      .setDescription(`We're excited to have you join our community!\n\n• You are our **${memberCount}th** member\n• Account created on ${createdAt}\n• Join date: ${joinedAt}\n\n**Quick Links:**\n[Server Rules](https://discord.com/channels/${member.guild.id}/${RULES_CHANNEL_ID})\n[General](https://discord.com/channels/${member.guild.id}/)\n[Support](https://discord.com/channels/${member.guild.id}/)`)
      .setImage('attachment://Lunary_Banner.png')
      .setColor('#F44336')
      .setFooter({ text: `Member joined at • ${new Date(member.joinedTimestamp).toLocaleTimeString()} • ${new Date(member.joinedTimestamp).toLocaleDateString()}` });

    // Send embed with banner image attachment
    const sentMessage = await channel.send({
      embeds: [embed],
      files: [{ attachment: './Lunary_Banner.png', name: 'Lunary_Banner.png' }]
    });

    // Pick 3 random emojis
    const shuffled = WELCOME_EMOJIS.sort(() => 0.5 - Math.random());
    const emojis = shuffled.slice(0, 3);
    for (const emoji of emojis) {
      await sentMessage.react(emoji);
    }
  } catch (err) {
    console.error('Error sending welcome message:', err);
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

// Swear word regex (whole words, case-insensitive)
const SWEAR_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'nigger', 'faggot', 'dick', 'pussy', 'bastard', 'slut', 'whore', 'damn', 'crap', 'cock', 'twat', 'wank', 'bollocks', 'bugger', 'arse', 'prick', 'tit', 'shag', 'git', 'tosser', 'wanker', 'bloody', 'bollocks', 'arsehole', 'motherfucker', 'douche', 'douchebag', 'jackass', 'jerkoff', 'knob', 'knobhead', 'bellend', 'minge', 'minger', 'nonce', 'pillock', 'plonker', 'ponce', 'scrubber', 'skank', 'slag', 'tart', 'twit', 'twonk', 'yob', 'yobbo', 'shite', 'shag', 'arse', 'arsewipe', 'arsebandit', 'arseface', 'arsehole', 'bint', 'bitch', 'bollocks', 'bugger', 'choad', 'clunge', 'crap', 'cum', 'cunt', 'dick', 'dildo', 'douche', 'dyke', 'fag', 'faggot', 'fanny', 'fuck', 'fucker', 'jizz', 'knob', 'minge', 'muff', 'nob', 'nonce', 'piss', 'prick', 'pube', 'pussy', 'queer', 'scrote', 'shag', 'shit', 'shite', 'slut', 'spunk', 'tit', 'tosser', 'twat', 'wank', 'wanker', 'whore'
];
const SWEAR_REGEX = new RegExp(`\\b(${SWEAR_WORDS.join('|')})\\b`, 'i');

const userOffenses = new Map(); // userId -> { lastOffense: timestamp, count: number }

const LINK_REGEX = /https?:\/\//i;

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  // Swear word filter (applies to ALL channels)
  const match = message.content.match(SWEAR_REGEX);
  if (match) {
    console.log(`[DEBUG] Swear detected: '${match[0]}' in message: '${message.content}' by ${message.author.tag} (${message.author.id})`);
    try {
      await message.delete();
      console.log(`[DEBUG] Deleted message for swearing.`);
    } catch (err) {
      console.error('[ERROR] Deleting swear message:', err);
    }
    // Timeout logic only in general channel
    if (message.channel.id === GENERAL_CHAT_ID) {
      const now = Date.now();
      const offense = userOffenses.get(message.author.id) || { lastOffense: 0, count: 0 };
      let timeoutDuration = 60_000; // 60 seconds
      if (now - offense.lastOffense < 5 * 60_000) {
        timeoutDuration = 5 * 60_000; // 5 minutes
        offense.count++;
      } else {
        offense.count = 1;
      }
      offense.lastOffense = now;
      userOffenses.set(message.author.id, offense);
      let timedOut = false;
      try {
        await message.member.timeout(timeoutDuration, 'Swearing in general chat');
        timedOut = true;
        console.log(`[DEBUG] Timed out user for swearing: ${timeoutDuration / 1000} seconds.`);
      } catch (err) {
        console.error('[ERROR] Timing out user:', err);
      }
      try {
        if (timedOut) {
          await message.author.send(`🚫 You have been timed out for swearing in #general. Duration: ${timeoutDuration / 1000} seconds.`);
        } else {
          await message.author.send('⚠️ Your message was deleted for swearing in #general. The bot attempted to timeout you, but does not have permission to do so.');
        }
      } catch (err) {
        console.error('[ERROR] DMing user about timeout:', err);
      }
    }
    return;
  }

  // --- General Chat Moderation ---
  if (message.channel.id === GENERAL_CHAT_ID) {
    console.log(`[DEBUG] Message in #general from ${message.author.tag} (${message.author.id}): ${message.content}`);
    // Block links
    if (LINK_REGEX.test(message.content)) {
      console.log(`[DEBUG] Link detected in message from ${message.author.tag} (${message.author.id})`);
      try {
        await message.delete();
        console.log(`[DEBUG] Deleted link message from ${message.author.tag}`);
        await message.author.send('🚫 Your message was deleted: Links are not allowed in #general.');
      } catch (err) {
        console.error('[ERROR] Deleting link or DMing user:', err);
      }
      // Do not return, allow further checks (e.g., swearing in a link message)
    }
  }

  // --- Anti-spam (all channels) ---
  if (!message.deleted) {
    if (messageCooldowns.has(message.author.id)) {
      const lastMessage = messageCooldowns.get(message.author.id);
      const now = Date.now();
      const cooldownAmount = 3000; // 3 seconds
      if (now - lastMessage < cooldownAmount) {
        console.log(`[DEBUG] Spam detected from ${message.author.tag} (${message.author.id})`);
        try {
          await message.delete();
          console.log(`[DEBUG] Deleted spam message from ${message.author.tag}`);
          await message.author.send('⚠️ You are sending messages too quickly. Please slow down!');
        } catch (err) {
          console.error('[ERROR] Deleting spam message or DMing user:', err);
        }
        return;
      }
    }
    messageCooldowns.set(message.author.id, Date.now());
    setTimeout(() => messageCooldowns.delete(message.author.id), 3000);
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

// --- Permaban System ---
client.on('guildMemberAdd', async member => {
  if (permabannedIds.has(member.id)) {
    try {
      await member.ban({ reason: 'Permanently banned by bot.' });
      await member.send('🚫 You are permanently banned from this server.');
    } catch {}
  }
});

client.login(process.env.DISCORD_TOKEN); 