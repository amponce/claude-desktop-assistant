import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  TextField,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useStore } from '../store/useStore'

const Settings: React.FC = () => {
  const { settings, updateSettings } = useStore()
  const [localSettings, setLocalSettings] = useState(settings)
  const [showApiKey, setShowApiKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSave = async () => {
    try {
      await window.electronAPI.saveSettings(localSettings)
      updateSettings(localSettings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const handleChange = (key: keyof typeof localSettings, value: any) => {
    setLocalSettings({ ...localSettings, [key]: value })
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mt: 3,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Typography variant="h6" gutterBottom>
          API Configuration
        </Typography>
        
        <TextField
          fullWidth
          label="Anthropic API Key"
          type={showApiKey ? 'text' : 'password'}
          value={localSettings.apiKey || ''}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowApiKey(!showApiKey)}
                  edge="end"
                >
                  {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            )
          }}
          helperText="Your Anthropic API key for Claude access"
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Vision Mode Settings
        </Typography>

        <TextField
          fullWidth
          label="Vision Update Interval (ms)"
          type="number"
          value={localSettings.visionInterval || 3000}
          onChange={(e) => handleChange('visionInterval', parseInt(e.target.value))}
          sx={{ mb: 3 }}
          inputProps={{ min: 1000, max: 10000, step: 1000 }}
          helperText="How often to update screenshots in vision mode (1-10 seconds)"
        />

        <FormControlLabel
          control={
            <Switch
              checked={localSettings.deleteScreenshots !== false}
              onChange={(e) => handleChange('deleteScreenshots', e.target.checked)}
            />
          }
          label="Auto-delete screenshots after processing"
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={<SaveIcon />}
            sx={{ 
              background: 'linear-gradient(45deg, #3f51b5 30%, #f50057 90%)',
              boxShadow: '0 3px 5px 2px rgba(63, 81, 181, .3)',
            }}
          >
            Save Settings
          </Button>
        </Box>

        {saved && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Settings saved successfully!
          </Alert>
        )}
      </Paper>

      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mt: 3,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Computer Use Examples
        </Typography>
        
        <Box sx={{ display: 'grid', gap: 1, mt: 2 }}>
          <Typography variant="body2">
            <strong>"Open Chrome and go to GitHub"</strong> - Claude will open the browser and navigate
          </Typography>
          <Typography variant="body2">
            <strong>"What's on my screen?"</strong> - Enable vision mode to let Claude see
          </Typography>
          <Typography variant="body2">
            <strong>"Create a new file called test.py"</strong> - Claude can create and edit files
          </Typography>
          <Typography variant="body2">
            <strong>"Run ls -la in the terminal"</strong> - Claude can execute commands
          </Typography>
        </Box>
      </Paper>

      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mt: 3,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Typography variant="h6" gutterBottom>
          About
        </Typography>
        
        <Typography variant="body2" paragraph>
          Claude Desktop Assistant v1.0.0
        </Typography>
        <Typography variant="body2" color="text.secondary">
          An AI-powered desktop assistant that uses Claude's computer use capabilities 
          to control your computer, analyze your screen, and help with tasks.
        </Typography>
      </Paper>
    </Box>
  )
}

export default Settings 