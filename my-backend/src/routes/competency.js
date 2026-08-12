const express = require('express');
const router = express.Router();
const { authenticateAndScope } = require('../middleware/auth');

// GET: Mean Competency Ratings & Recommendations
router.get('/rankings', authenticateAndScope, async (req, res) => {
  try {
    const { data: responses, error } = await req.supabase
      .from('competency_evaluations')
      .select('competency_name, utilization_rating');

    if (error) throw error;

    // Group & Compute Mean Rating (Mean = Sum(X) / N)
    const grouped = {};
    responses.forEach(({ competency_name, utilization_rating }) => {
      if (!grouped[competency_name]) grouped[competency_name] = [];
      grouped[competency_name].push(utilization_rating);
    });

    const results = Object.keys(grouped).map((name) => {
      const ratings = grouped[name];
      const mean = Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2));

      let recommendation = 'Maintain';
      if (mean < 3.40) recommendation = 'Review / Strengthen';
      else if (mean >= 4.21) recommendation = 'Maintain / Highlight';

      return { competency: name, meanRating: mean, recommendation };
    });

    return res.status(200).json({ competencies: results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute competency utilization.', details: err.message });
  }
});

module.exports = router;