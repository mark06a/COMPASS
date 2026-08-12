const express = require('express');
const router = express.Router();
const { authenticateAndScope } = require('../middleware/auth');

// GET: Curriculum Outcome Evaluation (Likert Scale Analytics)
router.get('/evaluations', authenticateAndScope, async (req, res) => {
  try {
    const { programId } = req.query;

    const { data: responses, error } = await req.supabase
      .from('curriculum_evaluations')
      .select('program_outcome_id, rating')
      .eq('program_id', programId);

    if (error) throw error;

    // Group ratings by Program Outcome ID
    const grouped = responses.reduce((acc, curr) => {
      acc[curr.program_outcome_id] = acc[curr.program_outcome_id] || [];
      if (curr.rating !== null && curr.rating !== undefined) {
        acc[curr.program_outcome_id].push(curr.rating);
      }
      return acc;
    }, {});

    const results = Object.keys(grouped).map((poId) => {
      const ratings = grouped[poId];
      const sum = ratings.reduce((a, b) => a + b, 0);
      const meanRating = ratings.length > 0 ? Number((sum / ratings.length).toFixed(2)) : 0;
      
      // Health Score computation: (Mean Rating / 5.00) * 100
      const healthScore = Number(((meanRating / 5.0) * 100).toFixed(1));

      // Qualitative Interpretation Mapping
      let status = 'Poor / Priority Area';
      if (meanRating >= 4.21) status = 'Excellent';
      else if (meanRating >= 3.41) status = 'Very Good';
      else if (meanRating >= 2.61) status = 'Good / Satisfactory';
      else if (meanRating >= 1.81) status = 'Fair / Needs Review';

      return {
        programOutcomeId: poId,
        meanRating,
        healthScore: `${healthScore}%`,
        evaluationStatus: status,
        totalRespondents: ratings.length
      };
    });

    return res.status(200).json({ outcomes: results });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process curriculum analytics.', details: error.message });
  }
});

module.exports = router;