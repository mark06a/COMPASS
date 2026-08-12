const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/alumni', require('./routes/alumni'));
app.use('/api/curriculum', require('./routes/curriculum'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'COMPASS Backend Active' });
});

// Start server locally (Vercel ignores app.listen when importing functions)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// CRITICAL FOR VERCEL
module.exports = app;