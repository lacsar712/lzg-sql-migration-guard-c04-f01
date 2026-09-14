import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useApi } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const api = useApi();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('analyst');
  const [password, setPassword] = useState('sql123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(username, password);
      login(res);
      navigate('/analyze');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(circle at 20% 20%, #d9e8f5, transparent 40%), radial-gradient(circle at 80% 0%, #f7e6d8, transparent 35%), #eef2f6',
      }}
    >
      <Card sx={{ width: 420, boxShadow: 4 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            SQL Migration Guard
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            粘贴 SQL → AST 规则检查 → 查看风险 findings
          </Typography>
          <Stack component="form" spacing={2} onSubmit={onSubmit}>
            <TextField
              label="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
            />
            <TextField
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? '登录中…' : '登录'}
            </Button>
            <Typography variant="caption" color="text.secondary">
              analyst/sql123456（可分析） · reader/read123456（只看历史）
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
