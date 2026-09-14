import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useApi } from '../api/client';
import FindingsTable from '../components/FindingsTable';

export default function HistoryDetailPage() {
  const { id } = useParams();
  const api = useApi();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api
      .historyDetail(id)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Typography>加载中…</Typography>;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h5" fontWeight={700}>
          历史详情
        </Typography>
        <Chip
          size="small"
          label={data.ok ? '通过' : '未通过'}
          color={data.ok ? 'success' : 'error'}
        />
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {data.dialect} · {new Date(data.createdAt).toLocaleString()} ·{' '}
        {data.username || '-'}
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography
          component="pre"
          sx={{
            m: 0,
            whiteSpace: 'pre-wrap',
            fontFamily: '"IBM Plex Mono", Consolas, monospace',
            fontSize: 13,
          }}
        >
          {data.sqlFull || data.sqlSummary}
        </Typography>
      </Paper>
      <FindingsTable findings={data.findings || []} />
    </Stack>
  );
}
