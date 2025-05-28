// Global type definitions for Electron API
interface Window {
  electronAPI: {
    chatWithClaude: (data: { 
      message: string; 
      includeScreenshot: boolean;
      windowId?: string;
    }) => Promise<{
      success: boolean
      messages?: any[]
      finalResponse?: string
      error?: string
    }>
    takeScreenshot: () => Promise<{
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
    getWindows: () => Promise<{
      success: boolean
      windows?: Array<{
        id: string
        name: string
        appName: string
        thumbnail: string
      }>
      error?: string
    }>
  }
} 