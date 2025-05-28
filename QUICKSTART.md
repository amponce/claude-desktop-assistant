# Claude Desktop Assistant - Quick Start Guide

## What We've Built

A React Electron desktop application that uses Claude's Computer Use API to analyze your screen and provide contextual assistance.

### Key Features:
- 📸 Screen capture with one-click analysis
- 🤖 Claude AI integration with computer use capabilities
- 🎯 Multiple context modes (general, coding, writing, browsing, custom)
- 📊 Analysis history with search and filtering
- ⚙️ Settings management for API keys and preferences
- 🎨 Modern Material-UI dark theme interface
- 🔥 System tray integration
- ⌨️ Global keyboard shortcuts

## Project Structure

```
electron-app/
├── src/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Secure IPC bridge
│   └── renderer/            # React application
│       ├── main.tsx         # React entry point
│       ├── App.tsx          # Main app component
│       ├── components/      # Reusable components
│       │   └── Header.tsx   # Navigation header
│       ├── pages/           # Route pages
│       │   ├── Dashboard.tsx # Main analysis interface
│       │   ├── Settings.tsx  # Configuration page
│       │   └── History.tsx   # Analysis history
│       └── store/           # State management
│           └── useStore.ts   # Zustand store
├── assets/                  # Icons and resources
├── dist/                    # Compiled output (generated)
└── package.json            # Dependencies and scripts
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   - Copy `env.example` to `.env`
   - Add your Anthropic API key:
     ```
     ANTHROPIC_API_KEY=your_api_key_here
     ```

3. **Add Icons** (Optional but recommended)
   - Replace `assets/icon.png` with your app icon (256x256 or 512x512)
   - Replace `assets/tray-icon.png` with a system tray icon (16x16 or 32x32)

4. **Build and Run**
   ```bash
   # Development mode
   npm run dev

   # Production build
   npm run build
   npm run start
   ```

## Using the Application

1. **First Launch**
   - Go to Settings and enter your Anthropic API key
   - Save the settings

2. **Capturing and Analyzing**
   - Click "Capture & Analyze" on the Dashboard
   - Select a context (general, coding, writing, etc.)
   - View the AI analysis of your screen

3. **Keyboard Shortcuts**
   - `Ctrl/Cmd + Shift + A` - Trigger manual analysis
   - `Ctrl/Cmd + Shift + M` - Toggle monitoring
   - `Ctrl/Cmd + ,` - Open settings

## Building for Distribution

```bash
# Windows
npm run build-win

# macOS
npm run build-mac

# Both platforms
npm run build-all
```

## Troubleshooting

1. **Module errors during development**
   - Make sure to run `npm run build:electron` before starting
   - The TypeScript files need to be compiled to JavaScript

2. **Screen capture permissions**
   - On macOS, grant screen recording permissions
   - On Windows, may need to run as administrator

3. **API errors**
   - Verify your Anthropic API key is correct
   - Check you have credits available
   - Ensure you're using a compatible model

## Next Steps

- Customize the UI theme in `src/renderer/main.tsx`
- Add more analysis contexts in `src/renderer/pages/Dashboard.tsx`
- Implement automatic monitoring features
- Add export functionality for analysis results
- Create custom analysis prompts

## Important Notes

- The application stores settings locally using electron-store
- Screenshots are kept in memory and saved to history (limited to 100)
- API calls are made directly from the main process for security
- The preload script ensures secure IPC communication 