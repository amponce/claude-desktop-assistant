import React from 'react'
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import HistoryIcon from '@mui/icons-material/History'
import { format } from 'date-fns'
import { useStore } from '../store/useStore'

const History: React.FC = () => {
  const { analysisHistory, clearHistory, setCurrentAnalysis } = useStore()
  const [selectedItem, setSelectedItem] = React.useState<any>(null)
  const [clearDialogOpen, setClearDialogOpen] = React.useState(false)

  const handleView = (item: any) => {
    setSelectedItem(item)
  }

  const handleLoadToMain = (item: any) => {
    setCurrentAnalysis(item)
    // Navigate to dashboard - could add router navigation here
  }

  const handleClearHistory = () => {
    clearHistory()
    setClearDialogOpen(false)
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, 'MMM dd, yyyy HH:mm')
  }

  const getContextColor = (context: string) => {
    const colors: Record<string, any> = {
      general: 'default',
      coding: 'primary',
      writing: 'secondary',
      browsing: 'info',
      custom: 'warning'
    }
    return colors[context] || 'default'
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Analysis History
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<ClearAllIcon />}
          onClick={() => setClearDialogOpen(true)}
          disabled={analysisHistory.length === 0}
        >
          Clear History
        </Button>
      </Box>

      {analysisHistory.length === 0 ? (
        <Paper 
          elevation={0}
          sx={{ 
            p: 6, 
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <HistoryIcon sx={{ fontSize: 80, opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No analysis history yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your screen analysis results will appear here
          </Typography>
        </Paper>
      ) : (
        <Paper 
          elevation={0}
          sx={{ 
            p: 2,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <List>
            {analysisHistory.map((item, index) => (
              <ListItem
                key={item.id}
                secondaryAction={
                  <Box>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleView(item)}
                      sx={{ mr: 1 }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Box>
                }
                disablePadding
                sx={{ mb: 1 }}
              >
                <ListItemButton
                  onClick={() => handleLoadToMain(item)}
                  sx={{
                    borderRadius: 2,
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          Analysis #{analysisHistory.length - index}
                        </Typography>
                        <Chip 
                          label={item.context} 
                          size="small" 
                          color={getContextColor(item.context)}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(item.timestamp)}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* View Dialog */}
      <Dialog
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedItem && (
          <>
            <DialogTitle>
              Analysis Details - {formatDate(selectedItem.timestamp)}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Screenshot
                  </Typography>
                  <img 
                    src={`data:image/png;base64,${selectedItem.screenshot}`}
                    alt="Screenshot"
                    style={{ 
                      width: '100%', 
                      borderRadius: 8,
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Analysis Result
                  </Typography>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      background: 'rgba(0, 0, 0, 0.3)',
                      maxHeight: 400,
                      overflow: 'auto'
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace'
                      }}
                    >
                      {selectedItem.analysis.content?.[0]?.text || 'No analysis available'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedItem(null)}>Close</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  handleLoadToMain(selectedItem)
                  setSelectedItem(null)
                }}
              >
                Load to Dashboard
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Clear History Confirmation Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
      >
        <DialogTitle>Clear Analysis History?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete all {analysisHistory.length} analysis results. 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleClearHistory} 
            color="error" 
            variant="contained"
          >
            Clear History
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default History 