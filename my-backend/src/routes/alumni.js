const express = require('express');
const router = express.Router();
const { authenticateAndScope } = require('../middleware/auth');

// GET: Aggregated Alumni Metrics & Profile Completion Rate
router.get('/metrics', authenticateAndScope, async (req, res) => {
  try {
    // Total Alumni Query
    const { count: totalAlumni, error: errTotal } = await req.supabase
      .from('alumni_profiles')
      .select('*', { count: 'exact', head: true });

    // Completed Profiles Query
    const { count: completedProfiles, error: errCompleted } = await req.supabase
      .from('alumni_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_profile_completed', true);

    if (errTotal || errCompleted) throw errTotal || errCompleted;

    // Computational Logic (as specified in Chapter 3)
    const profileCompletionRate = totalAlumni > 0 
      ? Number(((completedProfiles / totalAlumni) * 100).toFixed(2)) 
      : 0;

    return res.status(200).json({
      totalAlumni: totalAlumni || 0,
      completedProfiles: completedProfiles || 0,
      profileCompletionRate: `${profileCompletionRate}%`
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to compute alumni metrics.', details: error.message });
  }
});

module.exports = router;