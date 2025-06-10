# Discord Embed Builder Bot

A modular Discord bot for building, previewing, and saving embed templates, with Firestore integration.

## Features
- Slash command `/embedbuilder` for interactive embed creation
- Real-time ephemeral preview with Send/Edit/Cancel buttons
- Channel selection and permission checks
- Save/load embed templates with Firestore
- Modular, clean, and expandable codebase

## Setup
1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with your credentials:
   ```env
   DISCORD_TOKEN=your-discord-bot-token
   CLIENT_ID=your-discord-client-id
   FIREBASE_API_KEY=your-firebase-api-key
   FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
   FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
   FIREBASE_APP_ID=your-firebase-app-id
   ```
3. Start the bot:
   ```bash
   npm start
   ```

## Project Structure
- `index.js` — Bot entry point
- `commands/embedbuilder.js` — Slash command and modal logic
- `utils/embedPreview.js` — Embed preview and button logic
- `firebase/firebase.js` — Firestore integration

---
MIT License 