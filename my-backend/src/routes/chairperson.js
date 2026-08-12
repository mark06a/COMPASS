// src/routes/chairperson.js
const express = require('express');
const router = express.Router();
const { authenticateAndScope } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

// Enforce Auth & Role Restriction for Department Chairpersons
router.use(authenticateAndScope);
router.use(authorizeRoles('Department Chairperson', 'Institution Administrator', 'Super Administrator'));

/**
 * @route   GET /api/chairperson/department-scorecard
 * @desc    Consolidates department metrics (Employment, Alignment, Curriculum Health)
 */
router.get('/department-scorecard', async (req, res) => {
  try {
    const { departmentId, programId } = req.query;

    if (!departmentId && !programId) {
      return res.status(400).json({ error: 'Must provide departmentId or programId query parameters.' });
    }

    // 1. Fetch Employment & Alignment Stats
    const { data: employment } = await req.supabase
      .from('employment_records')
      .select('alignment_status, is_employed')
      .eq('department_id', departmentId);

    const totalGraduates = employment ? employment.length : 0;
    const employedCount = employment ? employment.filter(e => e.is_employed).length : 0;
    const alignedCount = employment ? employment.filter(e => e.alignment_status === 'Directly Related').length : 0;

    const employmentRate = totalGraduates > 0 ? ((employedCount / totalGraduates) * 100).toFixed(1) : 0;
    const alignmentRate = employedCount > 0 ? ((alignedCount / employedCount) * 100).toFixed(1) : 0;

    // 2. Fetch Curriculum Outcome Means
    const { data: evaluations } = await req.supabase
      .from('curriculum_evaluations')
      .select('rating')
      .eq('department_id', departmentId);

    let averageCurriculumRating = 0;
    if (evaluations && evaluations.length > 0) {
      const sum = evaluations.reduce((acc, curr) => acc + curr.rating, 0);
      averageCurriculumRating = (sum / evaluations.length).toFixed(2);
    }

    const curriculumHealthScore = ((averageCurriculumRating / 5.0) * 100).toFixed(1);

    return res.status(200).json({
      departmentId,
      scorecard: {
        totalGraduates,
        employmentRate: `${employmentRate}%`,
        jobProgramAlignmentRate: `${alignmentRate}%`,
        averageLikertRating: `${averageCurriculumRating} / 5.00`,
        curriculumHealthScore: `${curriculumHealthScore}%`,
        evaluationStatus: averageCurriculumRating >= 4.21 ? 'Excellent' : 'Satisfactory'
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate department scorecard.', details: err.message });
  }
});

/**
 * @route   GET /api/chairperson/survey-progress
 * @desc    Track survey response rates by graduation batch for the department
 */
router.get('/survey-progress', async (req, res) => {
  try {
    const { departmentId } = req.query;

    const { data: batchStats, error } = await req.supabase
      .from('tracer_survey_responses')
      .select('graduation_batch, status, count')
      .eq('department_id', departmentId);

    if (error) throw error;

    return res.status(200).json({
      departmentId,
      batchProgress: batchStats || []
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch survey progress.', details: err.message });
  }
});

/**
 * @route   GET /api/chairperson/actionable-recommendations
 * @desc    Extract curriculum competencies marked for strengthening or review
 */
router.get('/actionable-recommendations', async (req, res) => {
  try {
    const { departmentId } = req.query;

    const { data: recommendations, error } = await req.supabase
      .from('competency_evaluations')
      .select('competency_name, mean_rating, recommendation_status')
      .eq('department_id', departmentId)
      .lte('mean_rating', 3.40); // Mean <= 3.40 flags item for curriculum review

    if (error) throw error;

    return res.status(200).json({
      priorityAreasForReview: recommendations || []
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch recommendations.', details: err.message });
  }
});

module.exports = router;