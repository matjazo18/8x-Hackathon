import express from 'express';
import authRouter from './routes/auth';
import modelsRouter from './routes/models';
import syncRouter from './routes/sync';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use('/auth', authRouter);
app.use('/models', modelsRouter);
app.use('/sync', syncRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
