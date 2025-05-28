# Setup Instructions for Claude Desktop Assistant

## Prerequisites
- Node.js 18+ (you have v22.12.0 which is perfect)
- npm or yarn
- Windows/macOS/Linux

## Installation Steps

### 1. Clean Install Dependencies
First, let's do a clean install to avoid any issues:

```bash
# Remove existing node_modules and lock file
rm -rf node_modules package-lock.json

# Install dependencies
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory:

```bash
# Copy the example file
copy env.example .env
```

Then edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=your_api_key_here
```

### 3. Build the Application

```bash
# Build the Electron main process
npm run build:electron

# This will compile src/main.ts and src/preload.ts to JavaScript
```

### 4. Run the Application

```bash
# Start in development mode
npm run dev

# Or if you prefer separate terminals:
# Terminal 1: Start React dev server
npm run start:renderer

# Terminal 2: Start Electron (after React is running)
npm run start:electron
```

## How to Use Claude Computer Use

### Chat Interface
The app provides a chat interface where you can:
- **Ask Claude to control your computer**: "Open Chrome and go to GitHub"
- **Run commands**: "Create a new Python file and write a hello world program"
- **Get help with tasks**: "Help me organize my desktop"

### Vision Mode
Toggle "Vision Mode" to let Claude see your screen:
- When ON: Claude receives screenshots with your messages
- When OFF: Claude works with text commands only
- Screenshots are automatically deleted after processing (configurable in settings)

### Example Commands

**Without Vision Mode:**
- "Open Notepad and create a new file"
- "Run dir command in terminal"
- "Open Chrome browser"

**With Vision Mode:**
- "What's on my screen?"
- "Help me fix the error shown in my code editor"
- "What application is this?"
- "Read the text in this image"

### How It Works

1. **Computer Tool**: Claude can simulate mouse clicks, keyboard input, and take screenshots
2. **Bash Tool**: Claude can execute terminal/PowerShell commands
3. **Agent Loop**: Claude will use multiple tools in sequence to complete complex tasks

## Current Limitations

- Mouse/keyboard actions are currently simulated (logged to console)
- Full automation will be implemented in future updates
- For now, Claude can:
  - Take and analyze screenshots
  - Execute bash/PowerShell commands
  - Plan multi-step operations

## Settings

Navigate to Settings to configure:
- **API Key**: Your Anthropic API key
- **Vision Update Interval**: How often screenshots update in vision mode
- **Auto-delete Screenshots**: Whether to delete screenshots after processing

## Troubleshooting

### If you get TypeScript errors:
```bash
# Make sure to build the Electron files first
npm run build:electron
```

### If the app doesn't start:
1. Check that the React dev server is running on http://localhost:3000
2. Make sure `.env` file exists with your API key
3. Check the Electron console for errors (DevTools will open automatically in dev mode)

### Screen Capture Permissions:
- **Windows**: The app may need to run as administrator for some features
- **macOS**: Grant screen recording permissions in System Preferences > Security & Privacy > Screen Recording

## Next Steps

1. Replace the placeholder icon files in the `assets` folder with actual PNG images
2. Test Claude's ability to help with your daily tasks
3. Try different contexts and see how Claude responds
4. Report any issues or feature requests

## Security Notes

- Your API key is stored locally and never shared
- Screenshots are processed locally and sent only to Claude API
- All data transmission is encrypted
- You can disable vision mode at any time 