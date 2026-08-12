const express = require('express');
const router = express.Router();
const { authenticateAndScope } = require('../middleware/auth');

// GET: Job-Program Alignment Rate & Misalignment Analytics
router.get('/metrics', authenticateAndScope, async (req, res) => {
  try {
    const { programId } = req.query;

    const { data: employedGraduates, error } = await req.supabase
      .from('employment_records')
      .select('alignment_status, occupation_title, industry')
      .eq('program_id', programId);

    if (error) throw error;

    const totalEmployed = employedGraduates.length;
    const relatedCount = employedGraduates.filter(
      (g) => g.alignment_status === 'Directly Related' || g.alignment_status === 'Partially Related'
    ).length;

    const alignmentRate = totalEmployed > 0 
      ? Number(((relatedCount / totalEmployed) * 100).toFixed(1)) 
      : 0;

    return res.status(200).json({
      totalEmployed,
      relatedCount,
      alignmentRate: `${alignmentRate}%`,
      misalignmentRate: `${(100 - alignmentRate).toFixed(1)}%`
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute alignment metrics.', details: err.message });
  }
});

module.exports = router;