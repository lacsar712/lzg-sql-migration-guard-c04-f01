import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Chip,
} from '@mui/material';
import { useApi } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import FindingsTable from '../components/FindingsTable';

const DIALECTS = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'transactsql', label: 'TransactSQL' },
];

export default function AnalyzePage() {
  const api = useApi();
  const { user } = useAuth();
  const location = useLocation();
  const preset = (location.state as any)?.preset;

  const [dialect, setDialect] = useState('postgresql');
  const [sql, setSql] = useState('DROP TABLE users;');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preset?.sql) {
      setSql(preset.sql);
      if (preset.dialect) setDialect(preset.dialect);
    }
  }, [preset]);

  const canAnalyze = user?.role === 'analyst';

  async function runAnalyze() {
    setError('');
    setLoading(true);
    try {
      const res = await api.analyze({ dialect, sql });
      setResult(res);
    } catch (err: any) {
      setError(err.message || '分析失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        分析台
      </Typography>
      {!canAnalyze && (
        <Alert severity="info">
          当前账号为 reader，仅可查看历史；请使用 analyst 账号执行分析。
        </Alert>
      )}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>方言</InputLabel>
          <Select
            label="方言"
            value={dialect}
            onChange={(e) => setDialect(e.target.value)}
          >
            {DIALECTS.map((d) => (
              <MenuItem key={d.value} value={d.value}>
                {d.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={runAnalyze}
          disabled={!canAnalyze || loading || !sql.trim()}
        >
          {loading ? '分析中…' : 'Analyze'}
        </Button>
      </Stack>
      <TextField
        label="SQL"
        multiline
        minRows={10}
        maxRows={24}
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        fullWidth
        InputProps={{
          sx: {
            fontFamily: '"IBM Plex Mono", Consolas, monospace',
            fontSize: 14,
          },
        }}
      />
      {error && <Alert severity="error">{error}</Alert>}
      {result && (
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <Typography variant="h6">结果</Typography>
            <Chip
              label={result.ok ? '通过' : '未通过'}
              color={result.ok ? 'success' : 'error'}
              size="small"
            />
            {result.summary && (
              <Typography variant="body2" color="text.secondary">
                error {result.summary.error} · warning {result.summary.warning} ·
                info {result.summary.info}
              </Typography>
            )}
          </Stack>
          <FindingsTable findings={result.findings || []} />
        </Box>
      )}
    </Stack>
  );
}
