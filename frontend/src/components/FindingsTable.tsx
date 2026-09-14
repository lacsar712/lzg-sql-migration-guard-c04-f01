import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

const colorMap: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  error: 'error',
  warning: 'warning',
  info: 'info',
};

export default function FindingsTable({ findings }: { findings: any[] }) {
  if (!findings?.length) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography color="text.secondary">无 findings，SQL 通过检查。</Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>级别</TableCell>
            <TableCell>ruleId</TableCell>
            <TableCell>说明</TableCell>
            <TableCell>位置</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {findings.map((f, i) => (
            <TableRow key={`${f.ruleId}-${i}`}>
              <TableCell>
                <Chip
                  size="small"
                  label={f.severity}
                  color={colorMap[f.severity] || 'default'}
                />
              </TableCell>
              <TableCell>
                <code>{f.ruleId}</code>
              </TableCell>
              <TableCell>{f.message}</TableCell>
              <TableCell>
                {f.location
                  ? `#${f.location.statementIndex}${
                      f.location.snippet ? ` · ${f.location.snippet}` : ''
                    }`
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
