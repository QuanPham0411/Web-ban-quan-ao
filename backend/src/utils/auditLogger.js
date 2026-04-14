const { pool } = require('../db');

const buildActor = (user) => ({
  id: Number(user?.id || 0) || null,
  email: String(user?.email || ''),
  role: String(user?.role || ''),
});

const logAdminAction = async ({
  actor,
  action,
  entityType,
  entityId,
  ip,
  details,
  connection,
}) => {
  const db = connection || pool;
  const safeActor = buildActor(actor);
  const safeAction = String(action || '').trim();
  const safeEntityType = String(entityType || '').trim();
  const safeEntityId = String(entityId || '').trim();
  const safeIp = String(ip || '').trim();

  if (!safeAction || !safeEntityType) {
    return;
  }

  try {
    await db.query(
      `INSERT INTO audit_logs (
        actor_user_id, actor_email, actor_role, action, entity_type, entity_id, ip_address, details_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        safeActor.id,
        safeActor.email,
        safeActor.role,
        safeAction,
        safeEntityType,
        safeEntityId,
        safeIp,
        JSON.stringify(details || {}),
      ],
    );
  } catch {
    // Intentionally ignore audit logging failures to avoid blocking business operations.
  }
};

module.exports = {
  logAdminAction,
};
