import React from 'react'
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import ChatIcon from '@mui/icons-material/Chat'
import SettingsIcon from '@mui/icons-material/Settings'
import HistoryIcon from '@mui/icons-material/History'
import { motion } from 'framer-motion'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { path: '/', icon: <ChatIcon />, label: 'Chat' },
    { path: '/history', icon: <HistoryIcon />, label: 'History' },
    { path: '/settings', icon: <SettingsIcon />, label: 'Settings' },
  ]

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        background: 'rgba(18, 18, 18, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 0, mr: 4, fontWeight: 600 }}>
          Claude Assistant
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          {navItems.map((item) => (
            <motion.div
              key={item.path}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconButton
                color={location.pathname === item.path ? 'primary' : 'inherit'}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {item.icon}
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {item.label}
                </Typography>
              </IconButton>
            </motion.div>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header 