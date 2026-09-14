import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Chip,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useApi } from '../api/client';

export default function HistoryPage() {
  const api = useApi();
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .history()
      .then((res) => setItems(res.items || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        历史记录
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>时间</TableCell>
              <TableCell>方言</TableCell>
              <TableCell>摘要</TableCell>
              <TableCell>结果</TableCell>
              <TableCell>findings</TableCell>
              <TableCell>用户</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  {new Date(item.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>{item.dialect}</TableCell>
                <TableCell>
                  <Link component={RouterLink} to={`/history/${item.id}`}>
                    {item.sqlSummary}
                  </Link>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={item.ok ? 'ok' : 'fail'}
                    color={item.ok ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>{item.findingCount}</TableCell>
                <TableCell>{item.username || '-'}</TableCell>
              </TableRow>
            ))}
            {!items.length && (
              <TableRow>
                <TableCell colSpan={6}>暂无历史</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
