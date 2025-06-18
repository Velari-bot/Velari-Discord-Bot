import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const commands = [];
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`Found ${commandFiles.length} command files:`, commandFiles);

for (const file of commandFiles) {
  try {
    const command = await import(`./commands/${file}`);
    if (command.data) {
      commands.push(command.data.toJSON());
      console.log(`✅ Loaded command: ${file}`);
    } else {
      console.log(`⚠️ Skipping ${file}: No data property`);
    }
  } catch (error) {
    console.log(`❌ Error loading ${file}: ${error.message}`);
    console.error(error);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const guildIds = ['1381793479495127180', '1254224101342449694', '1384640904798802031']; // Added new guild ID

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    for (const guildId of guildIds) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commands },
      );
      console.log(`Successfully reloaded application (/) commands for guild ${guildId}.`);
    }
  } catch (error) {
    console.error(error);
  }
})(); 