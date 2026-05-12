import express from 'express';
import dotenv from 'dotenv';
import reviewRoute from './routes/review.route';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use('/api', reviewRoute);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sdet-apis' });
});

app.listen(PORT, () => {
  console.log(`SDET APIs running on port ${PORT}`);
});