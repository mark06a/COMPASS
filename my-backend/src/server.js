const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Core Functional Modules
app.use('/api/alumni', require('./routes/alumni'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chairperson', require('./routes/chairperson'));

// Core Analytical Modules
app.use('/api/surveys', require('./routes/surveys'));
app.use('/api/alignment', require('./routes/alignment'));
app.use('/api/competency', require('./routes/competency'));
app.use('/api/curriculum', require('./routes/curriculum'));
app.use('/api/reports', require('./routes/reports'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'COMPASS API active and routes mounted.' });
});

module.exports = app;