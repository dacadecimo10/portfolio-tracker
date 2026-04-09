import express from 'express';
import cors from 'cors';
import portfolioRoutes from './routes/portfolio.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/portfolio', portfolioRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Portfolio Tracker backend running on http://localhost:${PORT}`);
});
