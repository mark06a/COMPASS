// src/routes/admin.js
const express = require('express');
const router = express.Router();
const { authenticateAndScope } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

// Enforce Auth & Role Restriction across all Admin Endpoints
router.use(authenticateAndScope);
router.use(authorizeRoles('Super Administrator', 'Institution Administrator'));

/**
 * @route   GET /api/admin/workspaces
 * @desc    Get all institutional workspaces & system utilization metrics
 */
router.get('/workspaces', async (req, res) => {
  try {
    const { data: workspaces, error, count } = await req.supabase
      .from('workspaces')
      .select('*', { count: 'exact' });

    if (error) throw error;

    return res.status(200).json({
      totalWorkspaces: count || 0,
      workspaces
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve workspaces.', details: err.message });
  }
});

/**
 * @route   POST /api/admin/workspaces
 * @desc    Create and provision a new institutional/department workspace
 */
router.post('/workspaces', async (req, res) => {
  try {
    const { workspaceName, departmentCode, institutionId, scope } = req.body;

    if (!workspaceName || !institutionId) {
      return res.status(400).json({ error: 'workspaceName and institutionId are required fields.' });
    }

    const { data, error } = await req.supabase
      .from('workspaces')
      .insert([
        {
          workspace_name: workspaceName,
          department_code: departmentCode,
          institution_id: institutionId,
          scope: scope || 'department',
          status: 'active'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ message: 'Workspace created successfully.', workspace: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create workspace.', details: err.message });
  }
});

/**
 * @route   POST /api/admin/assign-role
 * @desc    Assign user roles and workspace scope (Role-Based User Management)
 */
router.post('/assign-role', async (req, res) => {
  try {
    const { targetUserId, assignedRole, workspaceId } = req.body;

    if (!targetUserId || !assignedRole) {
      return res.status(400).json({ error: 'targetUserId and assignedRole are required.' });
    }

    // Update user metadata in Supabase Auth via RPC or Profiles table
    const { data, error } = await req.supabase
      .from('user_profiles')
      .update({
        role: assignedRole,
        workspace_id: workspaceId,
        updated_at: new Date()
      })
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ message: 'User role updated successfully.', userProfile: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to assign user role.', details: err.message });
  }
});

/**
 * @route   GET /api/admin/platform-status
 * @desc    Monitor platform health, active users, and system metrics
 */
router.get('/platform-status', async (req, res) => {
  try {
    const { count: activeUsers } = await req.supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: totalSurveys } = await req.supabase
      .from('tracer_surveys')
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({
      platformStatus: 'Operational',
      activeUsers: activeUsers || 0,
      totalTracerSurveys: totalSurveys || 0,
      databaseLatency: 'Normal',
      timestamp: new Date()
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch platform status.', details: err.message });
  }
});

module.exports = router;