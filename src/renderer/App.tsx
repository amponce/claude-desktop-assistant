import { useEffect } from 'react'
import { Box, Container } from '@mui/material'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Chat from './pages/Chat'
import Settings from './pages/Settings'
import History from './pages/History'
import { useStore } from './store/useStore'

function App() {
  const { updateSettings } = useStore()

  useEffect(() => {
    // Load settings on app start
    window.electronAPI.getSettings().then((savedSettings) => {
      updateSettings(savedSettings)
    })
  }, [updateSettings])

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <Container 
          maxWidth="xl" 
          sx={{ 
            flex: 1, 
            overflow: 'auto',
            py: 3,
            px: { xs: 2, sm: 3 }
          }}
        >
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  )
}

export default App 