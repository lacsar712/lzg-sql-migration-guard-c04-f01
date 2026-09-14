import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Toolbar,
  Typography,
  Tab,
  Tabs,
} from '@mui/material';
import { useAuth } from '../auth/AuthContext';

const tabs = [
  { path: '/analyze', label: '分析台' },
  { path: '/rules', label: '规则说明' },
  { path: '/history', label: '历史' },
  { path: '/fixtures', label: '示例库' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const current = tabs.findIndex((t) => location.pathname.startsWith(t.path));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#0f4c81' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            SQL Migration Guard
          </Typography>
          <Chip
            size="small"
            label={`${user?.username} · ${user?.role}`}
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', mr: 2 }}
          />
          <Button
            color="inherit"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            退出
          </Button>
        </Toolbar>
        <Tabs
          value={current < 0 ? 0 : current}
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ px: 2, bgcolor: 'rgba(0,0,0,0.12)' }}
        >
          {tabs.map((t) => (
            <Tab
              key={t.path}
              label={t.label}
              component={RouterLink}
              to={t.path}
            />
          ))}
        </Tabs>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
