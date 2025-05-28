const { app, BrowserWindow, ipcMain, desktopCapturer, screen: electronScreen, globalShortcut, Tray, Menu } = require('electron')
const path = require('path')
const Anthropic = require('@anthropic-ai/sdk')
const Store = require('electron-store')
const { config } = require('dotenv')
const fs = require('fs')
const { exec } = require('child_process')

// Load environment variables
config()

// Initialize store for persistent settings
const store = new Store()

// Global variable for Anthropic client
let anthropic: any = null

// Function to initialize Anthropic client
function initializeAnthropic() {
  const apiKey = (process.env.ANTHROPIC_API_KEY || store.get('apiKey')) as string | undefined
  
  if (!apiKey) {
    console.warn('No API key found for Anthropic. Please set ANTHROPIC_API_KEY env var or configure in settings.')
    anthropic = null
    return
  }
  
  try {
    // The SDK might export as default or as a named export
    const AnthropicClass = Anthropic.default || Anthropic
    anthropic = new AnthropicClass({
      apiKey: apiKey
    })
    console.log('Anthropic client initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Anthropic client:', error)
    anthropic = null
  }
}

// Initialize on startup
initializeAnthropic()

let mainWindow: typeof BrowserWindow | null = null
let tray: typeof Tray | null = null

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'darwin'
  })

  // Load the React app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Create system tray
function createTray() {
  try {
    const trayIconPath = path.join(__dirname, '../assets/tray-icon.png')
    
    // Check if tray icon exists, skip if not
    if (!fs.existsSync(trayIconPath) || !fs.statSync(trayIconPath).isFile()) {
      console.warn('Tray icon not found or not a valid image file, skipping tray creation')
      return
    }
    
    tray = new Tray(trayIconPath)
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Assistant',
        click: () => {
          if (mainWindow) {
            mainWindow.show()
            mainWindow.focus()
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit()
        }
      }
    ])
    
    tray.setToolTip('Claude Desktop Assistant')
    tray.setContextMenu(contextMenu)
    
    tray.on('click', () => {
      if (mainWindow) {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
      }
    })
  } catch (error) {
    console.error('Failed to create tray:', error)
  }
}

// Get display info for computer use
function getDisplayInfo() {
  const primaryDisplay = electronScreen.getPrimaryDisplay()
  return {
    width: primaryDisplay.size.width,
    height: primaryDisplay.size.height
  }
}

// Resize image to optimal dimensions for Claude
async function resizeScreenshot(base64Image: string, targetWidth: number = 1280): Promise<string> {
  // For now, return the original image
  // In production, you'd use a library like jimp or sharp to resize
  // But since we had issues with native dependencies, we'll handle this client-side
  return base64Image
}

// Get list of available windows
async function getWindows(): Promise<Array<{id: string, name: string, appName: string, thumbnail: string}>> {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      fetchWindowIcons: true,
      thumbnailSize: { width: 150, height: 150 }
    })
    
    // Filter out non-capturable windows and add screen option
    const windows = sources
      .filter((source: any) => {
        // Include screens and windows that have valid names
        return source.id.startsWith('screen:') || 
               (source.name && source.name.trim() !== '' && !source.name.includes('WGC'))
      })
      .map((source: any) => ({
        id: source.id,
        name: source.name,
        appName: source.appName || (source.id.startsWith('screen:') ? 'Screen' : 'Unknown'),
        thumbnail: source.thumbnail ? source.thumbnail.toDataURL() : ''
      }))
    
    console.log(`Found ${windows.length} capturable windows/screens`)
    return windows
  } catch (error) {
    console.error('Error getting windows:', error)
    return []
  }
}

// Take a screenshot for computer use
async function takeScreenshot(sourceId?: string): Promise<string> {
  try {
    const sources = await desktopCapturer.getSources({
      types: sourceId ? ['window'] : ['screen'],
      thumbnailSize: getDisplayInfo()
    })
    
    let source
    if (sourceId) {
      source = sources.find((s: any) => s.id === sourceId)
      if (!source) {
        throw new Error(`Window with id ${sourceId} not found`)
      }
    } else {
      if (sources.length === 0) {
        throw new Error('No screen sources available')
      }
      source = sources[0]
    }
    
    const screenshot = source.thumbnail.toPNG().toString('base64')
    
    // For ultrawide monitors, we should resize the screenshot
    const displayInfo = getDisplayInfo()
    if (displayInfo.width > 2560) {
      console.log('Ultrawide monitor detected, screenshot may need resizing for optimal Claude performance')
      // TODO: Implement actual resizing when we can add image processing libraries
    }
    
    return screenshot
  } catch (error) {
    console.error('Screenshot error:', error)
    throw error
  }
}

// Execute text editor tool
async function executeTextEditorTool(toolInput: any) {
  console.log('Executing text editor tool:', toolInput)
  
  // For now, we'll simulate the text editor operations
  console.log(`Would perform text editor action: ${toolInput.command}`)
  return { success: true, message: 'Text editor command simulated' }
}

// Execute computer tool
async function executeComputerTool(toolInput: any) {
  console.log('Executing computer tool:', toolInput)
  
  /**
   * NOTE: Real computer automation requires native dependencies like robotjs
   * which have build issues on Windows. Alternatives:
   * 
   * 1. Use Windows PowerShell commands via exec() for automation
   * 2. Use Electron's built-in webContents.sendInputEvent() for apps
   * 3. Create a separate native module or use pre-built binaries
   * 4. Use alternative libraries like nut.js (with pre-built binaries)
   * 
   * For now, we're using PowerShell automation where possible
   */
  
  try {
    const action = toolInput.action
    
    switch (action) {
      case 'screenshot':
        return await takeScreenshot()
        
      case 'click':
      case 'left_click':
        // Use PowerShell to click at coordinates
        const [x, y] = toolInput.coordinate || [0, 0]
        if (process.platform === 'win32') {
          await executePowerShellClick(x, y)
        }
        return { success: true }
        
      case 'right_click':
        const [rx, ry] = toolInput.coordinate || [0, 0]
        if (process.platform === 'win32') {
          await executePowerShellRightClick(rx, ry)
        }
        return { success: true }
        
      case 'middle_click':
        const [mx, my] = toolInput.coordinate || [0, 0]
        if (process.platform === 'win32') {
          await executePowerShellMiddleClick(mx, my)
        }
        return { success: true }
        
      case 'double_click':
        const [dx, dy] = toolInput.coordinate || [0, 0]
        if (process.platform === 'win32') {
          await executePowerShellDoubleClick(dx, dy)
        }
        return { success: true }
        
      case 'triple_click':
        const [tx, ty] = toolInput.coordinate || [0, 0]
        if (process.platform === 'win32') {
          await executePowerShellTripleClick(tx, ty)
        }
        return { success: true }
        
      case 'left_mouse_down':
        if (process.platform === 'win32') {
          await executePowerShellMouseDown()
        }
        return { success: true }
        
      case 'left_mouse_up':
        if (process.platform === 'win32') {
          await executePowerShellMouseUp()
        }
        return { success: true }
        
      case 'left_click_drag':
        const start = toolInput.start_coordinate || [0, 0]
        const end = toolInput.coordinate || [0, 0]
        if (process.platform === 'win32') {
          await executePowerShellDrag(start[0], start[1], end[0], end[1])
        }
        return { success: true }
        
      case 'type':
        // Use PowerShell to type text
        if (process.platform === 'win32' && toolInput.text) {
          await executePowerShellType(toolInput.text)
        }
        return { success: true }
        
      case 'key':
        // Use PowerShell to send key combinations
        if (process.platform === 'win32' && (toolInput.key || toolInput.text)) {
          await executePowerShellKey(toolInput.key || toolInput.text)
        }
        return { success: true }
        
      case 'hold_key':
        // Hold key for specified duration
        if (process.platform === 'win32' && toolInput.text && toolInput.duration) {
          await executePowerShellHoldKey(toolInput.text, toolInput.duration)
        }
        return { success: true }
        
      case 'scroll':
        // Enhanced scroll with direction control
        const scrollCoord = toolInput.coordinate || [0, 0]
        const direction = toolInput.scroll_direction || 'down'
        const amount = toolInput.scroll_amount || 5
        if (process.platform === 'win32') {
          await executePowerShellScroll(scrollCoord[0], scrollCoord[1], direction, amount)
        }
        return { success: true }
        
      case 'mouse_move':
        const [moveX, moveY] = toolInput.coordinate || [0, 0]
        if (process.platform === 'win32') {
          await executePowerShellMouseMove(moveX, moveY)
        }
        return { success: true }
        
      case 'cursor_position':
        // Get current cursor position
        if (process.platform === 'win32') {
          return await executePowerShellGetCursorPosition()
        }
        return { x: 0, y: 0 }
        
      case 'wait':
        const duration = toolInput.duration || 1
        await new Promise(resolve => setTimeout(resolve, duration * 1000))
        console.log(`Waited for ${duration} seconds`)
        return { success: true }
        
      default:
        throw new Error(`Unknown computer action: ${action}`)
    }
  } catch (error) {
    console.error('Computer tool error:', error)
    throw error
  }
}

// Execute bash command
async function executeBashTool(toolInput: any): Promise<string> {
  const command = toolInput.command
  console.log('Executing bash command:', command)
  
  return new Promise((resolve, reject) => {
    const shell = process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
    exec(command, { shell }, (error: any, stdout: any, stderr: any) => {
      if (error) {
        reject(new Error(`Command failed: ${stderr || error.message}`))
      } else {
        resolve(stdout || 'Command executed successfully')
      }
    })
  })
}

// PowerShell automation helpers for Windows
async function executePowerShellClick(x: number, y: number): Promise<void> {
  const script = `
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class MouseOps {
      [DllImport("user32.dll")]
      public static extern bool SetCursorPos(int X, int Y);
      [DllImport("user32.dll")]
      public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, int dwExtraInfo);
      public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
      public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    }
"@
    [MouseOps]::SetCursorPos(${x}, ${y})
    [MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    [MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
  `
  
  return new Promise((resolve, reject) => {
    exec(script, { shell: 'powershell.exe' }, (error: any) => {
      if (error) {
        console.error('Click error:', error)
        reject(error)
      } else {
        console.log(`Clicked at ${x}, ${y}`)
        resolve()
      }
    })
  })
}

async function executePowerShellRightClick(x: number, y: number): Promise<void> {
  const script = `
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class MouseOps {
      [DllImport("user32.dll")]
      public static extern bool SetCursorPos(int X, int Y);
      [DllImport("user32.dll")]
      public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, int dwExtraInfo);
      public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
      public const uint MOUSEEVENTF_RIGHTUP = 0x0010;
    }
"@
    [MouseOps]::SetCursorPos(${x}, ${y})
    [MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0)
    [MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0)
  `
  
  return new Promise((resolve, reject) => {
    exec(script, { shell: 'powershell.exe' }, (error: any) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

async function executePowerShellMiddleClick(x: number, y: number): Promise<void> {
  const script = `
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class MouseOps {
      [DllImport("user32.dll")]
      public static extern bool SetCursorPos(int X, int Y);
      [DllImport("user32.dll")]
      public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, int dwExtraInfo);
      public const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
      public const uint MOUSEEVENTF_MIDDLEUP = 0x0040;
    }
"@
    [MouseOps]::SetCursorPos(${x}, ${y})
    [MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_MIDDLEDOWN, 0, 0, 0, 0)
    [MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_MIDDLEUP, 0, 0, 0, 0)
  `
  
  return new Promise((resolve, reject) => {
    exec(script, { shell: 'powershell.exe' }, (error: any) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

async function executePowerShellDoubleClick(x: number, y: number): Promise<void> {
  await executePowerShellClick(x, y)
  await new Promise(resolve => setTimeout(resolve, 50))
  await executePowerShellClick(x, y)
}

async function executePowerShellTripleClick(x: number, y: number): Promise<void> {
  await executePowerShellClick(x, y)
  await new Promise(resolve => setTimeout(resolve, 50))
  await executePowerShellClick(x, y)
  await new Promise(resolve => setTimeout(resolve, 50))
  await executePowerShellClick(x, y)
}

async function executePowerShellMouseDown(): Promise<void> {
  const script = `
    Add-Type @"
    using System.Runtime.InteropServices;
    public class MouseOps {
      [DllImport("user32.dll")]
      public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, int dwExtraInfo);
      public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    }
"@
    [MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
  `
  
  return new Promise((resolve, reject) => {
    exec(script, { shell: 'powershell.exe' }, (error: any) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

async function executePowerShellMouseUp(): Promise<void> {
  const script = `
    Add-Type @"
    using System.Runtime.InteropServices;
    public class MouseOps {
      [DllImport("user32.dll")]
      public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, int dwExtraInfo);
      public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    }
"@
    [MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
  `
  
  return new Promise((resolve, reject) => {
    exec(script, { shell: 'powershell.exe' }, (error: any) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

async function executePowerShellDrag(startX: number, startY: number, endX: number, endY: number): Promise<void> {
  const script = `
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    using System.Threading;
    public class MouseOps {
      [DllImport("user32.dll")]
      public static extern bool SetCursorPos(int X, int Y);
      [DllImport("user32.dll")]
      public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, int dwExtraInfo);
      public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
      public const uint MOUSEEVENTF_LEFTUP = 0x0004;
      
      public static void DragMouse(int x1, int y1, int x2, int y2) {
        SetCursorPos(x1, y1);
        Thread.Sleep(100);
        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
        Thread.Sleep(100);
        SetCursorPos(x2, y2);
        Thread.Sleep(100);
        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
      }
    }
"@
    [MouseOps]::DragMouse(${startX}, ${startY}, ${endX}, ${endY})
  `
  
  return new Promise((resolve, reject) => {
    exec(script, { shell: 'powershell.exe' }, (error: any) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

async function executePowerShellMouseMove(x: number, y: number): Promise<void> {
  const script = `
    Add-Type @"
    using System.Runtime.InteropServices;
    public class MouseOps {
      [DllImport("user32.dll")]
      public static extern bool SetCursorPos(int X, int Y);
    }
"@
    [MouseOps]::SetCursorPos(${x}, ${y})
  `
  
  return new Promise((resolve, reject) => {
    exec(script, { shell: 'powershell.exe' }, (error: any) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

async function executePowerShellGetCursorPosition(): Promise<{ x: number, y: number }> {
  const script = `
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class MouseOps {
      [DllImport("user32.dll")]
      public static extern bool GetCursorPos(out POINT lpPoint);
      
      public struct POINT {
        public int X;
        public int Y;
      }
      
      public static string GetPos() {
        POINT p;
        GetCursorPos(out p);
        return p.X + "," + p.Y;
      }
    }
"@
    [MouseOps]::GetPos()
  `
  
  return new Promise((resolve, reject) => {
    exec(script, { shell: 'powershell.exe' }, (error: any, stdout: any) => {
      if (error) {
        reject(error)
      } else {
        const [x, y] = stdout.trim().split(',').map(Number)
        resolve({ x, y })
      }
    })
  })
}

async function executePowerShellScroll(x: number, y: number, direction: string, amount: number): Promise<void> {
  const wheelDelta = direction === 'up' || direction === 'left' ? 120 : -120
  const isHorizontal = direction === 'left' || direction === 'right'
  
  const script = `
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class MouseOps {
      [DllImport("user32.dll")]
      public static extern bool SetCursorPos(int X, int Y);
      [DllImport("user32.dll")]
      public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, int dwExtraInfo);
      public const uint MOUSEEVENTF_WHEEL = 0x0800;
      public const uint MOUSEEVENTF_HWHEEL = 0x1000;
    }
"@
    [MouseOps]::SetCursorPos(${x}, ${y})
    for($i = 0; $i -lt ${amount}; $i++) {
      [MouseOps]::mouse_event(${isHorizontal ? '[MouseOps]::MOUSEEVENTF_HWHEEL' : '[MouseOps]::MOUSEEVENTF_WHEEL'}, 0, 0, ${wheelDelta}, 0)
      Start-Sleep -Milliseconds 50
    }
  `
  
  return new Promise((resolve, reject) => {
    exec(script, { shell: 'powershell.exe' }, (error: any) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

async function executePowerShellHoldKey(key: string, duration: number): Promise<void> {
  // This is a simplified version - holding keys continuously is complex in SendKeys
  const script = `
    Add-Type -AssemblyName System.Windows.Forms
    $endTime = (Get-Date).AddSeconds(${duration})
    while ((Get-Date) -lt $endTime) {
      [System.Windows.Forms.SendKeys]::SendWait("${key}")
      Start-Sleep -Milliseconds 50
    }
  `
  
  return new Promise((resolve, reject) => {
    exec(script, { shell: 'powershell.exe' }, (error: any) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

async function executePowerShellType(text: string): Promise<void> {
  // Escape special characters for PowerShell
  const escapedText = text.replace(/[\[\]{}()+^%~]/g, '{$&}')
  const script = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("${escapedText}")
  `
  
  return new Promise((resolve, reject) => {
    exec(script, { shell: 'powershell.exe' }, (error: any) => {
      if (error) {
        console.error('Type error:', error)
        reject(error)
      } else {
        console.log(`Typed: ${text}`)
        resolve()
      }
    })
  })
}

async function executePowerShellKey(key: string): Promise<void> {
  // Map common key names to SendKeys format
  const keyMap: { [key: string]: string } = {
    'Return': '{ENTER}',
    'Enter': '{ENTER}',
    'Tab': '{TAB}',
    'Escape': '{ESC}',
    'Backspace': '{BACKSPACE}',
    'Delete': '{DELETE}',
    'Up': '{UP}',
    'Down': '{DOWN}',
    'Left': '{LEFT}',
    'Right': '{RIGHT}',
    'Home': '{HOME}',
    'End': '{END}',
    'PageUp': '{PGUP}',
    'PageDown': '{PGDN}',
    'F1': '{F1}',
    'F2': '{F2}',
    'F3': '{F3}',
    'F4': '{F4}',
    'F5': '{F5}',
    'F6': '{F6}',
    'F7': '{F7}',
    'F8': '{F8}',
    'F9': '{F9}',
    'F10': '{F10}',
    'F11': '{F11}',
    'F12': '{F12}',
    'ctrl+a': '^a',
    'ctrl+c': '^c',
    'ctrl+v': '^v',
    'ctrl+x': '^x',
    'ctrl+z': '^z',
    'ctrl+s': '^s',
    'alt+Tab': '%{TAB}',
    'alt+F4': '%{F4}',
    'shift+Tab': '+{TAB}'
  }
  
  const sendKey = keyMap[key] || key
  const script = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("${sendKey}")
  `
  
  return new Promise((resolve, reject) => {
    exec(script, { shell: 'powershell.exe' }, (error: any) => {
      if (error) {
        console.error('Key error:', error)
        reject(error)
      } else {
        console.log(`Pressed key: ${key}`)
        resolve()
      }
    })
  })
}

// Computer use agent loop
async function runComputerUseLoop(initialMessage: string, includeScreenshot: boolean = false, windowId?: string) {
  // Check if anthropic is initialized
  if (!anthropic) {
    throw new Error('Anthropic client not initialized. Please configure your API key in settings.')
  }
  
  const displayInfo = getDisplayInfo()
  
  // For ultrawide monitors, use a scaled resolution
  const optimalWidth = Math.min(displayInfo.width, 1920)
  const optimalHeight = Math.min(displayInfo.height, 1080)
  
  // Configure tools for Claude 4 - using latest versions from docs
  const tools = [
    {
      type: "computer_20250124",
      name: "computer",
      display_width_px: optimalWidth,
      display_height_px: optimalHeight,
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
  ]
  
  // Build initial message
  const messages: any[] = []
  
  if (includeScreenshot) {
    const screenshot = await takeScreenshot(windowId)
    messages.push({
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: screenshot
          }
        },
        {
          type: "text",
          text: initialMessage
        }
      ]
    })
  } else {
    messages.push({
      role: "user",
      content: initialMessage
    })
  }
  
  // Agent loop
  const maxIterations = 10
  let iterations = 0
  
  while (iterations < maxIterations) {
    iterations++
    
    try {
      // Call Claude with computer use tools
      console.log('Calling Claude API with tools:', { tools, messageCount: messages.length })
      
      // Check again before making the API call
      if (!anthropic) {
        throw new Error('Anthropic client not properly initialized')
      }
      
      const response = await (anthropic as any).beta.messages.create({
        model: "claude-4-opus-20250514",  // Using Claude 4 as shown in docs
        max_tokens: 2000,
        messages: messages,
        tools: tools,
        betas: ["computer-use-2025-01-24"],  // Latest beta flag
        thinking: { 
          type: "enabled", 
          budget_tokens: 1024  // Fixed: was missing colon
        }
      })
      
      console.log('Claude response received:', { contentLength: response.content.length })
      
      // Add Claude's response to conversation
      messages.push({
        role: "assistant",
        content: response.content
      })
      
      // Check if Claude used any tools
      const toolResults: any[] = []
      let usedTools = false
      
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          usedTools = true
          
          try {
            let result
            
            switch (block.name) {
              case 'computer':
                result = await executeComputerTool(block.input)
                break
              case 'str_replace_based_edit_tool':  // Claude 4 tool name
                result = await executeTextEditorTool(block.input)
                break
              case 'bash':
                result = await executeBashTool(block.input)
                break
              default:
                result = { error: `Unknown tool: ${block.name}` }
            }
            
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: typeof result === 'string' ? result : JSON.stringify(result)
            })
            
            // Send progress to renderer
            mainWindow?.webContents.send('tool-used', {
              tool: block.name,
              input: block.input,
              iteration: iterations
            })
            
          } catch (error) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify({ 
                error: error instanceof Error ? error.message : 'Unknown error' 
              })
            })
          }
        }
      }
      
      // If no tools were used, we're done
      if (!usedTools) {
        return {
          success: true,
          messages: messages,
          finalResponse: response.content.find((b: any) => b.type === 'text')?.text || 'Task completed'
        }
      }
      
      // Add tool results to conversation
      messages.push({
        role: "user",
        content: toolResults
      })
      
    } catch (error) {
      console.error('Agent loop error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messages: messages
      }
    }
  }
  
  return {
    success: false,
    error: 'Maximum iterations reached',
    messages: messages
  }
}

// IPC handlers
ipcMain.handle('get-windows', async () => {
  try {
    const windows = await getWindows()
    return {
      success: true,
      windows: windows
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('chat-with-claude', async (_event: any, { message, includeScreenshot, windowId }: { message: string; includeScreenshot: boolean; windowId?: string }) => {
  try {
    const result = await runComputerUseLoop(message, includeScreenshot, windowId)
    return result
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('take-screenshot', async (_event: any, windowId?: string) => {
  try {
    const screenshot = await takeScreenshot(windowId)
    return {
      success: true,
      data: screenshot
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('get-settings', () => {
  return {
    apiKey: store.get('apiKey'),
    visionInterval: store.get('visionInterval', 3000),
    deleteScreenshots: store.get('deleteScreenshots', true)
  }
})

ipcMain.handle('save-settings', (_event: any, settings: any) => {
  Object.entries(settings).forEach(([key, value]) => {
    store.set(key, value)
  })
  
  // Reinitialize Anthropic client if API key changed
  if (settings.apiKey) {
    initializeAnthropic()
  }
  
  return { success: true }
})

// App event handlers
app.whenReady().then(() => {
  createWindow()
  createTray()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
} 