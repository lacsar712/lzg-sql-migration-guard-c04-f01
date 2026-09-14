import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';
import { AuthProvider } from './auth/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0f4c81' },
    secondary: { main: '#c45c26' },
    background: { default: '#f3f6f9' },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", "PingFang SC", sans-serif',
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
