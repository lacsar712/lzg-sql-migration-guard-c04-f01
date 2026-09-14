import { useEffect, useState } from 'react';
import {
  Alert,
  Chip,
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

export default function RulesPage() {
  const api = useApi();
  const [rules, setRules] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .rules()
      .then((res) => setRules(res.rules || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        规则说明
      </Typography>
      <Typography variant="body2" color="text.secondary">
        规则基于 node-sql-parser AST 执行，可通过 policy 覆盖 severity 或关闭。
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ruleId</TableCell>
              <TableCell>默认级别</TableCell>
              <TableCell>描述</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.map((r) => (
              <TableRow key={r.ruleId}>
                <TableCell>
                  <code>{r.ruleId}</code>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={r.defaultSeverity}
                    color={
                      r.defaultSeverity === 'error'
                        ? 'error'
                        : r.defaultSeverity === 'warning'
                          ? 'warning'
                          : 'info'
                    }
                  />
                </TableCell>
                <TableCell>{r.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
