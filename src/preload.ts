import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Chat with Claude using computer use
  chatWithClaude: (data: { message: string; includeScreenshot: boolean; windowId?: string }) => 
    ipcRenderer.invoke('chat-with-claude', data),
  
  // Take a screenshot
  takeScreenshot: (windowId?: string) => ipcRenderer.invoke('take-screenshot', windowId),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  
  // Event listeners
  onToolUsed: (callback: (data: any) => void) => {
    ipcRenderer.on('tool-used', (_event, data) => callback(data))
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
  
  // Get windows
  getWindows: () => ipcRenderer.invoke('get-windows'),
})

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      chatWithClaude: (data: { message: string; includeScreenshot: boolean; windowId?: string }) => Promise<{
        success: boolean
        messages?: any[]
        finalResponse?: string
        error?: string
      }>
      takeScreenshot: (windowId?: string) => Promise<{
        success: boolean
        data?: string
        error?: string
      }>
      getSettings: () => Promise<{
        apiKey?: string
        visionInterval?: number
        deleteScreenshots?: boolean
      }>
      saveSettings: (settings: any) => Promise<{ success: boolean }>
      onToolUsed: (callback: (data: any) => void) => void
      removeAllListeners: (channel: string) => void
      getWindows: () => Promise<{ windows: string[] }>
    }
  }
} 