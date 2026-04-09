import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import portfolioRoutes from './routes/portfolio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/portfolio', portfolioRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve React build — express.static is safe even if the dir doesn't exist yet
const frontendBuild = join(__dirname, '../frontend/build');
app.use(express.static(frontendBuild));

// Catch-all: always registered so Railway health checks always get a response
app.get('*', (req, res) => {
  res.sendFile(join(frontendBuild, 'index.html'), (err) => {
    if (err) res.status(200).json({ status: 'ok', frontend: 'not built' });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend build path: ${frontendBuild}`);
});
