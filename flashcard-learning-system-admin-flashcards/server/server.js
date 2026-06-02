const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'Flashcard Learning System API is running' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/flashcards', require('./routes/flashcardRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error('Database connection error:', error.message);
    process.exit(1);
  });
