README.md

That's a fascinating project! Building an Electron app with Claude's computer use API for real-time screen analysis would create a powerful accessibility and productivity tool. Here's how you can approach this:

## Architecture Overview

**Core Components:**
- **Electron main process** - Handle screen capture and API communications
- **Renderer process** - Display UI and handle user interactions  
- **Claude API integration** - Send screenshots and receive vision analysis
- **Screen monitoring** - Continuous or triggered screen capture

## Key Technologies You'll Need

**Screen Capture:**
- `electron.desktopCapturer` for screenshots
- `node-screenshots` for more granular control
- Consider using `robotjs` for additional screen utilities

**API Integration:**
- Anthropic's Messages API with vision capabilities
- WebSocket or polling for real-time updates
- Rate limiting to respect API constraints

## Basic Implementation Structure

```javascript
// main.js - Main Electron process
const { app, BrowserWindow, desktopCapturer } = require('electron');
const Anthropic = require('@anthropic-ai/sdk');

class ScreenAnalyzer {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    this.isAnalyzing = false;
  }

  async captureScreen() {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });
    
    return sources[0].thumbnail.toPNG();
  }

  async analyzeScreen(imageBuffer, context = "general") {
    if (this.isAnalyzing) return; // Prevent overlapping calls
    
    this.isAnalyzing = true;
    
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const response = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: base64Image
              }
            },
            {
              type: "text",
              text: `Analyze this screen capture. Context: ${context}. 
                     Provide helpful insights about what's visible and any 
                     actionable suggestions.`
            }
          ]
        }]
      });
      
      return response.content[0].text;
    } finally {
      this.isAnalyzing = false;
    }
  }
}
```

## Real-time Monitoring Approaches

**Option 1: Polling Approach**
```javascript
class RealTimeMonitor {
  constructor(analyzer) {
    this.analyzer = analyzer;
    this.interval = null;
    this.lastScreenHash = null;
  }

  startMonitoring(intervalMs = 3000) {
    this.interval = setInterval(async () => {
      const screenshot = await this.analyzer.captureScreen();
      const currentHash = this.hashImage(screenshot);
      
      // Only analyze if screen changed significantly
      if (currentHash !== this.lastScreenHash) {
        const analysis = await this.analyzer.analyzeScreen(screenshot);
        this.onScreenChange(analysis);
        this.lastScreenHash = currentHash;
      }
    }, intervalMs);
  }

  hashImage(buffer) {
    // Simple hash to detect changes
    return require('crypto').createHash('md5').update(buffer).digest('hex');
  }
}
```

**Option 2: Event-Driven Approach**
```javascript
// Trigger analysis on specific events
const { globalShortcut } = require('electron');

app.whenReady().then(() => {
  // Manual trigger
  globalShortcut.register('CommandOrControl+Shift+A', async () => {
    const screenshot = await analyzer.captureScreen();
    const analysis = await analyzer.analyzeScreen(screenshot, "user_requested");
    displayAnalysis(analysis);
  });

  // Focus change monitoring
  app.on('browser-window-focus', triggerAnalysis);
});
```

## UI/UX Considerations

**Overlay Window:**
```javascript
function createOverlayWindow() {
  const overlay = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  overlay.setIgnoreMouseEvents(true); // Click-through
  return overlay;
}
```

## Performance & Rate Limiting

```javascript
class APIManager {
  constructor() {
    this.requestQueue = [];
    this.lastRequest = 0;
    this.minInterval = 1000; // 1 second between requests
  }

  async queueRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.requestQueue.length === 0) return;
    
    const now = Date.now();
    if (now - this.lastRequest < this.minInterval) {
      setTimeout(() => this.processQueue(), this.minInterval);
      return;
    }

    const { requestFn, resolve, reject } = this.requestQueue.shift();
    this.lastRequest = now;
    
    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    }
    
    // Process next item
    if (this.requestQueue.length > 0) {
      setTimeout(() => this.processQueue(), this.minInterval);
    }
  }
}
```

## Key Considerations

**Privacy & Security:**
- Always inform users about screen monitoring
- Implement easy disable/pause functionality
- Consider encrypting cached screenshots
- Respect system privacy settings

**Performance:**
- Implement intelligent screenshot diffing
- Use appropriate image compression
- Cache recent analyses to avoid redundant API calls
- Monitor memory usage for long-running sessions

**User Experience:**
- Non-intrusive notifications
- Customizable analysis contexts (coding, browsing, etc.)
- Hotkey controls for manual triggering
- Settings for sensitivity and frequency

**API Efficiency:**
- Batch similar requests when possible
- Use appropriate image resolution (balance quality vs. API costs)
- Implement retry logic with exponential backoff

Would you like me to elaborate on any specific aspect of this implementation, such as the UI design, specific use cases, or handling particular types of screen content?
### About computer use

```ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const message = await anthropic.beta.messages.create({
  model: "claude-4-opus-20250514",
  max_tokens: 1024,
  tools: [
      {
        type: "computer_20250124",
        name: "computer",
        display_width_px: 1024,
        display_height_px: 768,
        display_number: 1
      },
      {
        type: "text_editor_20250429",
        name: "str_replace_based_edit_tool"
      },
      {
        type: "bash_20250124",
        name: "bash"
      }
  ],
  messages: [{ role: "user", content: "Save a picture of a cat to my desktop." }],
  betas: ["computer-use-2025-01-24"],
  thinking: { type: "enabled", budget_tokens": 1024 }
});
console.log(message);
```

How computer use works
1. Provide Claude with computer use tools and a user prompt

Add Anthropic-defined computer use tools to your API request.
Include a user prompt that might require these tools, e.g., “Save a picture of a cat to my desktop.”
2. Claude decides to use a tool

Claude loads the stored computer use tool definitions and assesses if any tools can help with the user’s query.
If yes, Claude constructs a properly formatted tool use request.
The API response has a stop_reason of tool_use, signaling Claude’s intent.
3. Extract tool input, evaluate the tool on a computer, and return results

On your end, extract the tool name and input from Claude’s request.
Use the tool on a container or Virtual Machine.
Continue the conversation with a new user message containing a tool_result content block.
4. Claude continues calling computer use tools until it's completed the task

Claude analyzes the tool results to determine if more tool use is needed or the task has been completed.
If Claude decides it needs another tool, it responds with another tool_use stop_reason and you should return to step 3.
Otherwise, it crafts a text response to the user.
We refer to the repetition of steps 3 and 4 without user input as the “agent loop” - i.e., Claude responding with a tool use request and your application responding to Claude with the results of evaluating that request.

​
The computing environment
Computer use requires a sandboxed computing environment where Claude can safely interact with applications and the web. This environment includes:

Virtual display: A virtual X11 display server (using Xvfb) that renders the desktop interface Claude will see through screenshots and control with mouse/keyboard actions.

Desktop environment: A lightweight UI with window manager (Mutter) and panel (Tint2) running on Linux, which provides a consistent graphical interface for Claude to interact with.

Applications: Pre-installed Linux applications like Firefox, LibreOffice, text editors, and file managers that Claude can use to complete tasks.

Tool implementations: Integration code that translates Claude’s abstract tool requests (like “move mouse” or “take screenshot”) into actual operations in the virtual environment.

Agent loop: A program that handles communication between Claude and the environment, sending Claude’s actions to the environment and returning the results (screenshots, command outputs) back to Claude.

When you use computer use, Claude doesn’t directly connect to this environment. Instead, your application:

Receives Claude’s tool use requests
Translates them into actions in your computing environment
Captures the results (screenshots, command outputs, etc.)
Returns these results to Claude
For security and isolation, the reference implementation runs all of this inside a Docker container with appropriate port mappings for viewing and interacting with the environment.

​
How to implement computer use
​
Start with our reference implementation
We have built a reference implementation that includes everything you need to get started quickly with computer use:

A containerized environment suitable for computer use with Claude
Implementations of the computer use tools
An agent loop that interacts with the Anthropic API and executes the computer use tools
A web interface to interact with the container, agent loop, and tools.
​
Understanding the multi-agent loop
The core of computer use is the “agent loop” - a cycle where Claude requests tool actions, your application executes them, and returns results to Claude. Here’s a simplified example:


Copy
async def sampling_loop(
    *,
    model: str,
    messages: list[dict],
    api_key: str,
    max_tokens: int = 4096,
    tool_version: str,
    thinking_budget: int | None = None,
    max_iterations: int = 10,  # Add iteration limit to prevent infinite loops
):
    """
    A simple agent loop for Claude computer use interactions.

    This function handles the back-and-forth between:
    1. Sending user messages to Claude
    2. Claude requesting to use tools
    3. Your app executing those tools
    4. Sending tool results back to Claude
    """
    # Set up tools and API parameters
    client = Anthropic(api_key=api_key)
    beta_flag = "computer-use-2025-01-24" if "20250124" in tool_version else "computer-use-2024-10-22"

    # Configure tools - you should already have these initialized elsewhere
    tools = [
        {"type": f"computer_{tool_version}", "name": "computer", "display_width_px": 1024, "display_height_px": 768},
        {"type": f"text_editor_{tool_version}", "name": "str_replace_editor"},
        {"type": f"bash_{tool_version}", "name": "bash"}
    ]

    # Main agent loop (with iteration limit to prevent runaway API costs)
    iterations = 0
    while True and iterations < max_iterations:
        iterations += 1
        # Set up optional thinking parameter (for Claude Sonnet 3.7)
        thinking = None
        if thinking_budget:
            thinking = {"type": "enabled", "budget_tokens": thinking_budget}

        # Call the Claude API
        response = client.beta.messages.create(
            model=model,
            max_tokens=max_tokens,
            messages=messages,
            tools=tools,
            betas=[beta_flag],
            thinking=thinking
        )

        # Add Claude's response to the conversation history
        response_content = response.content
        messages.append({"role": "assistant", "content": response_content})

        # Check if Claude used any tools
        tool_results = []
        for block in response_content:
            if block.type == "tool_use":
                # In a real app, you would execute the tool here
                # For example: result = run_tool(block.name, block.input)
                result = {"result": "Tool executed successfully"}

                # Format the result for Claude
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result
                })

        # If no tools were used, Claude is done - return the final messages
        if not tool_results:
            return messages

        # Add tool results to messages for the next iteration with Claude
        messages.append({"role": "user", "content": tool_results})
The loop continues until either Claude responds without requesting any tools (task completion) or the maximum iteration limit is reached. This safeguard prevents potential infinite loops that could result in unexpected API costs.