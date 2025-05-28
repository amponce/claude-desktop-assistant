import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Button,
  ListItemIcon
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ComputerIcon from '@mui/icons-material/Computer'
import TerminalIcon from '@mui/icons-material/Terminal'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import WindowIcon from '@mui/icons-material/Window'
import RefreshIcon from '@mui/icons-material/Refresh'
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useAppStore } from '../store/appStore'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  includesScreenshot?: boolean
  toolsUsed?: Array<{ tool: string; input: any }>
}

const Chat: React.FC = () => {
  const { settings } = useStore()
  const { 
    availableWindows, 
    selectedWindowId, 
    setAvailableWindows, 
    setSelectedWindowId 
  } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [visionMode, setVisionMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)
  const [toolActions, setToolActions] = useState<Array<{ tool: string; input: any; iteration: number }>>([])
  const [windowMenuAnchor, setWindowMenuAnchor] = useState<null | HTMLElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Listen for tool usage
    window.electronAPI.onToolUsed((data) => {
      setToolActions(prev => [...prev, data])
    })

    return () => {
      window.electronAPI.removeAllListeners('tool-used')
    }
  }, [])

  useEffect(() => {
    // Load available windows on mount
    loadWindows()
  }, [])

  const loadWindows = async () => {
    try {
      const result = await window.electronAPI.getWindows()
      if (result.success && result.windows) {
        setAvailableWindows(result.windows)
      }
    } catch (err) {
      console.error('Failed to load windows:', err)
    }
  }

  const getSelectedWindow = () => {
    return availableWindows.find(w => w.id === selectedWindowId)
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !settings.apiKey) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      includesScreenshot: visionMode
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setError(null)
    setToolActions([])

    try {
      const result = await window.electronAPI.chatWithClaude({
        message: inputMessage,
        includeScreenshot: visionMode,
        windowId: selectedWindowId || undefined
      })

      if (result.success && result.finalResponse) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.finalResponse,
          timestamp: new Date(),
          toolsUsed: toolActions
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        setError(result.error || 'Failed to get response from Claude')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'computer':
        return <ComputerIcon fontSize="small" />
      case 'bash':
        return <TerminalIcon fontSize="small" />
      default:
        return undefined
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">
            Claude Computer Use Chat
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<WindowIcon />}
              onClick={(e) => setWindowMenuAnchor(e.currentTarget)}
              sx={{ minWidth: 200 }}
            >
              {selectedWindowId ? (getSelectedWindow()?.name || 'Unknown Window') : 'Full Screen'}
            </Button>
            <FormControlLabel
              control={
                <Switch
                  checked={visionMode}
                  onChange={(e) => setVisionMode(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VisibilityIcon fontSize="small" />
                  Vision Mode
                </Box>
              }
            />
          </Box>
        </Box>
        {visionMode && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Screenshots will be included with your messages for Claude to see {selectedWindowId ? 'the selected window' : 'your full screen'}
          </Typography>
        )}

        {/* Window Selection Menu */}
        <Menu
          anchorEl={windowMenuAnchor}
          open={Boolean(windowMenuAnchor)}
          onClose={() => setWindowMenuAnchor(null)}
          PaperProps={{
            sx: {
              maxHeight: 400,
              width: 300
            }
          }}
        >
          <MenuItem onClick={() => { setSelectedWindowId(null); setWindowMenuAnchor(null); }}>
            <ListItemIcon>
              <DesktopWindowsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Full Screen" 
              secondary="Capture entire desktop"
            />
          </MenuItem>
          <Divider />
          {availableWindows.map((window) => (
            <MenuItem 
              key={window.id} 
              onClick={() => { 
                setSelectedWindowId(window.id); 
                setWindowMenuAnchor(null); 
              }}
              selected={selectedWindowId === window.id}
            >
              <ListItemIcon>
                <WindowIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={window.name} 
                secondary={window.appName}
                primaryTypographyProps={{ noWrap: true }}
                secondaryTypographyProps={{ noWrap: true }}
              />
            </MenuItem>
          ))}
          <Divider />
          <MenuItem onClick={() => { loadWindows(); }}>
            <ListItemIcon>
              <RefreshIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Refresh Windows" />
          </MenuItem>
        </Menu>
      </Paper>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {!settings.apiKey && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please configure your API key in Settings to start chatting
          </Alert>
        )}

        <List sx={{ pb: 2 }}>
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      maxWidth: '80%',
                      width: '100%',
                      flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                        width: 36,
                        height: 36
                      }}
                    >
                      {message.role === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                    </Avatar>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        flex: 1,
                        background: message.role === 'user' 
                          ? 'rgba(63, 81, 181, 0.1)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid',
                        borderColor: message.role === 'user'
                          ? 'primary.dark'
                          : 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                      
                      {message.includesScreenshot && (
                        <Chip
                          icon={<VisibilityIcon />}
                          label="Includes Screenshot"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                      
                      {message.toolsUsed && message.toolsUsed.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Divider sx={{ mb: 1 }} />
                          <Typography variant="caption" color="text.secondary">
                            Tools Used:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            {message.toolsUsed.map((tool, index) => (
                              <Chip
                                key={index}
                                icon={getToolIcon(tool.tool)}
                                label={tool.tool}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </Box>
                </ListItem>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <ListItem sx={{ justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Claude is working...
                  {toolActions.length > 0 && (
                    <Box component="span" sx={{ ml: 1 }}>
                      (Used {toolActions.length} tool{toolActions.length > 1 ? 's' : ''})
                    </Box>
                  )}
                </Typography>
              </Box>
            </ListItem>
          )}
        </List>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              visionMode 
                ? "Ask Claude about what's on your screen..." 
                : "Ask Claude to help with your computer..."
            }
            disabled={isLoading || !settings.apiKey}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          />
          <IconButton
            color="primary"
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || !settings.apiKey}
            sx={{
              background: 'linear-gradient(45deg, #3f51b5 30%, #f50057 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #3f51b5 30%, #f50057 90%)',
                opacity: 0.8
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Claude can control your computer, run commands, and help with tasks. 
          {visionMode ? ' Vision mode is ON - Claude can see your screen.' : ' Enable vision mode to share your screen.'}
        </Typography>
      </Paper>
    </Box>
  )
}

export default Chat 