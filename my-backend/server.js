// server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse incoming JSON requests
app.use(express.json());

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running successfully!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});