const { createClient } = require('@supabase/supabase-js');

const authenticateAndScope = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
    }

    const token = authHeader.split(' ')[1];

    // Scoped client attached with user token for RLS enforcement
    const userClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error } = await userClient.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }

    // Attach user profile metadata to request
    req.user = user;
    req.institutionId = user.user_metadata?.institution_id;
    req.userRole = user.user_metadata?.role;
    req.supabase = userClient; // Inject client with RLS active

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Authentication middleware failure.', details: err.message });
  }
};

module.exports = { authenticateAndScope };