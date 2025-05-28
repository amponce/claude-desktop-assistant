import { create } from 'zustand'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  toolUsage?: Array<{
    tool: string
    input: any
  }>
}

interface AppState {
  // API and settings
  apiKey: string
  visionMode: boolean
  visionInterval: number
  deleteScreenshots: boolean
  
  // Chat state
  messages: Message[]
  isLoading: boolean
  currentTool: string | null
  
  // Window selection
  availableWindows: Array<{
    id: string
    name: string
    appName: string
    thumbnail: string
  }>
  selectedWindowId: string | null
  
  // Actions
  setApiKey: (key: string) => void
  setVisionMode: (enabled: boolean) => void
  setVisionInterval: (interval: number) => void
  setDeleteScreenshots: (enabled: boolean) => void
  addMessage: (message: Message) => void
  setMessages: (messages: Message[]) => void
  setLoading: (loading: boolean) => void
  setCurrentTool: (tool: string | null) => void
  setAvailableWindows: (windows: Array<{id: string; name: string; appName: string; thumbnail: string}>) => void
  setSelectedWindowId: (windowId: string | null) => void
  clearMessages: () => void
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  apiKey: '',
  visionMode: false,
  visionInterval: 3000,
  deleteScreenshots: true,
  messages: [],
  isLoading: false,
  currentTool: null,
  availableWindows: [],
  selectedWindowId: null,
  
  // Actions
  setApiKey: (key: string) => set({ apiKey: key }),
  setVisionMode: (enabled: boolean) => set({ visionMode: enabled }),
  setVisionInterval: (interval: number) => set({ visionInterval: interval }),
  setDeleteScreenshots: (enabled: boolean) => set({ deleteScreenshots: enabled }),
  addMessage: (message: Message) => set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages: Message[]) => set({ messages }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setCurrentTool: (tool: string | null) => set({ currentTool: tool }),
  setAvailableWindows: (windows: Array<{id: string; name: string; appName: string; thumbnail: string}>) => set({ availableWindows: windows }),
  setSelectedWindowId: (windowId: string | null) => set({ selectedWindowId: windowId }),
  clearMessages: () => set({ messages: [] }),
  
  loadSettings: async () => {
    try {
      const settings = await window.electronAPI.getSettings()
      set({
        apiKey: settings.apiKey || '',
        visionInterval: settings.visionInterval || 3000,
        deleteScreenshots: settings.deleteScreenshots !== false
      })
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  },
  
  saveSettings: async () => {
    const state = get()
    try {
      await window.electronAPI.saveSettings({
        apiKey: state.apiKey,
        visionInterval: state.visionInterval,
        deleteScreenshots: state.deleteScreenshots
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }
})) 