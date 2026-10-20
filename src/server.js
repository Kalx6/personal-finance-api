import 'dotenv/config';
import app from './app.js';

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in environment. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/api/v1`);
});
