import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { useApi } from '../api/client';

const riskColor: Record<string, 'error' | 'warning' | 'success'> = {
  dangerous: 'error',
  caution: 'warning',
  safe: 'success',
};

export default function FixturesPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .fixtures()
      .then((res) => setFixtures(res.fixtures || []))
      .catch((err) => setError(err.message));
  }, []);

  function fillEditor(fx: any) {
    navigate('/analyze', {
      state: { preset: { sql: fx.sql, dialect: fx.dialect } },
    });
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        示例库
      </Typography>
      <Typography variant="body2" color="text.secondary">
        内置危险 / 注意 / 安全 SQL fixture，一键填入分析台。
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        }}
      >
        {fixtures.map((fx) => (
          <Card key={fx.id} variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Typography fontWeight={700}>{fx.title}</Typography>
                <Chip
                  size="small"
                  label={fx.risk}
                  color={riskColor[fx.risk] || 'default'}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {fx.description}
              </Typography>
              <Typography
                component="pre"
                sx={{
                  m: 0,
                  p: 1,
                  bgcolor: '#f7f9fc',
                  borderRadius: 1,
                  fontSize: 12,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                }}
              >
                {fx.sql}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => fillEditor(fx)}>
                填入分析台
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Stack>
  );
}
