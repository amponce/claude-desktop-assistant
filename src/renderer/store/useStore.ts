import { create } from 'zustand'

interface Settings {
  apiKey?: string
  visionInterval: number
  deleteScreenshots: boolean
}

interface AnalysisResult {
  id: string
  timestamp: Date
  screenshot: string
  analysis: any
  context: string
}

interface AppState {
  // Settings
  settings: Settings
  updateSettings: (settings: Partial<Settings>) => void
  
  // Analysis results
  analysisHistory: AnalysisResult[]
  addAnalysisResult: (result: AnalysisResult) => void
  clearHistory: () => void
  
  // UI state
  isAnalyzing: boolean
  setIsAnalyzing: (analyzing: boolean) => void
  currentAnalysis: AnalysisResult | null
  setCurrentAnalysis: (analysis: AnalysisResult | null) => void
}

export const useStore = create<AppState>((set) => ({
  // Settings
  settings: {
    visionInterval: 3000,
    deleteScreenshots: true,
  },
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  // Analysis results
  analysisHistory: [],
  addAnalysisResult: (result) =>
    set((state) => ({
      analysisHistory: [result, ...state.analysisHistory].slice(0, 100), // Keep last 100
    })),
  clearHistory: () => set({ analysisHistory: [] }),

  // UI state
  isAnalyzing: false,
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  currentAnalysis: null,
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
})) 